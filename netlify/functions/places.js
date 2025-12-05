// Google Places API search for local funeral services
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Map our categories to Google Places types
const categoryToPlaceTypes = {
  'funeral-director': ['funeral_home'],
  'florist': ['florist'],
  'stonemason': ['cemetery'], // stonemasons often near cemeteries
  'venue': ['event_venue', 'banquet_hall', 'community_center'],
  'caterer': ['caterer', 'meal_delivery']
};

// Convert UK postcode to lat/lng using Google Geocoding
async function postcodeToCoords(postcode) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postcode)},UK&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  }
  return null;
}

// Search for places near coordinates
async function searchPlaces(lat, lng, type, radius = 8000) { // 8km ≈ 5 miles
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results || [];
}

// Get place details for more info
async function getPlaceDetails(placeId) {
  const fields = 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,reviews';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.result || null;
}

// Text search for specific business types
async function textSearch(query, lat, lng, radius = 8000) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results || [];
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { postcode, category } = JSON.parse(event.body);

    if (!postcode) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Postcode required' }) };
    }

    // Get coordinates from postcode
    const coords = await postcodeToCoords(postcode);
    if (!coords) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid postcode' }) };
    }

    let allResults = [];

    // If category specified, search for that category
    if (category && category !== 'all') {
      const searchQueries = {
        'funeral-director': ['funeral director', 'funeral home', 'funeral services'],
        'florist': ['funeral flowers', 'florist sympathy'],
        'stonemason': ['memorial stonemason', 'headstone', 'monumental mason'],
        'venue': ['function room hire', 'wake venue', 'memorial venue'],
        'caterer': ['funeral catering', 'wake catering', 'buffet catering']
      };

      const queries = searchQueries[category] || [category];
      for (const query of queries) {
        const results = await textSearch(query, coords.lat, coords.lng);
        allResults = allResults.concat(results);
      }
    } else {
      // Search for all funeral-related services
      const searches = [
        textSearch('funeral director', coords.lat, coords.lng),
        textSearch('florist', coords.lat, coords.lng),
        textSearch('memorial stonemason', coords.lat, coords.lng)
      ];
      
      const results = await Promise.all(searches);
      allResults = results.flat();
    }

    // Remove duplicates by place_id
    const uniquePlaces = [];
    const seenIds = new Set();
    for (const place of allResults) {
      if (!seenIds.has(place.place_id)) {
        seenIds.add(place.place_id);
        uniquePlaces.push(place);
      }
    }

    // Format results
    const suppliers = uniquePlaces.slice(0, 20).map(place => {
      // Determine category based on types
      let type = 'funeral-director';
      if (place.types) {
        if (place.types.includes('florist')) type = 'florist';
        else if (place.types.includes('cemetery')) type = 'stonemason';
        else if (place.types.includes('event_venue') || place.types.includes('banquet_hall')) type = 'venue';
        else if (place.types.includes('caterer') || place.types.includes('meal_delivery')) type = 'caterer';
      }
      // Also check name for clues
      const nameLower = place.name.toLowerCase();
      if (nameLower.includes('florist') || nameLower.includes('flower')) type = 'florist';
      else if (nameLower.includes('stone') || nameLower.includes('memorial') || nameLower.includes('mason')) type = 'stonemason';
      else if (nameLower.includes('cater')) type = 'caterer';
      else if (nameLower.includes('hall') || nameLower.includes('venue') || nameLower.includes('room')) type = 'venue';

      return {
        id: place.place_id,
        name: place.name,
        type: type,
        location: place.vicinity || place.formatted_address || '',
        rating: place.rating || null,
        reviewCount: place.user_ratings_total || 0,
        isOpen: place.opening_hours?.open_now,
        placeId: place.place_id,
        verified: false // Real businesses from Google
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        suppliers,
        location: coords,
        searchedPostcode: postcode
      })
    };

  } catch (error) {
    console.error('Places API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to search places' })
    };
  }
};
