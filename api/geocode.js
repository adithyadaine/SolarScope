// api/geocode.js
import fetch from 'node-fetch'; // Use node-fetch or built-in fetch

export default async function handler(request, response) {
  // Allow requests from any origin (adjust in production if needed)
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request for CORS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { query, lat, lng } = request.query; // Get params from request URL
  const apiKey = process.env.OPENCAGE_API_KEY; // Read key from Vercel Env Vars

  if (!apiKey) {
    return response
      .status(500)
      .json({ error: 'API key not configured' });
  }

  let apiUrl;
  if (query) {
    apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5`;
  } else if (lat && lng) {
    apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;
  } else {
    return response
      .status(400)
      .json({ error: 'Missing query or lat/lng parameters' });
  }

  try {
    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) {
      throw new Error(
        `OpenCage API error: ${apiResponse.status} ${apiResponse.statusText}`
      );
    }
    const data = await apiResponse.json();
    response.status(200).json(data); // Send data back to client
  } catch (error) {
    console.error('[Geocode API Error]', error);
    response.status(500).json({ error: error.message });
  }
}
