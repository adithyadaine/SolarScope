// api/weather.js
const fetch = require('node-fetch');

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { type, lat, lon } = request.query; // type = 'current', 'forecast', 'aqi'
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return response
      .status(500)
      .json({ error: 'API key not configured' });
  }
  if (!type || !lat || !lon) {
    return response
      .status(400)
      .json({ error: 'Missing type, lat, or lon parameters' });
  }

  let apiUrl;
  switch (type) {
    case 'current':
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      break;
    case 'forecast':
      apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      break;
    case 'aqi':
      apiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
      break;
    default:
      return response.status(400).json({ error: 'Invalid type parameter' });
  }

  try {
    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) {
      throw new Error(
        `OpenWeather API error: ${apiResponse.status} ${apiResponse.statusText}`
      );
    }
    const data = await apiResponse.json();
    response.status(200).json(data);
  } catch (error) {
    console.error('[Weather API Error]', error);
    response.status(500).json({ error: error.message });
  }
}
