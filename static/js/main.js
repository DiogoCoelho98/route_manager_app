/* 
# ===========================================================
#                    Application Entry Point 
# ===========================================================
 Description:
 This script is the main initialization file for the client-side 
 application. It sets up the Leaflet map, drawing tools, form handling,
 and custom control styling.

 Modules used:
 - initMap: Initializes the base Leaflet map
 - handleFormSubmit: Handles form submission logic
 - clearRoute: Clears existing drawn routes from the map
 - DrawingManager: Manages draw tools for route creation
 - injectCustomDrawStyles: Adds custom CSS for draw controls

 Runs once on DOMContentLoaded.
*/


import { initMap } from "./map_manager.js";
import { handleFormSubmit } from "./form_handler.js";
import { clearRoute } from "./route_manager.js";
import { DrawingManager } from "./drawing_manager.js";
import "./leaflet_custom_controls.js";
import { injectCustomDrawStyles } from "./inject_styles.js";



document.addEventListener("DOMContentLoaded", async () => 
{
  const map = await initMap();

  const drawn_items = new L.FeatureGroup();
  map.addLayer(drawn_items);

  DrawingManager.init(map, drawn_items);
  map.DrawingManager = DrawingManager;

  const form = document.getElementById("route-form");
  form.addEventListener("submit", handleFormSubmit);

  document
    .getElementById("draw-route-btn")
    .addEventListener("click", DrawingManager.triggerButton);
  document
    .getElementById("clear-route-btn")
    .addEventListener("click", () => clearRoute(DrawingManager.drawn_items));

  injectCustomDrawStyles();
});
