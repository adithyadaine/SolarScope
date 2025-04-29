// api/hourly.js
const fetch = require('node-fetch');

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { lat, lng } = request.query;
  const apiKey = process.env.WEATHERAPI_API_KEY;

  if (!apiKey) {
    return response
      .status(500)
      .json({ error: 'API key not configured' });
  }
  if (!lat || !lng) {
    return response
      .status(400)
      .json({ error: 'Missing lat or lng parameters' });
  }

  const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lng}&hours=12`;

  try {
    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) {
      // WeatherAPI often includes error details in the JSON body even on non-200 status
      const errorData = await apiResponse.json();
      console.error('[WeatherAPI Error Body]', errorData);
      throw new Error(
        `WeatherAPI error: ${apiResponse.status} ${apiResponse.statusText} - ${errorData?.error?.message || 'Unknown error'}`
      );
    }
    const data = await apiResponse.json();
    response.status(200).json(data);
  } catch (error) {
    console.error('[Hourly API Error]', error);
    response.status(500).json({ error: error.message });
  }
}
