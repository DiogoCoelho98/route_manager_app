/**
 * Defines custom Leaflet controls for the Route Planner app:
 *  - DrawButton: Adds a button to toggle drawing mode for creating routes.
 *  - CustomActions: Displays action buttons for finishing, canceling, or editing a drawn route.
 *
 * Usage:
 *   - Add controls to map with:
 *       map.addControl(new L.Control.DrawButton());
 *       map.addControl(new L.Control.CustomActions());
 *   - Ensure that DrawingManager is attached to the map instance for full integration.
 *
 * References:
 *   - Leaflet Controls: https://leafletjs.com/reference.html#control
 *   - Extending Controls: https://leafletjs.com/examples/extending/extending-3-controls.html
 *   - Custom Control Plugins: https://github.com/yigityuce/Leaflet.Control.Custom
 */




// Toggles drawing mode
L.Control.DrawButton = L.Control.extend({
  options: { position: "topleft" },

  /**
   * Called when the control is added to the map.
   * @param {L.Map} map - The Leaflet map instance.
   * @returns {HTMLElement} The control container element.
   */
  onAdd(map) {
    const container = L.DomUtil.create(
      "div",
      "leaflet-bar leaflet-control leaflet-control-custom"
    );
    const button = L.DomUtil.create("a", "", container);
    button.innerHTML = "🖌️";
    button.title = "Draw Route";
    button.style.cssText = `
      width: 30px; 
      height: 30px; 
      line-height: 30px; 
      font-size: 18px; 
      cursor: pointer;
      `;

    // Toggle drawing mode using DrawingManager when clicked
    L.DomEvent.on(button, "click", (e) => {
      L.DomEvent.stop(e);
      map?.DrawingManager?.toggleDrawing();
    });

    return container;
  },
});

// Finish, cancel, delete last vertex
L.Control.CustomActions = L.Control.extend({
  options: { position: "topleft" },

  /**
   * Called when the control is added to the map.
   * @param {L.Map} map - The Leaflet map instance.
   * @returns {HTMLElement} The control container element.
   */
  onAdd(map) {
    const container = L.DomUtil.create(
      "div",
      "leaflet-bar leaflet-control custom-actions"
    );
    container.style.display = "none";

    container.append(
      createActionButton("✅ Finish", () => {
        map?.DrawingManager?.activeDrawInstance?._finishShape();
        map?.DrawingManager?.cleanupDrawing();
      }),
      createActionButton("❌ Cancel", () => {
        map?.DrawingManager?.cleanupDrawing();
      }),
      createActionButton("↩ Delete Last", () => {
        map?.DrawingManager?.activeDrawInstance?.deleteLastVertex();
      })
    );

    return container;
  },
});


/**
 * Helper function to create a styled action button for the custom actions panel.
 * @param {string} html - Button label.
 * @param {Function} onClick - Click event handler.
 * @returns {HTMLElement} The button element.
 */
function createActionButton(html, onClick) {
  const btn = L.DomUtil.create("a", "", document.createElement("div"));
  btn.innerHTML = html;
  btn.style.cssText = `
      width: 100px;
      margin: 2px;
      padding: 5px;
      background: white;
      cursor: pointer;
      text-align: center;
      display: block;
      border-radius: 4px;
    `;

  L.DomEvent.on(btn, "click", onClick);
  return btn;
}