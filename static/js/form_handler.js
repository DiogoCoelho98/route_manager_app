/********************************************************************
 * Manages user-submitted route planning via address 
 * input fields. It converts textual locations into coordinates 
 * using geocoding, places markers, and renders the route on the map.
 *
 * Dependencies:
 *    - geocodeAddress()      : Converts address strings into lat/lng.
 *    - drawRoute(), clearRoute(): Route management.
 *    - setSubmitLoadingState(): Manages UI loading state.
 ********************************************************************/


import { geocodeAddress } from "./geocoder.js";
import { drawRoute, clearRoute } from "./route_manager.js";
import { setSubmitLoadingState } from "./ui_handlers.js";


let selected_mode = "foot-walking"; // Default mode


// Mode selection: update selected_mode and button UI states
document.querySelectorAll("[data-mode]").forEach((btn) => 
{
  btn.addEventListener("click", () => {
    selected_mode = btn.getAttribute("data-mode");
    document.querySelectorAll("[data-mode]").forEach(b => b.classList.remove("bg-gray-200"));
    btn.classList.add("bg-gray-200");
  });
});


const waypoint_container = document.getElementById("waypoints-container");



/**
 * Handles the submission of the route planning form.
 * - Geocodes all address fields (start, waypoints, end).
 * - Draws the route on the map using geocoded coordinates.
 * - Updates sessionStorage and hidden form fields with route data.
 * - Manages UI loading state and form reset.
 * 
 * @param {Event} e - The form submission event.
 */
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
 
    const key_points = geocoded.map(location => ({
      lat: location.lat,
      lng: location.lng,
    }));

    await drawRoute(
      key_points,               // All key points (start, waypoints, end)          
      key_points.slice(1, -1),  // waypoints only (excludes start and end points)
      "geocoded",
      selected_mode,
      key_points
    );

    const route_data = JSON.parse(sessionStorage.getItem("routeData"));
    route_data.keyPoints = key_points;
    sessionStorage.setItem("routeData", JSON.stringify(route_data));


    const coordinatesInput = form.querySelector('input[name="coordinates"]');
    if (coordinatesInput) 
    {
      coordinatesInput.value = JSON.stringify(key_points);
    }

    form.reset();
    waypoint_container.innerHTML = "";
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

