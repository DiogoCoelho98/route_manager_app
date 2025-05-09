/********************************************************************
 *                        Map Initialization                         *
 * ------------------------------------------------------------------
 * This module handles the initialization of the Leaflet map and
 * provides access to the shared map instance across the app.
 ********************************************************************/



let map = null;



/********************************************************************
 * Initializes a Leaflet map centered on the user's location if 
 * available. Falls back to default coordinates (Lisbon) otherwise.
 *
 * Returns:
 *    Promise<object> – Resolves with the initialized Leaflet map instance.
 *
 * Features:
 *    - Uses Geolocation API to locate the user.
 *    - Adds a marker at user's location.
 *    - Uses OpenStreetMap tiles as the base layer.
 *    - Handles geolocation failure or denial.
 ********************************************************************/
export const initMap = () => {
  return new Promise((resolve) => {
    const default_coords = [38.7223, -9.1393]; // Lisbon
    const zoom_levels = 13;

    map = L.map("map");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    if (navigator.geolocation) 
    {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const user_coords = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          map.setView(user_coords, zoom_levels);
          L.marker(user_coords)
            .addTo(map)
            .bindPopup("📍 Your Location")
            .openPopup();
          resolve(map);
        },
        () => {
          map.setView(default_coords, zoom_levels);
          resolve(map);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      map.setView(default_coords, zoom_levels);
      resolve(map);
    }
  });
};



/********************************************************************
 * Returns the current Leaflet map instance created by initMap().
 *
 * Returns:
 *    object|null – The Leaflet map object, or null if map is uninitialized.
 ********************************************************************/
export const getMap = () => map;