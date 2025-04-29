// api/weather.js
// No top-level import/require for node-fetch

export default async function handler(request, response) {
    // Import node-fetch dynamically inside the async handler
    const fetch = (await import('node-fetch')).default;
  
    // CORS Headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (request.method === 'OPTIONS') {
      return response.status(200).end();
    }
  
    const { type, lat, lon } = request.query; // type = 'current', 'forecast', 'aqi'
    const apiKey = process.env.OPENWEATHER_API_KEY;
  
    // Log received parameters and key presence
    console.log('Weather Request Params:', request.query);
    console.log('API Key Present:', !!apiKey);
  
    if (!apiKey) {
      console.error('Server Error: OPENWEATHER_API_KEY environment variable not set.');
      return response.status(500).json({ error: 'API key not configured on server' });
    }
    if (!type || !lat || !lon) {
      console.warn('Bad Request: Missing type, lat, or lon parameters');
      return response.status(400).json({ error: 'Missing type, lat, or lon parameters' });
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
        console.warn(`Bad Request: Invalid type parameter: ${type}`);
        return response.status(400).json({ error: 'Invalid type parameter' });
    }
  
    console.log('Fetching URL:', apiUrl);
  
    try {
      // Use the dynamically imported fetch
      const apiResponse = await fetch(apiUrl);
      const responseBody = await apiResponse.text(); // Read body as text first
  
      console.log(`OpenWeather Response Status: ${apiResponse.status}`);
      // console.log(`OpenWeather Response Body (truncated): ${responseBody.substring(0, 500)}`);
  
      if (!apiResponse.ok) {
        let errorDetail = `(${apiResponse.status}) ${apiResponse.statusText}`;
        try {
          const errorJson = JSON.parse(responseBody);
          if (errorJson.message) {
              errorDetail = errorJson.message;
          }
        } catch (parseError) { /* Ignore */ }
        console.error(`OpenWeather API Error: Status ${apiResponse.status}, Detail: ${errorDetail}`);
        return response.status(apiResponse.status).json({ error: `OpenWeather API error: ${errorDetail}` });
      }
  
      const data = JSON.parse(responseBody);
      response.status(200).json(data);
  
    } catch (error) {
      console.error('[Weather Serverless Function Error]', error);
      response.status(500).json({ error: error.message || 'Internal server error fetching weather data' });
    }
  }
  