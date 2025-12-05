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
        'crematorium': ['crematorium', 'cremation services'],
        'cemetery': ['cemetery', 'burial ground', 'graveyard'],
        'natural-burial': ['natural burial', 'woodland burial', 'green burial', 'eco burial'],
        'florist': ['funeral flowers', 'florist sympathy', 'funeral florist'],
        'stonemason': ['memorial stonemason', 'headstone', 'monumental mason', 'gravestone'],
        'venue': ['function room hire', 'wake venue', 'memorial venue', 'reception venue'],
        'caterer': ['funeral catering', 'wake catering', 'buffet catering'],
        'solicitor': ['probate solicitor', 'wills and probate solicitor', 'estate solicitor'],
        'will-writer': ['will writer', 'will writing service'],
        'accountant': ['probate accountant', 'inheritance tax accountant', 'estate accountant'],
        'celebrant': ['funeral celebrant', 'civil celebrant', 'humanist celebrant'],
        'musician': ['funeral musician', 'funeral singer', 'funeral organist', 'harpist'],
        'photographer': ['funeral photographer', 'memorial photographer'],
        'videographer': ['funeral videographer', 'memorial video service'],
        'transport': ['funeral transport', 'hearse hire', 'funeral car hire', 'horse drawn hearse'],
        'house-clearance': ['house clearance', 'bereavement clearance', 'probate clearance'],
        'counsellor': ['grief counsellor', 'bereavement counsellor', 'bereavement support'],
        'printer': ['order of service printing', 'funeral printing', 'memorial printing'],
        'memorial-jewellery': ['memorial jewellery', 'ashes jewellery', 'cremation jewellery'],
        'locksmith': ['locksmith', 'emergency locksmith', 'lock change'],
        'cleaning': ['house cleaning', 'deep cleaning service', 'end of tenancy cleaning', 'probate cleaning'],
        'pet-services': ['pet cremation', 'pet funeral', 'kennels', 'cattery', 'pet rehoming', 'dog boarding'],
        'repatriation': ['repatriation services', 'international funeral', 'body repatriation']
      };

      const queries = searchQueries[category] || [category];
      for (const query of queries) {
        const results = await textSearch(query, coords.lat, coords.lng);
        allResults = allResults.concat(results);
      }
    } else {
      // Search for main funeral-related services
      const searches = [
        textSearch('funeral director', coords.lat, coords.lng),
        textSearch('crematorium', coords.lat, coords.lng),
        textSearch('florist', coords.lat, coords.lng),
        textSearch('stonemason memorial', coords.lat, coords.lng),
        textSearch('probate solicitor', coords.lat, coords.lng),
        textSearch('funeral celebrant', coords.lat, coords.lng)
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

    // Get details for top 10 results (to limit API costs)
    const topPlaces = uniquePlaces.slice(0, 10);
    
    // Fetch full details for each place
    const suppliersWithDetails = await Promise.all(topPlaces.map(async (place) => {
      // Get full details including phone and website
      const details = await getPlaceDetails(place.place_id);
      
      // Determine category based on name
      const nameLower = place.name.toLowerCase();
      let type = 'funeral-director'; // default
      
      // Check name for category clues
      if (nameLower.includes('crematori')) type = 'crematorium';
      else if (nameLower.includes('cemetery') || nameLower.includes('burial ground') || nameLower.includes('graveyard')) type = 'cemetery';
      else if (nameLower.includes('woodland burial') || nameLower.includes('natural burial') || nameLower.includes('green burial')) type = 'natural-burial';
      else if (nameLower.includes('florist') || nameLower.includes('flower')) type = 'florist';
      else if (nameLower.includes('stone') || nameLower.includes('mason') || nameLower.includes('headstone') || nameLower.includes('gravestone')) type = 'stonemason';
      else if (nameLower.includes('solicitor') || nameLower.includes('law') || nameLower.includes('probate')) type = 'solicitor';
      else if (nameLower.includes('will writ')) type = 'will-writer';
      else if (nameLower.includes('accountant') || nameLower.includes('tax')) type = 'accountant';
      else if (nameLower.includes('celebrant') || nameLower.includes('humanist') || nameLower.includes('officiant')) type = 'celebrant';
      else if (nameLower.includes('music') || nameLower.includes('harp') || nameLower.includes('organist') || nameLower.includes('singer')) type = 'musician';
      else if (nameLower.includes('photo')) type = 'photographer';
      else if (nameLower.includes('video') || nameLower.includes('film')) type = 'videographer';
      else if (nameLower.includes('hearse') || nameLower.includes('limousine') || nameLower.includes('horse drawn') || nameLower.includes('transport')) type = 'transport';
      else if (nameLower.includes('clearance')) type = 'house-clearance';
      else if (nameLower.includes('counsell') || nameLower.includes('therapy') || nameLower.includes('grief') || nameLower.includes('bereavement support')) type = 'counsellor';
      else if (nameLower.includes('print')) type = 'printer';
      else if (nameLower.includes('jewel') || nameLower.includes('ashes into')) type = 'memorial-jewellery';
      else if (nameLower.includes('locksmith') || nameLower.includes('lock')) type = 'locksmith';
      else if (nameLower.includes('clean')) type = 'cleaning';
      else if (nameLower.includes('kennel') || nameLower.includes('cattery') || nameLower.includes('pet cremation') || nameLower.includes('pet funeral') || nameLower.includes('dog boarding')) type = 'pet-services';
      else if (nameLower.includes('repatriation') || nameLower.includes('international funeral')) type = 'repatriation';
      else if (nameLower.includes('cater')) type = 'caterer';
      else if (nameLower.includes('hall') || nameLower.includes('venue') || nameLower.includes('room')) type = 'venue';

      return {
        id: place.place_id,
        name: place.name,
        type: type,
        location: details?.formatted_address || place.vicinity || '',
        phone: details?.formatted_phone_number || null,
        website: details?.website || null,
        rating: place.rating || null,
        reviewCount: place.user_ratings_total || 0,
        isOpen: place.opening_hours?.open_now,
        placeId: place.place_id
      };
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        suppliers: suppliersWithDetails,
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
