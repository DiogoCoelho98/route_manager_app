/********************************************************************
 *                      Route Manager Module                         *
 * ------------------------------------------------------------------
 * Handles the logic for drawing and clearing routes on the map.
 * Communicates with the Flask backend to fetch route metrics and 
 * visualize them via Leaflet polylines.
 *
 * Exported Functions:
 *   - drawRoute: Sends coordinates to the backend and draws route.
 *   - clearRoute: Removes the route polyline and markers from the map.
 *   - addRouteMarker: Registers and manages markers for current route.
 ********************************************************************/


import { getMap } from "./map_manager.js";
import { setItem } from "./storage.js";


let current_route_polyline = null;
let route_type = null;
let route_markers = [];



/**
 * Draws a route on the map using provided coordinates and stores the result.
 * Sends the coordinates to `/get-route` endpoint and uses the response
 * to draw a Leaflet polyline. Also stores the response data in session storage.
 */
export const drawRoute = async (coordinates, type = "geocoded", mode = "foot-walking") => 
{
  try 
  {
    const response = await fetch("/get-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        { 
          coordinates, 
          mode,
          type
        }),
    });

    const route_data = await response.json();

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
 */
export const clearRoute = (drawnItems = null) => {
  const map = getMap();

  if (current_route_polyline) {
    map.removeLayer(current_route_polyline);
    current_route_polyline = null;
    route_type = null;
    sessionStorage.removeItem("routeData");
  }

  route_markers.forEach((marker) => map.removeLayer(marker));
  route_markers = [];

  if (drawnItems) drawnItems.clearLayers();
};



/* 
Adds a Leaflet marker to the map and keeps track of it for cleanup
(not being used for now, since it's not necessary on the current 
state of the app).

export const addRouteMarker = (marker) => {
  route_markers.push(marker);
}; */