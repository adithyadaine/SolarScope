// DIsplay map contents
let map;
let marker;

document.addEventListener('DOMContentLoaded', () => {
  map = L.map('map').setView([51.505, -0.09], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  map.on('click', async (e) => {
    const { lat, lng } = e.latlng;

    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }

    await fetchDataByCoordinates(lat, lng);
  });
});

// Show the current time of the inouted location
async function showtime() {
  const locationInput = document.getElementById('locationInput').value;

  if (!locationInput.trim()) {
    alert('Please enter a location.');
    return;
  }

  try {
    const locResponse = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(locationInput)}&key=88d93b97c89241efa01d5d2f7382da69`
    );

    if (!locResponse.ok) {
      throw new Error(`API Error: ${locResponse.status}`);
    }

    const locData = await locResponse.json();

    if (!locData || locData.results.length === 0) {
      alert('Location not found. Please try another.');
      return;
    }

    const { lat, lng } = locData.results[0].geometry;
    map.setView([lat, lng], 10);

    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng]).addTo(map);
    }

    await fetchDataByCoordinates(lat, lng);
  } catch (error) {
    console.error('Error in showtime():', error);
    alert(`Error: ${error.message}`);
  }
}

// Clear the search
function clearInput() {
  // Clear the input field and reset other sections
  document.getElementById('locationInput').value = '';
  document.getElementById('suggestionList').innerHTML = '';
  document.getElementById('place').textContent = '-';
  document.getElementById('timezone').textContent = '-';
  document.getElementById('sunrise').textContent = '-';
  document.getElementById('sunset').textContent = '-';
  document.getElementById('dawn').textContent = '-';
  document.getElementById('dusk').textContent = '-';
  document.getElementById('day_length').textContent = '-';
  document.getElementById('solar_noon').textContent = '-';
  document.getElementById('current_temp').textContent = '-';
  document.getElementById('weatherAnimation').innerHTML = '';
  document.getElementById('forecast').innerHTML = '';

  // Retain the favorites section
  loadFavorites(); // Reloads the favorites from localStorage
  location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
  const mapOverlay = document.getElementById('map-overlay');
  const toggleSwitch = document.getElementById('toggle-map-interaction');

  // Initially disable map interaction
  mapOverlay.classList.remove('hidden');
  let isMapInteractionEnabled = false;

  // Handle the toggle switch state
  toggleSwitch.addEventListener('change', () => {
    isMapInteractionEnabled = toggleSwitch.checked;

    if (isMapInteractionEnabled) {
      // Hide the overlay and allow interaction
      mapOverlay.classList.add('hidden');
    } else {
      // Show the overlay and block interaction
      mapOverlay.classList.remove('hidden');
    }
  });
});

// Adding overlay so that the scroll doesn't affect the location position on the map
function activateMap() {
  const overlay = document.getElementById('map-overlay');
  overlay.classList.add('active');
}

let currentLat, currentLng;

// Obtain location details by obtaining the details of the co-ordinates
async function fetchDataByCoordinates(lat, lng) {
  try {

    currentLat = lat; // Store the current latitude
    currentLng = lng; // Store the current longitude

    // Fetch location details
    const locationResponse = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=88d93b97c89241efa01d5d2f7382da69`
    );

    if (!locationResponse.ok) {
      throw new Error(`OpenCage API error: ${locationResponse.status}`);
    }

    const locationData = await locationResponse.json();
    const location = locationData.results[0]?.formatted || 'Unknown location';
    const timezone = locationData.results[0]?.annotations.timezone.name || 'N/A';

    // Update location and timezone details in the UI
    document.getElementById('place').textContent = location;
    document.getElementById('timezone').textContent = timezone;

    // Fetch sunrise and sunset details
    await fetchSunriseSunset(lat, lng, timezone);

    // Fetch current weather details
    await fetchWeather(lat, lng);

    // Fetch weather forecast details
    await fetchForecast(lat, lng);

    // Fetch hourly forecast
    await fetchHourlyForecast(lat, lng); // New function call

    // Add a "Favorite" button
    const resultsSection = document.getElementById('results');

    // Fetch air quality index
    await fetchAirQuality(lat, lng);

    // Start automatic updates for the current location
    startAutoUpdate(lat, lng);

    // Remove any existing "Add to Favorites" button to prevent duplication
    const existingButton = document.querySelector('#results button');
    if (existingButton) {
      existingButton.remove();
    }

    // Create the new "Add to Favorites" button
    const favoriteButton = document.createElement('button');
    favoriteButton.textContent = 'Add to Favorites';
    favoriteButton.onclick = () => addFavorite(location, lat, lng);

    // Append the button to the results section
    resultsSection.appendChild(favoriteButton);


  } catch (error) {
    console.error('Error fetching data by coordinates:', error);
  }
}

