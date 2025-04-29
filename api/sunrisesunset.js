// api/sunrisesunset.js
const fetch = require('node-fetch');

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { lat, lng } = request.query;

  if (!lat || !lng) {
    return response
      .status(400)
      .json({ error: 'Missing lat or lng parameters' });
  }

  const apiUrl = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}&formatted=0`; // formatted=0 is often useful

  try {
    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) {
      throw new Error(
        `SunriseSunset API error: ${apiResponse.status} ${apiResponse.statusText}`
      );
    }
    const data = await apiResponse.json();
    response.status(200).json(data);
  } catch (error) {
    console.error('[SunriseSunset API Error]', error);
    response.status(500).json({ error: error.message });
  }
}
