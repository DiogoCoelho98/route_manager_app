/********************************************************************
 * Handles the logic for drawing and clearing routes on the map.
 * Communicates with the Flask backend to fetch route metrics and 
 * visualize them via Leaflet polylines.
 *
 * Exported Functions:
 *   - drawRoute: Sends coordinates to the backend and draws route.
 *   - clearRoute: Removes the route polyline and markers from the map.
 *   - addRouteMarker: Registers and manages markers for current route.
 *
 * Dependencies:
 *   - map_manager.js: Provides access to the shared Leaflet map instance.
 *   - storage.js: Handles session storage for route data.
 ********************************************************************/


import { getMap } from "./map_manager.js";
import { setItem } from "./storage.js";


let current_route_polyline = null;
let route_type = null;



/**
 * Draws a route on the map using provided coordinates and stores the result.
 * Sends the coordinates to the `/get-route` endpoint and uses the response
 * to draw a Leaflet polyline. Also stores the response data in session storage.
 *
 * @param {Array} coordinates - Array of coordinate objects for the route (start, waypoints, end).
 * @param {Array} waypoints - Array of waypoint coordinate objects (excluding start/end).
 * @param {string} type - Route type ("geocoded" or "drawn").
 * @param {string} mode - Travel mode (e.g., "foot-walking").
 * @param {Array|null} key_points - Optional array of key points for the route.
 */
export const drawRoute = async (coordinates, waypoints, type = "geocoded", mode = "foot-walking", key_points = null) => 
{
  try 
  {
    const response = await fetch("/get-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        coordinates, 
        waypoints,
        mode,
        type
      }),
    });

    const route_data = await response.json();

    if (key_points) 
    {
    route_data.keyPoints = key_points;
    }

    const map = getMap();
    
    current_route_polyline = L.polyline(
      route_data.coordinates.map((coord) => [coord.lat, coord.lng]),
      { color: "#3b82f6" }
    ).addTo(map);
    map.fitBounds(current_route_polyline.getBounds());
    
    setItem("routeData", route_data);
    
    route_type = type;
  } 
  catch (error) 
  {
    console.error(`Error drawing route: ${error.message}`);
  }
};




/**
 * Clears the current route polyline, route markers, and optionally 
 * clears any drawn layers.
 *
 * @param {L.FeatureGroup|null} drawnItems - Optional Leaflet feature group to clear.
 */
export const clearRoute = (drawnItems = null) => {
  const map = getMap();

  if (current_route_polyline) 
  {
    map.removeLayer(current_route_polyline);
    current_route_polyline = null;
    route_type = null;
    sessionStorage.removeItem("routeData");
  }

  if (drawnItems) drawnItems.clearLayers();
};