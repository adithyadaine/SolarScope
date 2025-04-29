// api/hourly.js
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
  
    const { lat, lng } = request.query;
    const apiKey = process.env.WEATHERAPI_API_KEY;
  
    // Log received parameters and key presence
    console.log('Hourly Request Params:', request.query);
    console.log('API Key Present:', !!apiKey);
  
    if (!apiKey) {
      console.error('Server Error: WEATHERAPI_API_KEY environment variable not set.');
      return response.status(500).json({ error: 'API key not configured on server' });
    }
    if (!lat || !lng) {
      console.warn('Bad Request: Missing lat or lng parameters');
      return response.status(400).json({ error: 'Missing lat or lng parameters' });
    }
  
    const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lng}&hours=12`;
  
    console.log('Fetching URL:', apiUrl);
  
    try {
      // Use the dynamically imported fetch
      const apiResponse = await fetch(apiUrl);
      const responseBody = await apiResponse.text(); // Read body as text first
  
      console.log(`WeatherAPI Response Status: ${apiResponse.status}`);
      // console.log(`WeatherAPI Response Body (truncated): ${responseBody.substring(0, 500)}`);
  
      if (!apiResponse.ok) {
        let errorDetail = `(${apiResponse.status}) ${apiResponse.statusText}`;
        try {
          // WeatherAPI often includes error details in the JSON body
          const errorJson = JSON.parse(responseBody);
          if (errorJson.error && errorJson.error.message) {
              errorDetail = errorJson.error.message;
          }
        } catch (parseError) { /* Ignore */ }
        console.error(`WeatherAPI Error: Status ${apiResponse.status}, Detail: ${errorDetail}`);
        return response.status(apiResponse.status).json({ error: `WeatherAPI error: ${errorDetail}` });
      }
  
      const data = JSON.parse(responseBody);
      response.status(200).json(data);
  
    } catch (error) {
      console.error('[Hourly Serverless Function Error]', error);
      response.status(500).json({ error: error.message || 'Internal server error fetching hourly data' });
    }
  }
  