async function fetchSunriseSunset(lat, lng, timezone) {
  try {
    const response = await fetch(`https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}`);
    const data = await response.json();

    document.getElementById('sunrise').textContent = data.results.sunrise || 'N/A';
    document.getElementById('sunset').textContent = data.results.sunset || 'N/A';
    document.getElementById('dawn').textContent = data.results.dawn || 'N/A';
    document.getElementById('dusk').textContent = data.results.dusk || 'N/A';
    document.getElementById('day_length').textContent = data.results.day_length || 'N/A';
    document.getElementById('solar_noon').textContent = data.results.solar_noon || 'N/A';

    updateCurrentTime(timezone);
  } catch (error) {
    console.error('Error fetching sunrise/sunset:', error);
  }
}

function clearAllFavorites() {
  favorites = [];
  saveFavorites();
  loadFavorites();
}

document.addEventListener('DOMContentLoaded', () => {
  loadFavorites(); // Load favorites on page load
});

// Initialize favorites
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Save favorites to localStorage
function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Load favorites from localStorage and display them
function loadFavorites() {
  const favoritesList = document.getElementById('favorites-list');
  favoritesList.innerHTML = ''; // Clear existing list

  favorites.forEach((favorite) => {
    const listItem = document.createElement('li');

    // Add weather icon
    const weatherIcon = document.createElement('img');
    weatherIcon.src = favorite.weatherIcon;
    weatherIcon.alt = 'Weather Icon';
    weatherIcon.style.width = '30px';
    weatherIcon.style.marginRight = '10px';

    // Add location name
    const locationName = document.createElement('span');
    locationName.textContent = favorite.name;

    // Create buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const viewButton = document.createElement('button');
    viewButton.textContent = 'View';
    viewButton.classList.add('view-favorite');
    viewButton.onclick = () => fetchDataByCoordinates(favorite.lat, favorite.lng);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.classList.add('remove-favorite');
    removeButton.onclick = () => removeFavorite(favorite.name);

    // Append buttons to the container
    buttonContainer.appendChild(viewButton);
    buttonContainer.appendChild(removeButton);

    // Append weather icon, location name, and buttons to the list item
    listItem.appendChild(weatherIcon);
    listItem.appendChild(locationName);
    listItem.appendChild(buttonContainer);

    // Append list item to the favorites list
    favoritesList.appendChild(listItem);
  });
}

// Remove a favorite
function removeFavorite(name) {
  favorites = favorites.filter((favorite) => favorite.name !== name);
  saveFavorites();
  loadFavorites();
}

