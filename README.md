# Sunrise & Sunset Tracker ☀️🌙

A web application to display sunrise, sunset times, current weather conditions, and forecasts for any location worldwide. Users can search for locations, select points on an interactive map, save favorite locations, and toggle between light and dark themes.

## Features

*   **Location Search:** Find locations by city name with auto-suggestions.
*   **Interactive Map:** Select locations directly by clicking on a Leaflet map.
*   **Core Sun Data:** Displays Sunrise, Sunset, Dawn, Dusk, Day Length, and Solar Noon times.
*   **Current Conditions:** Shows current time (local to the location), timezone, temperature, "feels like" temperature, and weather description.
*   **Weather Animation:** Visual representation of current weather using Lottie animations.
*   **Air Quality:** Displays the current Air Quality Index (AQI).
*   **Hourly Forecast:** Shows temperature and conditions for the next 12 hours.
*   **Daily Forecast:** Provides a 5-day weather forecast overview.
*   **Favorites:** Save frequently viewed locations for quick access.
*   **Auto Update:** Option to automatically refresh the data every 10 minutes.
*   **Dark Mode:** Toggle between light and dark themes for comfortable viewing.
*   **Responsive Design:** Adapts to different screen sizes.

## Tech Stack

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **Mapping:** [Leaflet.js](https://leafletjs.com/)
*   **Data APIs:**
    *   [OpenWeatherMap](https://openweathermap.org/api) (Current Weather, Forecast, AQI)
    *   [OpenCageData](https://opencagedata.com/api) (Geocoding)
    *   [SunriseSunset.io](https://sunrisesunset.io/api/) (Sunrise/Sunset Times)
    *   [WeatherAPI.com](https://www.weatherapi.com/) (Hourly Forecast)
*   **Animations:** [Lottie (Bodymovin)](https://airbnb.design/lottie/)
*   **Icons:** [Font Awesome](https://fontawesome.com/)

## Setup and Installation

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/solarscope.git
    cd solarscope
    ```
    *(Replace `your-username/solarscope.git` with your actual repository URL)*

2.  **API Keys:** This project requires API keys from several services.
    *   Obtain API keys from:
        *   [OpenWeatherMap](https://openweathermap.org/appid)
        *   [OpenCageData](https://opencagedata.com/api#api-key)
        *   [WeatherAPI.com](https://www.weatherapi.com/signup.aspx)
        *   *(SunriseSunset.io does not currently require a key for basic use)*
    *   Locate the `apikeys.example.js` file in the project root.
    *   **Rename** or **copy** this file to `apikeys.js`.
    *   Open `apikeys.js` and replace the placeholder strings (`"YOUR_..._KEY_HERE"`) with your actual API keys obtained from the services above.
    *   **Important:** The `apikeys.js` file is listed in `.gitignore` and should **never** be committed to version control.

3.  **Open the Application:**
    *   Simply open the `index.html` file in your web browser.
    *   **Note:** For full functionality (especially API requests), it's recommended to serve the files using a simple local web server to avoid potential CORS issues when running directly from `file:///`. Tools like the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code or Python's built-in server (`python -m http.server` in the project directory) can be used.

## Usage

1.  **Enter a location** in the search bar at the top. Suggestions will appear as you type. Click a suggestion to load its data.
2.  Alternatively, **enable map interaction** using the toggle switch above the map and click directly on the map to select a location.
3.  View the **current sun times, weather conditions, and forecasts** displayed in the cards below the map/weather section.
4.  Click the **"Add to Favorites"** button (within the "Today's Information" card) to save the currently displayed location.
5.  View, load, or remove saved locations from the **"Your Favorites"** card.
6.  Use the **theme toggle button** (moon/sun icon) in the header to switch between light and dark modes.
7.  Use the **"Auto Update"** toggle below the search bar to enable/disable automatic data refreshing for the current location.
8.  Click the **"Clear"** button next to the search bar to reset the input and displayed data.

## Attribution

Maintained with ❤️ by Adithya D M