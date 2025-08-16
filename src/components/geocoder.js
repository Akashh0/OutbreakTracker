import axios from "axios";

// Load API key from environment variables
const GEOCODER_API_KEY = import.meta.env.VITE_GEOCODER_API_KEY;

/**
 * Get coordinates (lat, lng) for a given location string using OpenCage Geocoder API.
 * @param {string} location - The location text to geocode.
 * @returns {Promise<{lat: number, lng: number} | null>} Coordinates or null if not found.
 */
export async function geocodeLocation(location) {
  if (!location || !location.trim()) {
    console.warn("⚠️ Empty location string provided.");
    return null;
  }

  try {
    const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        q: location,
        key: GEOCODER_API_KEY,
        limit: 1,
        no_annotations: 1
      }
    });

    if (response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry;
      return { lat, lng };
    } else {
      console.warn(`⚠️ No coordinates found for: ${location}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error geocoding "${location}":`, error.message);
    return null;
  }
}
