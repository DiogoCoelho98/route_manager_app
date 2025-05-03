/********************************************************************
 *                        Geocoding Utility                          *
 * ------------------------------------------------------------------
 * This module provides a utility function to geocode a string-based
 * address into geographic coordinates using OpenStreetMap's 
 * Nominatim API.
 *
 * External API Used:
 *    - Nominatim (https://nominatim.openstreetmap.org)
 *      Format: JSON
 ********************************************************************/



export const geocodeAddress = async (address) => 
{
  try 
  {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
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
