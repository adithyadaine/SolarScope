// api/sunrisesunset.js
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
  
    // Log received parameters
    console.log('SunriseSunset Request Params:', request.query);
  
    if (!lat || !lng) {
      console.warn('Bad Request: Missing lat or lng parameters');
      return response.status(400).json({ error: 'Missing lat or lng parameters' });
    }
  
    // Note: SunriseSunset.io doesn't typically need an API key for basic use
    const apiUrl = `https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}&formatted=0`;
  
    console.log('Fetching URL:', apiUrl);
  
    try {
      // Use the dynamically imported fetch
      const apiResponse = await fetch(apiUrl);
      const responseBody = await apiResponse.text(); // Read body as text first
  
      console.log(`SunriseSunset Response Status: ${apiResponse.status}`);
      // console.log(`SunriseSunset Response Body (truncated): ${responseBody.substring(0, 500)}`);
  
      if (!apiResponse.ok) {
        let errorDetail = `(${apiResponse.status}) ${apiResponse.statusText}`;
        try {
          const errorJson = JSON.parse(responseBody);
          // Check for API-specific error structure if known
          if (errorJson.status && errorJson.status !== 'OK') {
              errorDetail = errorJson.status;
          }
        } catch (parseError) { /* Ignore */ }
        console.error(`SunriseSunset API Error: Status ${apiResponse.status}, Detail: ${errorDetail}`);
        return response.status(apiResponse.status).json({ error: `SunriseSunset API error: ${errorDetail}` });
      }
  
      const data = JSON.parse(responseBody);
      // Check internal status from the API response
      if (data.status !== 'OK') {
          console.error(`SunriseSunset API Error: Internal Status ${data.status}`);
          return response.status(400).json({ error: `SunriseSunset API error: ${data.status}` });
      }
  
      response.status(200).json(data);
  
    } catch (error) {
      console.error('[SunriseSunset Serverless Function Error]', error);
      response.status(500).json({ error: error.message || 'Internal server error fetching sunrise/sunset data' });
    }
  }
  