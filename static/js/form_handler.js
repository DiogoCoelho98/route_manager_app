/********************************************************************
 *                      Form Submission Handler                      *
 * ------------------------------------------------------------------
 * This module manages user-submitted route planning via address 
 * input fields. It converts textual locations into coordinates 
 * using geocoding, places markers, and renders the route on the map.
 *
 * Dependencies:
 *    - geocodeAddress()      : Converts address strings into lat/lng.
 *    - drawRoute(), clearRoute(), addRouteMarker(): Route management.
 *    - setSubmitLoadingState(): Manages UI loading state.
 *    - getMap()              : Retrieves the Leaflet map instance.
 ********************************************************************/



import { geocodeAddress } from "./geocoder.js";
import { drawRoute, clearRoute } from "./route_manager.js";
import { setSubmitLoadingState } from "./ui_handlers.js";
import { getMap } from "./map_manager.js"; // Now being used currently


let selected_mode = "foot-walking"; // Default mode

// Listen for mode button clicks
document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    selected_mode = btn.getAttribute("data-mode");
    
    document.querySelectorAll("[data-mode]").forEach(b => {
      b.classList.remove("bg-blue-200")
    });
    btn.classList.add("bg-blue-200");
  });
});


export const handleFormSubmit = async (e) => 
{
  e.preventDefault();

  const form = e.target;
  const from = document.getElementById("from-input").value.trim();
  const to = document.getElementById("to-input").value.trim();
  const submit_btn = form.querySelector('button[type="submit"]');

  if (!from || !to) return;
  
  setSubmitLoadingState(submit_btn, true);
  clearRoute();

  try 
  {
    // Geocode both locations in parallel
    const [start, end] = await Promise.all([
      geocodeAddress(from),
      geocodeAddress(to),
    ]);

    if (!start || !end)
    {
      throw new Error("Could not geocode one or both addresses");
    }

    /*
    This logic for now is not necessary

    const map = getMap();
    
    const start_marker = L.marker([start.lat, start.lng])
      .addTo(map)
      .bindPopup(`🚩 Start: ${start.display_name}`)
      .openPopup();
    addRouteMarker(start_marker);

    const end_marker = L.marker([end.lat, end.lng])
      .addTo(map)
      .bindPopup(`🏁 Destination: ${end.display_name}`)
      .openPopup();
    addRouteMarker(end_marker); 
    */

    await drawRoute(
      [
        { lat: start.lat, lng: start.lng },
        { lat: end.lat, lng: end.lng },
      ],
      "geocoded",
      selected_mode
    );
    console.log(selected_mode);
    form.reset();
  } 
  catch (error) 
  {
    console.error(error.message);
  } 
  finally 
  {
    setSubmitLoadingState(submit_btn, false);
  }
};