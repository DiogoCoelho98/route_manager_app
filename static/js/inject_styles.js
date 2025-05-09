/**
 * Injects custom CSS styles into the document head to override default
 * Leaflet draw control styles and enhance the appearance of custom drawing controls.
 * 
 * - Hides Leaflet's default drawing UI components (toolbar, actions, tooltips)
 * - Styles the custom action buttons and draw toggle for a cleaner interface
 */



export const injectCustomDrawStyles = () =>
{
  const style = document.createElement("style");
  style.innerHTML = `
      .leaflet-draw-toolbar-top { display: none !important; }
      .leaflet-draw-actions { display: none !important; }
      .leaflet-draw-tooltip { display: none !important; }
  
      .custom-actions 
      {
        margin-left: 40px;
        background: rgba(255,255,255,0.9);
        padding: 5px;
        border-radius: 4px;
      }
  
      .custom-actions a 
      {
        color: #333 !important;
        font-size: 14px;
        transition: background 0.2s;
      }
  
      .custom-actions a:hover 
      {
        background: #f0f0f0 !important;
      }
  
      .active-draw 
      {
        background-color: #3b82f6 !important;
        color: white !important;
      }
    `;
  document.head.appendChild(style);
};