async function addFavorite(name, lat, lng) {
  if (favorites.some((favorite) => favorite.name === name)) {
    alert('This location is already in your favorites.');
    return;
  }

  // Fetch weather data to get the icon
  try {
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=5f98d7f150db676e8080c4db0c8400c0&units=metric`
    );
    if (!weatherResponse.ok) throw new Error('Failed to fetch weather data');
    const weatherData = await weatherResponse.json();
    const weatherIcon = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;

    // Add favorite with weather icon
    favorites.push({ name, lat, lng, weatherIcon });
    saveFavorites();
    loadFavorites();
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}

async function fetchHourlyForecast(lat, lng) {
  try {
    // Fetch the hourly forecast data from WeatherAPI.com
    const hourlyForecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=4cd0de1c6a824709bc541054242911&q=${lat},${lng}&hours=12`;

    const forecastResponse = await fetch(hourlyForecastUrl);

    if (!forecastResponse.ok) {
      throw new Error('Hourly Forecast API failed');
    }

    const forecastData = await forecastResponse.json();

    const hourlyForecastContainer = document.getElementById('hourly-forecast');
    hourlyForecastContainer.innerHTML = ''; // Clear previous forecast

    // Get hourly forecast data for the next 12 hours
    const hourlyForecasts = forecastData.forecast.forecastday[0].hour;

    hourlyForecasts.forEach((entry) => {
      const time = new Date(entry.time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const temperature = Math.round(entry.temp_c); // Convert to Celsius
      const weatherDescription = entry.condition.text;
      const icon = entry.condition.icon;
      const iconUrl = `https:${icon}`; // Icon URL from WeatherAPI

      // Create the hourly forecast card
      const hourlyCard = `
        <div class="hourly-card">
          <p>${time}</p>
          <img src="${iconUrl}" alt="${weatherDescription}">
          <p><strong>${temperature}°C</strong></p>
          <p>${weatherDescription}</p>
        </div>
      `;
      hourlyForecastContainer.innerHTML += hourlyCard;
    });
  } catch (error) {
    console.error('Error fetching hourly forecast:', error);
    document.getElementById('hourly-forecast').textContent =
      'Unable to fetch hourly forecast data. Please try again later.';
  }
}


async function fetchWeather(lat, lng) {
  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=5f98d7f150db676e8080c4db0c8400c0&units=metric`;
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error('Weather API failed');
    }

    const weatherData = await weatherResponse.json();
    const weatherDescription = weatherData.weather[0]?.description || 'No description available';
    const currentTemp = Math.round(weatherData.main.temp) || 'N/A';
    // const feelsLike = Math.round(weatherData.main.feels_like) || 'N/A';
    const feelsLike = weatherData.main.feels_like? Math.round(weatherData.main.feels_like): 'N/A'; // Use 'N/A' if the value is missing


    // Update Current Temperature in the #results section
    document.getElementById('current_temp').textContent = `${currentTemp}°C`;
    document.getElementById('feels_like').textContent = `${feelsLike}°C`;

    // Map weather conditions to local JSON files
    const animations = {
      clear: './lottie/clear.json',
      sunny: './lottie/sunny.json',
      rain: './lottie/rainy.json',
      clouds: './lottie/cloudy.json',
      snow: './lottie/snowy.json',
      mist: './lottie/misty.json',
      thunder: './lottie/thunder.json',
    };

    let conditionKey = 'clear'; // Default condition
    if (weatherDescription.includes('rain')) conditionKey = 'rain';
    else if (weatherDescription.includes('cloud')) conditionKey = 'clouds';
    else if (weatherDescription.includes('snow')) conditionKey = 'snow';
    else if (weatherDescription.includes('mist')) conditionKey = 'mist';
    else if (weatherDescription.includes('thunder')) conditionKey = 'thunder';
    else if (weatherDescription.includes('sunny')) conditionKey = 'sunny';

    // Load the Lottie animation
    const animationContainer = document.getElementById('weatherAnimation');
    animationContainer.innerHTML = ''; // Clear previous animation
    lottie.loadAnimation({
      container: animationContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: animations[conditionKey], // Path to the local JSON file
    });

    // Add description below animation
    const weatherSection = document.getElementById('weather-section');
    const existingDescription = weatherSection.querySelector('.weather-description');
    if (existingDescription) {
      existingDescription.remove();
    }

    const conditionElement = document.createElement('p');
    conditionElement.classList.add('weather-description');
    conditionElement.innerHTML = `<strong>Condition:</strong> ${weatherDescription}`;
    weatherSection.appendChild(conditionElement);
  } catch (error) {
    console.error('Error fetching weather:', error);
  }
}

let debounceTimer; // For debouncing API calls

async function fetchSuggestions() {
  const input = document.getElementById('locationInput').value.trim();
  const suggestionList = document.getElementById('suggestionList');

  // Clear previous suggestions
  suggestionList.innerHTML = '';

  // Don't search for empty input
  if (!input) return;

  try {
    // Fetch suggestions from OpenCageData API
    const locationResponse = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(input)}&key=88d93b97c89241efa01d5d2f7382da69&limit=5`
    );

    if (!locationResponse.ok) {
      throw new Error(`OpenCage API error: ${locationResponse.status}`);
    }

    const locationData = await locationResponse.json();
    const results = locationData.results;

    if (results.length === 0) {
      const noResult = document.createElement('li');
      noResult.textContent = 'No suggestions found.';
      noResult.style.color = '#999';
      noResult.style.pointerEvents = 'none';
      suggestionList.appendChild(noResult);
      return;
    }

    // Display suggestions with weather information
    for (const result of results) {
      const { formatted, geometry } = result;
      const { lat, lng } = geometry;

      // Fetch weather data for each location
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=5f98d7f150db676e8080c4db0c8400c0&units=metric`;
      const weatherResponse = await fetch(weatherUrl);

      let weatherInfo = '';
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        const temperature = Math.round(weatherData.main.temp);
        const icon = weatherData.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        weatherInfo = `
          <div class="weather-info">
            <img src="${iconUrl}" alt="Weather Icon">
            <span>${temperature}°C</span>
          </div>
        `;
      }

      // Create the suggestion item
      const suggestion = document.createElement('li');
      suggestion.innerHTML = `
        <span>${formatted}</span>
        ${weatherInfo}
      `;

      // On click, update the map and fetch all data
      suggestion.onclick = async () => {
        document.getElementById('locationInput').value = formatted;
        suggestionList.innerHTML = ''; // Clear suggestions on selection

        // Update the map
        map.setView([lat, lng], 10);
        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng]).addTo(map);
        }

        // Fetch and display data for the selected location
        await fetchDataByCoordinates(lat, lng);
      };

      suggestionList.appendChild(suggestion);
    }
  } catch (error) {
    console.error('Error fetching suggestions:', error);
  }
}

// Debounce function to limit API calls
function debounce(func, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
}

function updateCurrentTime(timezone) {
  const currentTimeElement = document.getElementById('current_time');

  function updateTime() {
    const now = new Date();
    const options = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };

    try {
      const formatter = new Intl.DateTimeFormat('en-US', options);
      currentTimeElement.textContent = formatter.format(now);
    } catch (error) {
      console.error('Error updating time:', error);
      currentTimeElement.textContent = 'Error displaying time.';
    }
  }

  if (currentTimeElement.intervalId) {
    clearInterval(currentTimeElement.intervalId);
  }

  updateTime();
  currentTimeElement.intervalId = setInterval(updateTime, 1000);
}

async function fetchForecast(lat, lng) {
  try {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=5f98d7f150db676e8080c4db0c8400c0&units=metric`;
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      throw new Error('Forecast API failed');
    }

    const forecastData = await forecastResponse.json();
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = ''; // Clear previous forecast

    // Display forecast for the next 5 days (every 8th entry = 24-hour intervals)
    const dailyForecasts = forecastData.list.filter((_, index) => index % 8 === 0);

    dailyForecasts.forEach((entry) => {
      const date = new Date(entry.dt * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      const temp = Math.round(entry.main.temp);
      const weatherDescription = entry.weather[0].description;
      const icon = entry.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

      // Create a forecast card
      const forecastCard = `
        <div class="forecast-card">
          <p>${date}</p>
          <img src="${iconUrl}" alt="${weatherDescription}">
          <p><strong>${temp}°C</strong></p>
          <p>${weatherDescription}</p>
        </div>
      `;

      forecastContainer.innerHTML += forecastCard;
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    document.getElementById('forecast').textContent =
      'Unable to fetch forecast data. Please try again later.';
  }
}

async function fetchAirQuality(lat, lng) {
  try {
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=5f98d7f150db676e8080c4db0c8400c0`;

    const response = await fetch(airQualityUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch Air Quality Index');
    }

    const airQualityData = await response.json();
    const aqi = airQualityData.list[0].main.aqi;

    // Map AQI value to descriptive categories
    const aqiDescriptions = [
      'Good (1)',
      'Fair (2)',
      'Moderate (3)',
      'Poor (4)',
      'Very Poor (5)',
    ];
    const aqiDescription = aqiDescriptions[aqi - 1] || 'Unknown';

    // Update the Air Quality Index in the UI
    document.getElementById('air_quality').textContent = aqiDescription;
  } catch (error) {
    console.error('Error fetching Air Quality Index:', error);
    document.getElementById('air_quality').textContent = 'Unable to fetch';
  }
}

// Auto Update telemetries
let autoUpdateInterval;

function startAutoUpdate(lat, lng) {
  // Clear any existing interval to prevent duplicates
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
  }

  // Set a new interval to fetch data every 10 minutes (600,000 ms)
  autoUpdateInterval = setInterval(() => {
    fetchDataByCoordinates(lat, lng);
  }, 600000); // 10 minutes
}

function stopAutoUpdate() {
  // Clear the interval to stop automatic updates
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
    autoUpdateInterval = null;
  }
}

function toggleAutoUpdate() {
  const toggle = document.getElementById('autoUpdateToggle');
  if (toggle.checked) {
    // Get the current latitude and longitude from your app's state
    const lat = currentLat; // Replace with the actual latitude variable
    const lng = currentLng; // Replace with the actual longitude variable
    startAutoUpdate(lat, lng);
  } else {
    stopAutoUpdate();
  }
}

