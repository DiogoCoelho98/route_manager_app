/**
 * Custom Leaflet control that adds a drawing button to the map UI.
 * When clicked, it toggles the route drawing mode using DrawingManager.
 */



L.Control.DrawButton = L.Control.extend({
  options: { position: "topleft" },

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

    L.DomEvent.on(button, "click", (e) => {
      L.DomEvent.stop(e);
      map?.DrawingManager?.toggleDrawing();
    });

    return container;
  },
});

L.Control.CustomActions = L.Control.extend({
  options: { position: "topleft" },

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