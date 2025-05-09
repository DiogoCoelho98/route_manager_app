/********************************************************************
 *                      Drawing Manager Module                      *
 * ------------------------------------------------------------------
 * Handles the UI and logic related to drawing custom routes on the 
 * Leaflet map using Leaflet.draw. Integrates with custom UI buttons,
 * updates UI states, and triggers route rendering on completion.
 ********************************************************************/



import { drawRoute, clearRoute } from "./route_manager.js";
import { setSubmitLoadingState } from "./ui_handlers.js";



export const DrawingManager = { 
  map: null,
  drawnItems: null,
  currentDrawControl: null,
  activeDrawInstance: null,
  isDrawingActive: false,
  startMarker: null,

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

  triggerButton(e) {
    e.preventDefault();
    document.querySelector(".leaflet-control-custom a")?.click();
  },

  toggleDrawing() {
    if (this.isDrawingActive) {
      this.activeDrawInstance?.disable();
      this.cleanupDrawing();
      return;
    }

    this.drawnItems.clearLayers();

    if (this.currentDrawControl) {
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

  cleanupDrawing() {
    if (this.currentDrawControl) {
      this.map.removeControl(this.currentDrawControl);
      this.currentDrawControl = null;
    }

    if (this.activeDrawInstance) {
      this.activeDrawInstance.disable();
      this.activeDrawInstance = null;
    }

    this.isDrawingActive = false;
    this.updateButtonStates(false);
    this.hideActionButtons();

    clearRoute();
  },

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
   * Converts the drawn polyline into coordinates and draws the route on the map.
   */
  async handleDrawComplete(e) {
    const layer = e.layer;
    this.drawnItems.addLayer(layer);

    const coords = layer.getLatLngs().map((coord) => ({
      lat: coord.lat,
      lng: coord.lng,
    }));

    if (coords.length) {
      const startCoord = coords[0];
      L.marker([startCoord.lat, startCoord.lng]).addTo(this.map);
    }

    this.cleanupDrawing();

    const submitBtn = document.querySelector(
      "#route-form button[type='submit']"
    );

    try {
      setSubmitLoadingState(submitBtn, true);
      await drawRoute(coords, "drawn");
    } catch (err) {
      console.error("Error drawing route:", err);
    } finally {
      setSubmitLoadingState(submitBtn, false);
    }
  },
};