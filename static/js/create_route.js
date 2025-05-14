/**
 * On page load: Pre-processing of route data before form submission
 * on the "Create Route" page. It reads route metadata stored in sessionStorage
 * (by the route planning feature), formats it appropriately, and injects it
 * into hidden form fields to be sent to the backend (flask).
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
  
      // Transform array of coordinate objects into [lat, lng] pairs
      const coord_arr = route_data.coordinates.map((coord) => [
        coord.lat,
        coord.lng,
      ]);
      
      document.getElementById("coordinates").value = JSON.stringify(coord_arr);
      document.getElementById("totalDistance").value = route_data.total_distance || "";
      document.getElementById("elevationGain").value = route_data.elevation_gain || "";
      document.getElementById("elevationLoss").value = route_data.elevation_loss || "";
      document.getElementById("maxElevation").value = route_data.max_elevation || "";
      document.getElementById("minElevation").value = route_data.min_elevation || "";
      document.getElementById("avgElevation").value = route_data.average_elevation || "";
      document.getElementById("mapImageUrl").value = route_data.map_image_url || "";
      document.getElementById("country").value = route_data.country || "";
  
      sessionStorage.removeItem("routeData");
    });
  });