// api/geocode.js
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
  
    const { query, lat, lng } = request.query;
    const apiKey = process.env.OPENCAGE_API_KEY;
  
    // Log received parameters and key presence for debugging in Vercel logs
    console.log('Geocode Request Params:', request.query);
    console.log('API Key Present:', !!apiKey); // Check if the key was found in env vars
  
    if (!apiKey) {
      console.error('Server Error: OPENCAGE_API_KEY environment variable not set.');
      // Send specific error back to client
      return response.status(500).json({ error: 'API key not configured on server' });
    }
  
    let apiUrl;
    if (query) {
      apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5`;
    } else if (lat && lng) {
      apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;
    } else {
      console.warn('Bad Request: Missing query or lat/lng parameters');
      return response.status(400).json({ error: 'Missing query or lat/lng parameters' });
    }
  
    console.log('Fetching URL:', apiUrl); // Log the URL being fetched in Vercel logs
  
    try {
      // Use the dynamically imported fetch
      const apiResponse = await fetch(apiUrl);
      const responseBody = await apiResponse.text(); // Read body as text first
  
      // Log status and potentially truncated body in Vercel logs
      console.log(`OpenCage Response Status: ${apiResponse.status}`);
      // console.log(`OpenCage Response Body (truncated): ${responseBody.substring(0, 500)}`); // Uncomment carefully for debugging
  
      if (!apiResponse.ok) {
         // Attempt to parse error details from OpenCage response
         let errorDetail = `(${apiResponse.status}) ${apiResponse.statusText}`; // Default
         try {
             const errorJson = JSON.parse(responseBody);
             if (errorJson.status && errorJson.status.message) {
                 errorDetail = errorJson.status.message;
             }
         } catch (parseError) {
             // Body wasn't JSON, stick with status text
         }
         console.error(`OpenCage API Error: Status ${apiResponse.status}, Detail: ${errorDetail}`);
         // Send a more specific error back to the client
         return response.status(apiResponse.status).json({ error: `OpenCage API error: ${errorDetail}` });
      }
  
      // If response is OK, parse the valid JSON and send back
      const data = JSON.parse(responseBody);
      response.status(200).json(data);
  
    } catch (error) {
      // Catch fetch errors or errors thrown above
      console.error('[Geocode Serverless Function Error]', error);
      // Send back a generic but informative error message
      response.status(500).json({ error: error.message || 'Internal server error fetching geocode data' });
    }
  }
  