/********************************************************************
 * Handles the UI and logic related to drawing custom routes on the 
 * Leaflet map using Leaflet.draw. Integrates with custom UI buttons,
 * updates UI states, and triggers route rendering on completion.
 *
 * Features:
 *   - Allows users to draw polylines representing custom routes.
 *   - Integrates with custom map controls and UI buttons.
 *   - Manages drawing state, cleanup, and button states.
 *   - Triggers route rendering and updates UI on drawing completion.
 ********************************************************************/



import { drawRoute, clearRoute } from "./route_manager.js";
import { setSubmitLoadingState } from "./ui_handlers.js";



let selected_mode = "foot-walking"; // Default mode

document.querySelectorAll("[data-mode]").forEach((btn) => 
{
  btn.addEventListener("click", () => {
    selected_mode = btn.getAttribute("data-mode");
    document.querySelectorAll("[data-mode]").forEach(b => b.classList.remove("bg-gray-200"));
    btn.classList.add("bg-gray-200");
  });
});




/**
 * Object that manages the drawing workflow on the Leaflet map.
 * Exposes methods for initialization, toggling drawing, and handling drawing events.
 */
export const DrawingManager = { 
  map: null,
  drawnItems: null,
  currentDrawControl: null,
  activeDrawInstance: null,
  isDrawingActive: false,
  startMarker: null,

  /**
   * Initializes the DrawingManager with the map and drawn items layer.
   * Adds custom draw controls and sets up event listeners.
   * @param {L.Map} map - The Leaflet map instance.
   * @param {L.FeatureGroup} drawnItems - Layer group for drawn features.
   */
  init(map, drawnItems) {
    this.map = map;
    this.drawnItems = drawnItems;

    // Add custom draw button and control panel to map
    new L.Control.DrawButton().addTo(map);
    const customActionsControl = new L.Control.CustomActions();
    map.addControl(customActionsControl);
    map.customActionsControl = customActionsControl;

    // Attach handler for completed drawings
    map.on("draw:created", this.handleDrawComplete.bind(this));
  },

  /**
   * Simulates a click on the custom draw button.
   * @param {Event} e - The triggering event.
   */
  triggerButton(e) {
    e.preventDefault();
    document.querySelector(".leaflet-control-custom a")?.click();
  },

  /**
   * Toggles the drawing mode on the map.
   * If drawing is active, disables and cleans up.
   * Otherwise, enables drawing and updates UI.
   */
  toggleDrawing() {
    if (this.isDrawingActive) 
    {
      this.activeDrawInstance?.disable();
      this.cleanupDrawing();
      return;
    }

    this.drawnItems.clearLayers();

    if (this.currentDrawControl) 
    {
      this.map.removeControl(this.currentDrawControl);
    }

    this.currentDrawControl = this.initDrawControl();
    this.map.addControl(this.currentDrawControl);

    this.activeDrawInstance = new L.Draw.Polyline(
      this.map,
      this.currentDrawControl.options.draw.polyline
    );
    this.activeDrawInstance.enable();

    this.isDrawingActive = true;
    this.updateButtonStates(true);
    this.showActionButtons();
  },

  cleanupDrawing() 
  {
    if (this.currentDrawControl) 
    {
      this.map.removeControl(this.currentDrawControl);
      this.currentDrawControl = null;
    }

    if (this.activeDrawInstance) 
    {
      this.activeDrawInstance.disable();
      this.activeDrawInstance = null;
    }

    this.isDrawingActive = false;
    this.updateButtonStates(false);
    this.hideActionButtons();

    clearRoute();

    document.getElementById("from-input").value = "";
    document.getElementById("to-input").value = "";

    window.validateForm(document.getElementById("route-form"));
  },

  /**
   * Updates the visual state of draw-related buttons.
   * @param {boolean} isActive - Whether drawing mode is active.
   */
  updateButtonStates(isActive) {
    document
      .querySelectorAll(".leaflet-control-custom a, #draw-route-btn")
      .forEach((btn) => btn.classList.toggle("active-draw", isActive));
  },

  showActionButtons() {
    this.map.customActionsControl._container.style.display = "block";
  },

  hideActionButtons() {
    this.map.customActionsControl._container.style.display = "none";
  },

   /**
   * Initializes and returns a Leaflet Draw control with only polyline enabled.
   * @returns {L.Control.Draw} - The configured draw control.
   */
  initDrawControl() {
    return new L.Control.Draw({
      position: "topleft",
      draw: {
        polygon: false,
        circle: false,
        marker: false,
        rectangle: false,
        polyline: {
          metric: true,
          guidelineDistance: 20,
          shapeOptions: {
            color: "#3b82f6",
            weight: 3,
            stroke: true,
            opacity: 1,
            fill: false,
          },
        },
      },
      edit: {
        featureGroup: this.drawnItems,
        edit: false,
        remove: false,
      },
    });
  },

  /**
   * Handler for when the user finishes drawing a route.
   * Converts the drawn polyline into coordinates and triggers route rendering.
   * @param {Object} e - The draw:created event object.
   */
  async handleDrawComplete(e) 
  {
    const layer = e.layer;
    this.drawnItems.addLayer(layer);

    const coords = layer.getLatLngs().map((coord) => ({
      lat: coord.lat,
      lng: coord.lng,
    }));

    if (coords.length) 
    {
      const startCoord = coords[0];
      L.marker([startCoord.lat, startCoord.lng]).addTo(this.map);
    }

    this.cleanupDrawing();

    const submitBtn = document.querySelector(
      "#route-form button[type='submit']"
    );

    try 
    {
      
      setSubmitLoadingState(submitBtn, true);
      await drawRoute(
        coords, 
        [],
        "drawn",
      selected_mode
    );
    } 
    catch (err) 
    {
      console.error("Error drawing route:", err);
    } 
    finally 
    {
      setSubmitLoadingState(submitBtn, false);
    }
  },
};