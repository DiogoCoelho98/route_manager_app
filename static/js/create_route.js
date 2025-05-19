/**
 * Handles processing and injection of route data into the "Create Route" form
 * before submission on the Route Planner app.
 *
 * Workflow:
 *   - Reads route metadata from sessionStorage (populated by the route planning feature).
 *   - Parses and formats the data as needed.
 *   - Injects key route details into hidden form fields for backend processing (Flask).
 *   - Prevents submission if route data is missing or invalid.
 *
 * This ensures the backend receives all necessary route information in a structured format.
 */



document.addEventListener("DOMContentLoaded", () =>
  {
    const form = document.getElementById("create-route-form");
    form.addEventListener("submit", (event) => 
    {
      const route_data = JSON.parse(sessionStorage.getItem("routeData"));
  
      if (!route_data) 
      {
        event.preventDefault();
        return;
      }
      
      // Parse coordinates if stored as a JSON string
      if (typeof route_data.coordinates === "string") 
      {
        try 
        {
          route_data.coordinates = JSON.parse(route_data.coordinates);
        } 
        catch (e) 
        {
          console.error("Invalid coordinates format");
          event.preventDefault();
          return;
        }
      }
  
      const keyPoints = route_data.keyPoints || route_data.coordinates;
      const coord_arr = keyPoints.map((coord) => [
        coord.lat,
        coord.lng,
      ]);

      
      // Inject processed data into hidden form fields
      document.getElementById("coordinates").value = JSON.stringify(coord_arr);
      document.getElementById("totalDistance").value = route_data.total_distance || "";
      document.getElementById("elevationGain").value = route_data.elevation_gain || "";
      document.getElementById("elevationLoss").value = route_data.elevation_loss || "";
      document.getElementById("maxElevation").value = route_data.max_elevation || "";
      document.getElementById("minElevation").value = route_data.min_elevation || "";
      document.getElementById("avgElevation").value = route_data.average_elevation || "";
      document.getElementById("mapImageUrl").value = route_data.map_image_url || "";
      document.getElementById("country").value = route_data.country || "";
      
      // Clear route data from sessionStorage after submission
      sessionStorage.removeItem("routeData");
    });
  });