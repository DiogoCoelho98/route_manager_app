"""
Utility functions supporting route creation, elevation processing,
database interaction, validation, and static map generation.

This module includes:
    - SQLite database helpers
    - Authentication decorators
    - Elevation data handling and caching
    - Haversine distance calculations
    - Coordinate validation
    - Static map image generation
""" 


import json
import os
import openrouteservice
import sqlite3
from datetime import datetime
from functools import wraps
from math import atan2, cos, radians, sin, sqrt
import requests
from flask import flash, g, redirect, session
from staticmap import CircleMarker, Line, StaticMap



DATABASE = "route_manager.db"
ELEVATION_API_URL = "https://api.opentopodata.org/v1/mapzen"
elevation_cache = {}



# ===========================================================
#                    Database Interactions
# ===========================================================
def get_db():
    """
    Returns a connection to the SQLite database.
    Uses Flask's application context `g` to ensure one connection per request.
    """

    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row # Allows accessing columns by name
    return db

def close_connection(exception):
    """
    Closes the SQLite database connection at the end of a request.
    """

    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

def query_db(query, args = (), commit = False):
    """
    Executes a SQL query with optional arguments.

    Args:
        query (str): SQL query to execute.
        args (tuple): Parameters for SQL query.
        commit (bool): Whether to commit the transaction.

    Returns:
        list[sqlite3.Row] or None: Query results or None if committing.
    """

    connection = get_db()
    current = connection.cursor()
    current.execute(query, args)
    
    if commit:
        connection.commit()
    else:
        return current.fetchall()
    


