"""
Main application module for managing user authentication, route creation,
profile management, and route-related functionality in a Flask web app.

This module includes:
    - User registration, login, and profile management
    - Route creation, viewing, editing, and deletion
    - Comment posting, editing, and deletion for routes
    - Static map generation for route visualization
    - Route data processing (distance, elevation, etc.)
    - API route for calculating route metrics from coordinates
"""


import json
import os
from dotenv import load_dotenv
from flask import (
    current_app,
    Flask,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from flask_cors import CORS
from helpers import (
    allowed_files,
    close_connection,
    generate_route_image,
    get_realistic_route,
    get_country_from_coords,
    login_required,
    parse_float,
    process_route_internal,
    query_db,
    validate_coordinates,
)

from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename



# Initialize Flask app
app = Flask(__name__)
CORS(app)                       # Enables front-end and back-end communication
app.secret_key = os.urandom(24) # Secure session encryption

load_dotenv()

# Config paths and API keys
UPLOAD_FOLDER = "static/images/users"
ROUTE_IMAGE_FOLDER = "static/images/routes"
ORS_API_KEY = os.getenv("ORS_API_KEY")

# Flask app config
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['ROUTE_IMAGE_FOLDER'] = ROUTE_IMAGE_FOLDER
app.config['ORS_API_KEY'] = ORS_API_KEY

if not os.path.exists(app.config['ROUTE_IMAGE_FOLDER']):
    os.makedirs(app.config['ROUTE_IMAGE_FOLDER'])


@app.teardown_appcontext
def teardown(exception):
    """
    Closes the database connection at the end of the request lifecycle.
    """
    close_connection(exception)


# ===========================================================
#                    Default Route
# ===========================================================
@app.route("/")
def index():
    user_id = session.get("user_id") 
    return render_template("index.html", user_id = user_id)



# ===========================================================
#                    Authentication Routes
# ===========================================================
@app.route("/register", methods=["GET", "POST"])
def register():
    """
    Handles user registration.

    GET: Renders registration form.
    POST: Validates and saves new user to the database.
    """

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()

        if not username or not email or not password:
            flash("All fields are required.", "error")
            return redirect("/register")

        if len(password) < 8:
            flash("Password must be at least 8 characters long.", "error")
            return redirect("/register")

        # (Optional) Add more advanced checks:
        # import re
        # if not re.match(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$', password):
        #     flash("Password must be at least 8 characters and contain both letters and numbers.", "error")
        #     return redirect("/register")

        # Check if username / email already exists 
        existing_user = query_db(
            "SELECT * from users WHERE username = ? OR email = ?",
            (username, email)
        )

        if existing_user:
            flash("Username or email already exists!", "error")
            return redirect("/register")

        hashed_password = generate_password_hash(password)
        default_image = "static/images/users/default_profile_image.png"

        query_db(
            """INSERT INTO users 
            (username, email, password, profile_picture) VALUES 
            (?, ?, ?, ?)""",
            (username, email, hashed_password, default_image),
            commit=True
        )

        flash("Registration successful! Please log in.", "success")
        return redirect("/login")

    return render_template("authentication/register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    """
    Handles user login.

    GET: Renders login form.
    POST: Authenticates credentials, starts user session.
    """

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            flash("Username and password are required.", "error")
            return redirect("/login")

        user = query_db(
            "SELECT * FROM users WHERE username = ?",
            (username,)
        )

        if user and check_password_hash(user[0]["password"], password):
            session["user_id"] = user[0]["id"]
            flash("Login successful!", "success")
            return redirect("/")
        else:
            flash("Invalid username or password.", "error")

    return render_template("authentication/login.html")

@app.route("/logout")
@login_required
def logout():
    """
    Logs the user out by clearing the session.
    """

    session.pop("user_id", None)
    flash("You have been logged out.", "success")
    return redirect("/")



# ===========================================================
#                    Profile Management Routes
# ===========================================================
@app.route("/profile")
@login_required
def profile():
    """
    Displays the current user's profile.
    """

    user = query_db(
        "SELECT username, email, profile_picture FROM users WHERE id = ?",
        (session["user_id"],)
    )

    if not user:
        flash("User not found.", "error")
        return redirect(url_for("index"))
    
    return render_template("profile/profile.html", user = user)

@app.route("/profile/edit", methods=["GET", "POST"])
@login_required
def edit_profile():
    """
    Allows the user to update profile details and upload a new profile picture.
    """

    user = query_db(
        "SELECT username, email, profile_picture FROM users WHERE id = ?",
        (session["user_id"],)
    )

    if not user:
        flash("User not found.", "error")
        return redirect(url_for("index"))

    if request.method == "POST":
        username = request.form.get("username").strip()
        email = request.form.get("email").strip()
        file = request.files.get("profile_picture")

        if not username or not email:
            flash("Username and email are required.", "error")
            return redirect(url_for("edit_profile"))

        no_changes = (
            username == user[0]["username"] and
            email == user[0]["email"] and
            (not file or file.filename == "")
        )

        if no_changes:
            flash("No changes detected.", "info")
            return redirect(url_for("edit_profile"))
        
        # Save new profile picture if uploaded
        if file and allowed_files(file.filename):
            file_name = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name).replace("\\", "/")
            file.save(file_path)

            query_db(
                "UPDATE users SET username = ?, email = ?, profile_picture = ? WHERE id = ?",
                (username, email, file_path, session["user_id"]),
                commit = True
            )
        else:
            query_db(
                "UPDATE users SET username = ?, email = ? WHERE id = ?",
                (username, email, session["user_id"]),
                commit = True
            )

        flash("Profile updated successfully!", "success")
        return redirect(url_for("profile"))

    return render_template("/profile/edit_profile.html", user = user)

@app.route("/profile/delete", methods=["GET", "POST"])
@login_required
def delete_account():
    """
    Deletes the user's account and all associated data:
    - Comments made by the user
    - Comments on the user's routes
    - The user's    
    - The user's route images
    - The user's profile picture
    - The user record

    GET: Renders a confirmation form.
    POST: Executes deletion.
    """

    if request.method == "POST":
        user_id = session["user_id"]

        # Delete comments made by the user 
        query_db(
            "DELETE FROM comments WHERE user_id = ?", 
            (user_id,), 
            commit=True
        )

        #  Get all routes (IDs and map_image_url) owned by the user 
        user_routes = query_db(
            "SELECT id, map_image_url FROM routes WHERE user_id = ?", 
            (user_id,)
        )

        #  Delete comments of those routes and remove associated images 
        for route in user_routes:
            rid = route[0]  # id
            map_image_url = route[1]  # map_image_url
            # Delete comments on this route
            query_db(
                "DELETE FROM comments WHERE route_id = ?", 
                (rid,), 
                commit=True
            )

            # Delete associated image file if it exists
            if map_image_url:
                image_path = os.path.join(app.config['ROUTE_IMAGE_FOLDER'], map_image_url)
                if os.path.exists(image_path):
                    os.remove(image_path)
                else:
                    print(f"File does not exist: {image_path}", flush=True)

        #  Delete the user's profile picture if it exists 
        user = query_db(
            "SELECT profile_picture FROM users WHERE id = ?",
            (user_id,)
        )

        if user and user[0][0]:  # profile_picture path
            profile_picture_path = user[0][0]
            # Only delete if it's not a default avatar
            if os.path.exists(profile_picture_path):
                os.remove(profile_picture_path)
            else:
                print(f"Profile picture does not exist: {profile_picture_path}")

        #  Delete the user's routes 
        query_db(
            "DELETE FROM routes WHERE user_id = ?", 
            (user_id,), 
            commit = True
        )

        #  Delete the user record 
        query_db(
            "DELETE FROM users WHERE id = ?", 
            (user_id,), 
            commit = True
        )

        session.pop("user_id", None)
        flash("Your account have been deleted successfully!", "success")
        return redirect(url_for("index"))

    return render_template("/profile/delete_profile.html")


@app.route("/profile/change-password", methods=["GET", "POST"])
@login_required
def change_password():
    """
    Allows the user to change their password after verifying the current one.
    """
    if request.method == "POST":
        current_password = request.form.get("current_password", "").strip()
        new_password = request.form.get("new_password", "").strip()
        confirm_password = request.form.get("confirm_password", "").strip()

        if not current_password or not new_password or not confirm_password:
            flash("All fields are required.", "error")
            return redirect(url_for("change_password"))

        user = query_db(
            "SELECT password FROM users WHERE id = ?",
            (session["user_id"],)
        )

        if not user:
            flash("User not found.", "error")
            return redirect(url_for("profile"))

        # Verify current password
        if not check_password_hash(user[0]["password"], current_password):
            flash("Current password is incorrect.", "error")
            return redirect(url_for("change_password"))

        # Check new password matches confirmation
        if new_password != confirm_password:
            flash("New passwords do not match.", "error")
            return redirect(url_for("change_password"))
        
        if len(new_password) < 8:
            flash("New password must be at least 8 characters long.", "error")
            return redirect(url_for("change_password"))

        # Prevent reusing the old password
        if check_password_hash(user[0]["password"], new_password):
            flash("New password must be different from the current password.", "error")
            return redirect(url_for("change_password"))

        query_db(
            "UPDATE users SET password = ? WHERE id = ?",
            (generate_password_hash(new_password), session["user_id"]),
            commit=True
        )

        flash("Password updated successfully!", "success")
        return redirect(url_for("profile"))

    return render_template("/profile/change_password.html")


@app.route("/my-routes")
@login_required
def my_routes():
    """
    Displays all routes created by the logged-in user.
    """

    user_id = session.get("user_id")
    my_routes = query_db(
        "SELECT * FROM routes WHERE user_id = ?", (user_id,)
    )
    return render_template("routes/my_routes.html", routes = my_routes, user_id = user_id)



# ===========================================================
#                    Route Routes
# ===========================================================
@app.route("/create", methods=["GET", "POST"])
@login_required
def create_route():
    """
    Create a new route by submitting coordinates, elevation data, and metadata.

    GET: Renders the route creation form.
    POST:
        - Validates and parses form inputs.
        - Generates a static map image of the route.
        - Stores the route in the database.
    """

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        description = request.form.get("description").strip()
        
        raw_coordinates = request.form.get("coordinates", "").strip()
        validated_coords = validate_coordinates(raw_coordinates)
        coordinates = json.dumps(validated_coords)
        
        # Parse numeric data
        total_distance = parse_float(request.form.get("total_distance", ""))
        elevation_gain = parse_float(request.form.get("elevation_gain", ""))
        elevation_loss = parse_float(request.form.get("elevation_loss", ""))
        max_elevation = parse_float(request.form.get("max_elevation", ""))
        min_elevation = parse_float(request.form.get("min_elevation", ""))
        avg_elevation = parse_float(request.form.get("avg_elevation", ""))

        image_filename = request.form.get("map_image_url")
        country = request.form.get("country", "").strip()

        if not name or not coordinates:
            flash("Name and coordinates are required.", "error")
            return redirect("/create")
        
        query_db(
            """
            INSERT INTO routes (
                user_id, name, description, coordinates, 
                elevation_gain, elevation_loss, max_elevation, 
                min_elevation, avg_elevation, total_distance, 
                map_image_urL, country
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session["user_id"], name, description, coordinates,
                elevation_gain, elevation_loss, max_elevation,
                min_elevation, avg_elevation, total_distance, 
                image_filename, country
                ),
                commit = True
                )
        
        flash("Route created successfully!", "success")
        return redirect("/routes")

    return render_template("routes/create_route.html")

@app.route("/routes")
@login_required
def all_routes():
    """
    Display a list of all routes created by all users.
    """

    routes = query_db("""
        SELECT routes.*, users.username, users.id 
        FROM routes 
        JOIN users ON 
        routes.user_id = users.id
    """)
    
    user_id = session.get("user_id")
    return render_template(
        "routes/all_routes.html", 
        routes = routes, 
        user_id = user_id
        )

@app.route("/route/<int:route_id>")
@login_required
def view_route(route_id):
    """
    View details of a specific route.
    """

    route = query_db(
        "SELECT * FROM routes WHERE id = ?", 
        (route_id,)
    )

    if not route:
        flash("Route not found.", "error")
        return redirect("/routes")
    
    coordinates = route[0]["coordinates"] 
    coordinates = validate_coordinates(coordinates)
    
    start_point = tuple(map(float, coordinates[0])) if coordinates else None  
    end_point = tuple(map(float, coordinates[-1])) if coordinates else None 

    comments = query_db(
        """
        SELECT 
            comments.id, 
            comments.comment, 
            comments.create_at, 
            comments.user_id, 
            users.username 
        FROM comments 
        JOIN users ON 
        comments.user_id = users.id WHERE 
        comments.route_id = ?
        """,
        (route_id,)
    )

    return render_template(
        "routes/view_route.html", 
        route = route, 
        comments = comments, 
        route_id = route_id,
        start_point = start_point,
        end_point = end_point
        )

@app.route("/route/<int:route_id>/edit", methods=["GET", "POST"])
@login_required
def edit_route(route_id):
    """
    Edit an existing route's information.

    GET: Loads the route form for editing.
    POST: Saves the updated route information to the database.
    """

    if request.method == "GET":
        route = query_db(
            "SELECT * FROM routes WHERE id = ? AND user_id = ?",
            (route_id, session["user_id"])
        )

        if not route:
            flash("Route not found or you do not have permission to edit it.", "error")
            return redirect(url_for("all_routes"))
    
        return render_template(
            "routes/edit_route.html", 
            route = route, 
            route_id = route_id
            )
    
    elif request.method == "POST":
        name = request.form.get("name").strip()
        description = request.form.get("description").strip()
        coordinates = request.form.get("coordinates").strip()
        total_distance = request.form.get("total_distance").strip()
        elevation_gain = request.form.get("elevation_gain").strip()
        elevation_loss = request.form.get("elevation_loss").strip()
        max_elevation = request.form.get("max_elevation").strip()
        min_elevation = request.form.get("min_elevation").strip()
        avg_elevation = request.form.get("avg_elevation").strip()

        if not name or not coordinates:
            flash("Name and coordinates are required.", "error")
            return redirect(url_for("edit_route", route_id=route_id))

        query_db(
            """UPDATE routes SET
            name = ?,
            description = ?,
            coordinates = ?,
            elevation_gain = ?,
            elevation_loss = ?,
            max_elevation = ?,
            min_elevation = ?,
            avg_elevation = ?,
            total_distance = ?
            WHERE id = ? AND 
            user_id = ?""",
            (name, description, coordinates,
             elevation_gain, elevation_loss,
             max_elevation, min_elevation,
             avg_elevation, total_distance,
             route_id, session["user_id"]),
            commit = True
        )

        flash("Route updated successfully!", "success")
        return redirect(url_for("all_routes"))

@app.route("/route/<int:route_id>/delete", methods=["GET", "POST"])
@login_required
def delete_route(route_id):
    """
    Delete a route and its associated map image.

    GET: Shows delete confirmation view.
    POST: Deletes the route and the image file from disk.
    """

    route = query_db(
        "SELECT * FROM routes WHERE id = ? AND user_id = ?",
        (route_id, session["user_id"])
    )

    if not route:
        flash("Route not found or permission denied.", "error")
        return redirect(url_for("all_routes"))
    
    map_image_url = route[0]["map_image_url"] or ""
    
    if request.method == "POST":
        # Delete associated comments
        query_db(
            "DELETE FROM comments WHERE route_id = ?",
            (route_id,),
            commit = True
        )

        # Delete associated image file
        if map_image_url:
            image_path = os.path.join(app.config['ROUTE_IMAGE_FOLDER'], map_image_url)
            if os.path.exists(image_path):
                os.remove(image_path)

        query_db(
            """DELETE FROM routes WHERE 
            id = ? AND 
            user_id = ?""",
            (route_id, session["user_id"]),
            commit=True
        )

        flash("Route deleted successfully!", "success")
        return redirect(url_for("all_routes"))

    
    return render_template(
        "routes/delete_route.html", 
        route_id = route_id, 
        route = route
        )



# ===========================================================
#                    Comment Routes
# ===========================================================
@app.route("/route/<int:route_id>/comment", methods=["POST"])
@login_required
def post_comment(route_id):
    """
    Post a comment on a specific route.

    POST: Accepts form comment input and saves it.
    """

    comment = request.form.get("comment").strip()
    user_id = session["user_id"]

    if not comment:
        flash("Comment cannot be empty.", "error")
        return redirect(url_for("view_route", route_id = route_id))

    query_db(
        """INSERT INTO comments 
        (route_id, user_id, comment) VALUES 
        (?, ?, ?)""",
        (route_id, user_id, comment),
        commit = True
    )

    flash("Comment added successfully!", "success")
    return redirect(url_for("view_route", route_id = route_id))

@app.route("/route/<int:route_id>/comment/<int:comment_id>/edit", methods = ["GET", "POST"])
@login_required
def edit_comment(route_id, comment_id):
    """
    Edit an existing comment.

    GET: Loads comment view for editing.
    POST: Updates the comment in the database.
    """

    comment = query_db(
        """SELECT 
            comments.comment, 
            comments.id FROM
        comments WHERE 
        id = ? AND 
        user_id = ?""",
        (comment_id, session["user_id"])
    )

    if not comment:
        flash("Comment not found or you do not have permission to edit it.", "error")
        return redirect(url_for("view_route", route_id = route_id))
    
    if request.method == "POST":
        new_comment = request.form.get("comment").strip()
        
        if not new_comment:
            flash("Comment can not be empty.", "error")
            return redirect(
                url_for(
                    "edit_comment", 
                    route_id = route_id, 
                    comment_id = comment_id
                    )
                )
        
        query_db(
            "UPDATE comments SET comment = ? WHERE id = ?",
            (new_comment, comment_id),
            commit = True
        )

        flash("Comment updated succesfully!", "success")
        return redirect(url_for("view_route", route_id = route_id))
    
    return render_template(
        "/routes/edit_comment.html", 
        comment = comment, 
        route_id = route_id, 
        comment_id = comment_id
        )

@app.route("/route/<int:route_id>/comment/<int:comment_id>/delete", methods = ["GET", "POST"])
@login_required
def delete_comment(route_id, comment_id):
    """
    Delete a comment posted by the user.

    GET: Confirms deletion.
    POST: Removes the comment from the database.
    """

    comment = query_db(
        """SELECT comments.id, comments.comment FROM
        comments WHERE
        comments.id = ? AND 
        comments.user_id = ?""",
        (comment_id, session["user_id"])
    )

    if not comment:
        flash("Comment not found or you do not have permission to delete it.", "error")
        return redirect(url_for("view_route", route_id = route_id))
    
    if request.method == "POST":
        query_db(
            "DELETE FROM comments WHERE id = ?",
        (comment_id,),
        commit = True
        )

        flash("Comment deleted successfully!", "success")
        return redirect(
            url_for(
                "view_route", 
                route_id = route_id
                )
            )
    
    return render_template(
        "routes/delete_comment.html", 
        comment = comment, 
        route_id = route_id, 
        comment_id = comment_id
        )
    


# ===========================================================
#                    Route Data Profile
# ===========================================================
@app.route('/get-route', methods=['POST'])
def get_route():
    """
    Processes incoming route coordinates and returns calculated route metrics.
    Uses realistic routing for geocoded routes (with or without waypoints),
    and treats drawn routes as custom polylines.
    """
    
    try:
        data = request.get_json()
        coordinates = data.get('coordinates', [])
        waypoints = data.get('waypoints', [])
        mode = data.get('mode', 'foot-walking')
        route_type = data.get('type', 'geocoded')

        # Validate coordinates
        if (not coordinates or not 
            all(isinstance(coord, dict) and 
                'lat' in coord and 
                'lng' in coord 
                for coord in coordinates)
                ):
            return jsonify({
                "status": "error", 
                "message": "Invalid coordinates format"
            }), 400

        # Validate waypoints
        if (waypoints and not 
            all(isinstance(wp, dict) and 
                'lat' in wp and 
                'lng' in wp 
                for wp in waypoints)
                ):
            return jsonify({
                "status": "error",
                "message": "Invalid waypoints format"
            }), 400

        # Geocoded mode (routing)
        if route_type == "geocoded":
            api_key = current_app.config["ORS_API_KEY"]
            
            try:
                route_geometry = get_realistic_route(
                    coordinates,
                    api_key,
                    profile=mode
                )
                if not route_geometry or len(route_geometry) < 2:
                    return jsonify({
                        "status": "error",
                        "message": "Failed to generate route geometry"
                    }), 400
                
                coordinates = route_geometry

            except Exception as e:
                return jsonify({
                    "status": "error",
                    "message": f"Routing API failed: {str(e)}"
                }), 500

        # Handle drawn mode (freehand polyline)
        elif route_type == "drawn":
            waypoints = []

        # Calculate route metrics
        route_details = process_route_internal(coordinates)

        # Generate static map image
        image_filename = generate_route_image(
            validated_coords=[(coord['lat'], coord['lng']) for coord in coordinates],
            waypoints=[(wp['lat'], wp['lng']) for wp in waypoints] if waypoints else [],
            save_folder='static/images/routes'
        )

        route_details["map_image_url"] = image_filename

        # Get country from first coordinate
        if coordinates and isinstance(coordinates[0], dict):
            lat, lng = coordinates[0]['lat'], coordinates[0]['lng']
            country = get_country_from_coords(lat, lng)
        else:
            country = None

        return jsonify({
            "status": "success",
            "coordinates": coordinates,
            "country": country,
            **route_details
        })

    except Exception as e:
        print(f"Route error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500







if __name__ == "__main__":
    app.run(debug = True)