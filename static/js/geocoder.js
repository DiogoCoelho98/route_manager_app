/********************************************************************
 * Utility function to geocode a string-based
 * address into geographic coordinates using OpenStreetMap's 
 * Nominatim API.
 *
 * External API Used:
 *    - Nominatim (https://nominatim.openstreetmap.org)
 *      Format: JSON
 *
 * Usage Notes:
 *    - The Nominatim API is free and public, but usage is rate-limited
 *      (typically 1 request per second per IP) and subject to the
 *      OpenStreetMap.
 *    - Always encode user input to avoid malformed requests.
 ********************************************************************/



/**
 * Geocodes a given address string to latitude/longitude using Nominatim.
 * @param {string} address - The address to geocode.
 * @returns {Promise<{lat: number, lng: number, display_name: string} | null>}
 * The geocoded result or null if not found or error.
 */
export const geocodeAddress = async (address) => 
  {
    try 
    {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}` 
      );
      const data = await response.json();
  
      if (data.length > 0) 
      {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      }
  
      return null;
    } 
    catch (error) 
    {
      console.error(`Geocoding error for "${address}": ${error.message}`);
      return null;
    }
  };