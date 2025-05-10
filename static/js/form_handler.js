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
 ********************************************************************/



import { geocodeAddress } from "./geocoder.js";
import { drawRoute, clearRoute } from "./route_manager.js";
import { setSubmitLoadingState } from "./ui_handlers.js";


let selected_mode = "foot-walking"; // Default mode



document.querySelectorAll("[data-mode]").forEach((btn) => 
{
  btn.addEventListener("click", (e) => {
    selected_mode = btn.getAttribute("data-mode");
    document.querySelectorAll("[data-mode]").forEach(b => b.classList.remove("bg-gray-200"));
    btn.classList.add("bg-gray-200");
  });
});


const waypoint_container = document.getElementById("waypoints-container");



export const handleFormSubmit = async (e) => 
{
  e.preventDefault();

  const form = e.target;
  const from = document.getElementById("from-input").value.trim();
  const to = document.getElementById("to-input").value.trim();

  const waypoint_inputs = waypoint_container.querySelectorAll(".waypoint-input");
  const waypoints = Array.from(waypoint_inputs)
    .map(input => input.value.trim())
    .filter(val => val);

  const submit_btn = form.querySelector('button[type="submit"]');

  if (!from || !to) return;

  setSubmitLoadingState(submit_btn, true);
  clearRoute();

  try 
  {
    const all_addresses = [from, ...waypoints, to];
    const geocoded = await Promise.all(all_addresses.map(address => geocodeAddress(address)));

    if (geocoded.some(result => !result)) 
    {
      throw new Error("Could not geocode one or more addresses.");
    }

    const coordinates = geocoded.map(location => ({
      lat: location.lat,
      lng: location.lng,
    }));

    await drawRoute(coordinates, "geocoded", selected_mode);
    form.reset();
    waypoint_container.innerHTML = ""; // Clear waypoints after submit
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