# ===========================================================
#                    Authentication
# ===========================================================
def login_required(f):
    """
    Flask route decorator to ensure user is logged in.
    Redirects to login page if 'user_id' not in session.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in to access this page.", "error")
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function



# ===========================================================
#                    File Handling 
# ===========================================================
def allowed_files(filename):
    """
    Checks whether an uploaded file has a valid extension.

    Args:
        filename (str): The name of the uploaded file.
    Returns:
        bool: True if the extension is allowed, False otherwise.
    """

    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    return (
        "." in filename and 
        filename.rsplit(".", 1)[1].lower() in 
        ALLOWED_EXTENSIONS
        )



# ===========================================================
#                    Distance Calculation 
# ===========================================================
def haversine(coord1, coord2):
    """
    Calculates the great-circle distance between two coordinates 
    using the Haversine formula.

    Args:
        coord1 (dict): {'lat': float, 'lng': float}
        coord2 (dict): {'lat': float, 'lng': float}
    Returns:
        float: Distance in kilometers.
    """

    R = 6371.0  # Earth's radius in km

    lat1 = radians(coord1["lat"])
    lng1 = radians(coord1["lng"])
    lat2 = radians(coord2["lat"])
    lng2 = radians(coord2["lng"])

    dlat = lat2 - lat1
    dlng = lng2 - lng1

    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c

def calculate_distance(coords):
    """
    Calculates the total distance of a path 
    defined by multiple coordinates.

    Args:
        coords (list[dict]): List of coordinate 
        objects with 'lat' and 'lng'.
    Returns:
        float: Total distance in kilometers, rounded to 2 decimal places.
    """

    total_distance = 0.0

    for i in range(len(coords) - 1):
        total_distance += haversine(coords[i], coords[i + 1])

    return round(total_distance, 2)



# ===========================================================
#                    Elevation Calculations 
# ===========================================================
def get_elevations(coordinates, batch_size = 100):
    """
    Fetches elevation data for a list of coordinates using batch requests.
    Splits requests into batches to avoid exceeding URL length limits.
    Caches results in `elevation_cache` to avoid redundant requests.
    """
    uncached = [
        (coord["lat"], coord["lng"]) 
        for coord in coordinates 
        if (coord["lat"], coord["lng"]) not in elevation_cache
    ]

    if not uncached:
        return  # All elevations already cached

    for i in range(0, len(uncached), batch_size):
        batch = uncached[i:i + batch_size]
        locations_str = "|".join(f"{lat},{lng}" for lat, lng in batch)
        try:
            response = requests.get(ELEVATION_API_URL, params={"locations": locations_str})
            response.raise_for_status()
            data = response.json()
            
            results = data.get("results", [])
            for (lat, lng), result in zip(batch, results):
                elevation = result.get("elevation", 0)
                elevation_cache[(lat, lng)] = elevation
        
        except Exception as e:
            print(f"Elevation API batch error: {e}")
            for lat, lng in batch:
                elevation_cache[(lat, lng)] = 0



def calculate_elevation_stats(elevation_profile):
    """
    Calculates gain, loss, max and min elevation 
    from a profile list.

    Args:
        elevation_profile (list[dict]): List of {'elevation': float} items.
    Returns:
        tuple: (gain, loss, max_elevation, min_elevation)
    """

    if not elevation_profile:
        return 0, 0, 0, 0

    gain = 0.0
    loss = 0.0

    elevations = [p['elevation'] for p in elevation_profile]

    for i in range(1, len(elevations)):
        diff = elevations[i] - elevations[i - 1]
        if diff > 0:
            gain += diff
        else:
            loss += abs(diff)
        
    return (
        round(gain, 2),
        round(loss, 2),
        round(max(elevations), 2),
        round(min(elevations), 2)
    )



# ===========================================================
#                    Route Processing 
# ===========================================================
def process_route_internal(coordinates):
    """
    Calculates route metrics such as distance and elevation profile.

    Args:
        coordinates (list[dict]): List of {'lat': float, 'lng': float} points.
    Returns:
        dict: Calculated metrics (distance, elevation gain/loss, min/max/avg elevation).
    """
    try:
        distance = calculate_distance(coordinates)

        # Fetch all elevations in batches of 100
        get_elevations(coordinates, batch_size = 100)

        elevation_profile = [{
            "lat": coord["lat"],
            "lng": coord["lng"],
            "elevation": elevation_cache.get((coord["lat"], coord["lng"]), 0)
        } for coord in coordinates]

        total_elevation = sum(p['elevation'] for p in elevation_profile)
        avg_elevation = total_elevation / len(elevation_profile) if elevation_profile else 0
        gain, loss, max_elev, min_elev = calculate_elevation_stats(elevation_profile)

        return {
            "total_distance": distance,
            "elevation_gain": gain,
            "elevation_loss": loss,
            "max_elevation": max_elev,
            "min_elevation": min_elev,
            "average_elevation": round(avg_elevation, 2)
        }

    except Exception as e:
        print(f"Error processing route internally: {e}")
        return {
            "total_distance": 0,
            "elevation_gain": 0,
            "elevation_loss": 0,
            "max_elevation": 0,
            "min_elevation": 0,
            "average_elevation": 0
        }

def get_realistic_route(points, api_key, profile="foot-walking"):
    """
    Calls OpenRouteService Directions API to get a realistic route geometry.
    Args:
        points (list): List of {'lat': float, 'lng': float} dicts (start, waypoints, end)
        api_key (str): ORS API key.
        profile (str): Routing profile, e.g., 'foot-walking', 'driving-car'.
    Returns:
        list[dict]: List of {'lat': float, 'lng': float} points along the route.
    """

    client = openrouteservice.Client(key=api_key)
    coords = [[p["lng"], p["lat"]] for p in points] 
    route = client.directions(coords, profile = profile, format = "geojson")
    geometry = route['features'][0]['geometry']['coordinates']
    
    return [
        {"lat": lat, "lng": lng}
        for lng, lat in geometry
    ]



# ===========================================================
#                    Coordinate Validation 
# ===========================================================
def validate_coordinates(coordinates_json):
    """
    Validates and sanitizes raw coordinate JSON 
    into a proper list format.

    Args:
        coordinates_json (str): JSON string representing list of [lat, lng] pairs.
    Returns:
        list[list[float]]: Validated list of coordinate pairs rounded to 6 decimals.
    """

    try:
        # Try to load the string as a JSON object
        coords = json.loads(coordinates_json)

        if not isinstance(coords, list):
            raise ValueError("Coordinates should be a list.")

        valid_coords = []
        for pair in coords:
            if (
                isinstance(pair, list) and
                len(pair) == 2 and
                all(isinstance(p, (int, float)) for p in pair)
            ):
                valid_coords.append([round(float(pair[0]), 6), round(float(pair[1]), 6)])
            else:
                print(f"Invalid coordinate pair skipped: {pair}")
        
        return valid_coords

    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
    except ValueError as e:
        print(f"Invalid coordinates: {e}")
    
    return [] 



# ===========================================================
#                    Get Route Country 
# ===========================================================
def get_country_from_coords(lat, lng):
    """
    Uses Nominatim to reverse geocode a coordinate to a country name.
    Returns the country name as a string, or None if not found.
    """

    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": lat,
            "lon": lng,
            "format": "json",
            "zoom": 5,  # Country-level
            "addressdetails": 1,
        }
        headers = {
            "User-Agent": "RouteAppManager/1.0 (your@email.com)"
        }

        resp = requests.get(url, params = params, headers = headers, timeout = 5)
        resp.raise_for_status()
        data = resp.json()

        return data.get("address", {}).get("country")
    
    except Exception as e:
        print(f"Reverse geocoding failed: {e}")
        return None


    
# ===========================================================
#                    Utility: Float Parsing  
# ===========================================================
def parse_float(value):
    try:
        return round(float(value), 2)
    except (ValueError, TypeError):
        return 0.0



# ===========================================================
#                    Route Image Generation
# ===========================================================
def generate_route_image(validated_coords, waypoints = None, save_folder = 'static/images/routes'):
    """
    Generates a static map image of a route with start, end, and waypoint markers.
    validated_coords: list of (lat, lng) tuples
    waypoints: list of (lat, lng) tuples
    """

    if not validated_coords or len(validated_coords) < 2:
        return None

    m = StaticMap(600, 400)

    start_lat, start_lng = validated_coords[0]
    m.add_marker(CircleMarker((start_lng, start_lat), 'green', 12))


    print(f"Waypoints:{waypoints}", flush=True)
    if waypoints:
        for lat, lng in waypoints:
            m.add_marker(CircleMarker((lng, lat), 'yellow', 12))

    end_lat, end_lng = validated_coords[-1]
    m.add_marker(CircleMarker((end_lng, end_lat), 'red', 12))

    line_coords = [(lng, lat) for lat, lng in validated_coords]
    m.add_line(Line(line_coords, 'blue', 3))

    image = m.render()

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = f"route_{timestamp}.png"
    file_path = os.path.join(save_folder, filename)

    os.makedirs(save_folder, exist_ok=True)
    image.save(file_path, format='PNG')
    return filename



