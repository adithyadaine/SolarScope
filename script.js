// API Keys are no longer needed directly in this client-side script.
// Calls will be made to Vercel Serverless Functions in the /api directory.

// DIsplay map contents
let map;
let marker;

document.addEventListener('DOMContentLoaded', () => {
  // No API key check needed here anymore

  map = L.map('map').setView([51.505, -0.09], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  map.on('click', async (e) => {
    const toggleSwitch = document.getElementById('toggle-map-interaction');
    if (!toggleSwitch || !toggleSwitch.checked) {
      return;
    }
    const { lat, lng } = e.latlng;
    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }
    await fetchDataByCoordinates(lat, lng);
  });

  setupMapInteractionToggle();
  loadFavorites();
  initLocation();
  updateCopyrightYear();
});

function initLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Update map
        if (map) {
          map.setView([latitude, longitude], 10);
          if (marker) {
            marker.setLatLng([latitude, longitude]);
          } else {
            marker = L.marker([latitude, longitude]).addTo(map);
          }
        }
        // Fetch data
        fetchDataByCoordinates(latitude, longitude);
      },
      (error) => {
        console.warn('Geolocation denied or failed. Using default location.', error);
        // Fallback: Default to London
        fetchDataByCoordinates(51.505, -0.09);
      }
    );
  } else {
    // Fallback: No geolocation support
    fetchDataByCoordinates(51.505, -0.09);
  }
}

function setupMapInteractionToggle() {
  const mapOverlay = document.getElementById('map-overlay');
  const toggleSwitch = document.getElementById('toggle-map-interaction');
  if (!mapOverlay || !toggleSwitch) return;

  let isMapInteractionEnabled = toggleSwitch.checked;
  if (!isMapInteractionEnabled) {
    mapOverlay.classList.remove('hidden');
  } else {
    mapOverlay.classList.add('hidden');
  }

  toggleSwitch.addEventListener('change', () => {
    isMapInteractionEnabled = toggleSwitch.checked;
    if (isMapInteractionEnabled) {
      mapOverlay.classList.add('hidden');
    } else {
      mapOverlay.classList.remove('hidden');
    }
  });
}

async function showtime() {
  // This function might be less relevant now but kept for potential use
  const locationInput = document.getElementById('locationInput').value;
  if (!locationInput.trim()) {
    return;
  }
  try {
    // Call Vercel function for geocoding
    const locResponse = await fetch(
      `/api/geocode?query=${encodeURIComponent(locationInput)}`
    );
    if (!locResponse.ok) {
      // Try to get error message from Vercel function response
      const errorData = await locResponse.json().catch(() => ({})); // Catch if response isn't JSON
      throw new Error(
        `API Error: ${locResponse.status} - ${errorData.error || locResponse.statusText}`
      );
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

function clearInput() {
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
  document.getElementById('feels_like').textContent = '-';
  document.getElementById('air_quality').textContent = '-';
  document.getElementById('current_time').textContent = '-';

  const animationContainer = document.getElementById('weatherAnimation');
  if (animationContainer) animationContainer.innerHTML = '';
  const weatherDescContainer = document.querySelector(
    '.weather-description-container'
  );
  if (weatherDescContainer) weatherDescContainer.innerHTML = '';

  const hourlyForecastContainer = document.getElementById('hourly-forecast');
  if (hourlyForecastContainer) hourlyForecastContainer.innerHTML = '';
  const forecastContainer = document.getElementById('forecast');
  if (forecastContainer) forecastContainer.innerHTML = '';

  // Reset the header icon to default
  const headerIcon = document.getElementById("sunImage");
  if (headerIcon) {
    headerIcon.src = "./images/sun.png";
    headerIcon.alt = "Sun icon";
  }

  map.setView([51.505, -0.09], 2);
  if (marker) {
    map.removeLayer(marker);
    marker = null;
  }

  const favoriteButton = document.getElementById('add-favorite');
  if (favoriteButton) {
    favoriteButton.onclick = null;
    favoriteButton.disabled = true;
  }

  stopAutoUpdate();
  const autoUpdateToggle = document.getElementById('autoUpdateToggle');
  if (autoUpdateToggle) autoUpdateToggle.checked = false;
}

let currentLat, currentLng;

async function fetchDataByCoordinates(lat, lng) {
  // No API key check needed here

  try {
    currentLat = lat;
    currentLng = lng;

    // Call Vercel function for reverse geocoding
    const locationResponse = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    if (!locationResponse.ok) {
      const errorData = await locationResponse.json().catch(() => ({}));
      throw new Error(
        `Geocode API Error: ${locationResponse.status} - ${errorData.error || locationResponse.statusText}`
      );
    }
    const locationData = await locationResponse.json();
    const location = locationData.results[0]?.formatted || 'Unknown location';
    const timezone =
      locationData.results[0]?.annotations.timezone.name || 'N/A';

    document.getElementById('place').textContent = location;
    updateFavoriteUI(location);
    document.getElementById('timezone').textContent = timezone;

    // These calls now go to your Vercel API endpoints
    await fetchSunriseSunset(lat, lng, timezone);
    await fetchWeather(lat, lng);
    await fetchForecast(lat, lng);
    await fetchHourlyForecast(lat, lng);
    await fetchAirQuality(lat, lng);

    const favoriteButton = document.getElementById('add-favorite');
    if (favoriteButton) {
      favoriteButton.onclick = () => addFavorite(location, lat, lng);
      favoriteButton.disabled = false;
    }

    const autoUpdateToggle = document.getElementById('autoUpdateToggle');
    if (autoUpdateToggle && autoUpdateToggle.checked) {
      startAutoUpdate(lat, lng);
    }
  } catch (error) {
    console.error('Error fetching data by coordinates:', error);
    alert(`Failed to fetch location data: ${error.message}`);
  }
}

async function fetchSunriseSunset(lat, lng, timezone) {
  try {
    // Call Vercel function for sunrise/sunset
    const response = await fetch(`/api/sunrisesunset?lat=${lat}&lng=${lng}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Sunrise/Sunset API Error: ${response.status} - ${errorData.error || response.statusText}`
      );
    }
    const data = await response.json();
    if (data.status !== 'OK') {
      // Handle API-specific errors if needed
      throw new Error(data.status || 'Sunrise/Sunset API error');
    }
    document.getElementById('sunrise').textContent =
      data.results.sunrise || 'N/A';
    document.getElementById('sunset').textContent = data.results.sunset || 'N/A';
    document.getElementById('dawn').textContent = data.results.dawn || 'N/A';
    document.getElementById('dusk').textContent = data.results.dusk || 'N/A';
    document.getElementById('day_length').textContent =
      data.results.day_length || 'N/A';
    document.getElementById('solar_noon').textContent =
      data.results.solar_noon || 'N/A';
    updateCurrentTime(timezone);
  } catch (error) {
    console.error('Error fetching sunrise/sunset:', error);
    document.getElementById('sunrise').textContent = 'Error';
    document.getElementById('sunset').textContent = 'Error';
    // Clear other fields too
    document.getElementById('dawn').textContent = 'Error';
    document.getElementById('dusk').textContent = 'Error';
    document.getElementById('day_length').textContent = 'Error';
    document.getElementById('solar_noon').textContent = 'Error';
  }
}

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function loadFavorites() {
  const favoritesList = document.getElementById('favorites-list');
  if (!favoritesList) return;
  favoritesList.innerHTML = '';
  
  if (favorites.length === 0) {
    // Empty state handled by CSS :empty::before
    return;
  }
  
  favorites.forEach((favorite) => {
    const listItem = document.createElement('li');
    
    // Container
    const favItem = document.createElement('div');
    favItem.classList.add('fav-item');
    
    // 1. Name
    const locationName = document.createElement('span');
    locationName.textContent = favorite.name.split(',')[0]; // Just city name
    locationName.style.fontWeight = '500';
    
    // 2. Weather Info (Async Fetch)
    const weatherInfo = document.createElement('div');
    weatherInfo.className = 'fav-weather-info';
    weatherInfo.style.display = 'flex';
    weatherInfo.style.alignItems = 'center';
    weatherInfo.style.gap = '8px';
    weatherInfo.style.marginRight = '12px'; // Spacing from remove btn
    weatherInfo.style.marginLeft = 'auto';  // Push to right (next to remove)
    
    // Initial State (Placeholder or generic)
    weatherInfo.innerHTML = '<span style="font-size:12px; opacity:0.7">...</span>';

    // Fetch Weather
    fetch(`/api/weather?type=current&lat=${favorite.lat}&lon=${favorite.lng}`)
      .then(res => res.json())
      .then(data => {
         if (data.main && data.weather) {
            const temp = Math.round(data.main.temp);
            const iconCode = data.weather[0].icon;
            // Use small icon
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
            
            weatherInfo.innerHTML = `
              <img src="${iconUrl}" alt="weather" style="width:24px; height:24px; display:block;">
              <span style="font-weight:600; font-size:14px;">${temp}°</span>
            `;
         } else {
             weatherInfo.textContent = '';
         }
      })
      .catch((e) => {
         console.warn('Fav weather fetch failed', e);
         weatherInfo.textContent = '';
      });

    // 3. Remove Button
    const removeBtn = document.createElement('span');
    removeBtn.classList.add('remove-fav');
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeFavorite(favorite.name);
    };
    
    // Click Row to Load
    favItem.onclick = () => {
      map.setView([favorite.lat, favorite.lng], 10);
      if (marker) {
        marker.setLatLng([favorite.lat, favorite.lng]);
      } else {
        marker = L.marker([favorite.lat, favorite.lng]).addTo(map);
      }
      fetchDataByCoordinates(favorite.lat, favorite.lng);
      closeModal('favoritesModal');
    };
    
    // Assemble
    favItem.appendChild(locationName);
    favItem.appendChild(weatherInfo);
    favItem.appendChild(removeBtn);
    
    listItem.appendChild(favItem);
    favoritesList.appendChild(listItem);
  });
}

function removeFavorite(name) {
  favorites = favorites.filter((favorite) => favorite.name !== name);
  saveFavorites();
  loadFavorites();
  const currentLocation = document.getElementById('place').textContent;
  updateFavoriteUI(currentLocation);
}

async function addFavorite(name, lat, lng) {
  if (favorites.some((favorite) => favorite.name === name)) {
    removeFavorite(name);
    return;
  }
  try {
    // Call Vercel function for current weather (to get icon)
    const weatherResponse = await fetch(
      `/api/weather?type=current&lat=${lat}&lon=${lng}`
    );
    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json().catch(() => ({}));
      throw new Error(
        `Weather API Error: ${weatherResponse.status} - ${errorData.error || weatherResponse.statusText}`
      );
    }
    const weatherData = await weatherResponse.json();
    const weatherIcon = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
    favorites.push({ name, lat, lng, weatherIcon });
    saveFavorites();
    loadFavorites();
    updateFavoriteUI(name);
  } catch (error) {
    console.error('Error fetching weather data for favorite icon:', error);
    // Add favorite with default icon if fetch fails
    favorites.push({ name, lat, lng, weatherIcon: './images/sun.png' });
    saveFavorites();
    loadFavorites();
    updateFavoriteUI(name);
  }
}

let clearConfirmTimer;

function handleClearFavorites(btn) {
  if (btn.classList.contains('confirm-state')) {
    // Confirmed
    performClearFavorites();
    resetClearButton(btn);
  } else {
    // First Click
    btn.classList.add('confirm-state');
    btn.textContent = 'Confirm Clear?';
    if (clearConfirmTimer) clearTimeout(clearConfirmTimer);
    clearConfirmTimer = setTimeout(() => resetClearButton(btn), 4000);
  }
}

function resetClearButton(btn) {
  if (!btn) return;
  btn.classList.remove('confirm-state');
  btn.textContent = 'Clear All';
}

function performClearFavorites() {
  favorites = [];
  saveFavorites();
  loadFavorites();
  
  const currentLocation = document.getElementById('place').textContent;
  updateFavoriteUI(currentLocation);
}

async function fetchHourlyForecast(lat, lng) {
  const hourlyForecastContainer = document.getElementById('hourly-forecast');
  if (!hourlyForecastContainer) return;
  hourlyForecastContainer.innerHTML = '<p>Loading hourly forecast...</p>';
  try {
    // Call Vercel function for hourly forecast
    const forecastResponse = await fetch(`/api/hourly?lat=${lat}&lng=${lng}`);
    if (!forecastResponse.ok) {
      const errorData = await forecastResponse.json().catch(() => ({}));
      throw new Error(
        `Hourly API Error: ${forecastResponse.status} - ${errorData.error || forecastResponse.statusText}`
      );
    }
    const forecastData = await forecastResponse.json();
    hourlyForecastContainer.innerHTML = '';
    const hourlyForecasts = forecastData.forecast.forecastday[0].hour;
    hourlyForecasts.forEach((entry) => {
      const time = new Date(entry.time).toLocaleTimeString('en-US', {
        hour: 'numeric',
      });
      const temperature = Math.round(entry.temp_c);
      const weatherDescription = entry.condition.text;
      const icon = entry.condition.icon;
      const iconUrl = `https:${icon}`;
      const hourlyCard = document.createElement('div');
      hourlyCard.classList.add('hourly-card');
      hourlyCard.innerHTML = `
        <p class="time">${time}</p>
        <img src="${iconUrl}" alt="${weatherDescription}">
        <p class="temp">${temperature}°C</p>
        <p class="desc">${weatherDescription}</p>
      `;
      hourlyForecastContainer.appendChild(hourlyCard);
    });
  } catch (error) {
    console.error('Error fetching hourly forecast:', error);
    hourlyForecastContainer.innerHTML =
      '<p class="error-message">Unable to fetch hourly forecast.</p>';
  }
}

async function fetchWeather(lat, lng) {
  const animationContainer = document.getElementById('weatherAnimation');
  const descContainer = document.querySelector('.weather-description-container');
  if (animationContainer) animationContainer.innerHTML = '';
  if (descContainer) descContainer.innerHTML = '<p>Loading weather...</p>';
  try {
    // Call Vercel function for current weather
    const weatherResponse = await fetch(
      `/api/weather?type=current&lat=${lat}&lon=${lng}`
    );
    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json().catch(() => ({}));
      throw new Error(
        `Weather API Error: ${weatherResponse.status} - ${errorData.error || weatherResponse.statusText}`
      );
    }
    const weatherData = await weatherResponse.json();

    // // --- SUGGESTION START ---
    // // Dynamically update the header icon based on day/night
    // if (headerIcon && weatherData.weather && weatherData.weather[0]) {
    //   const iconCode = weatherData.weather[0].icon;
    //   const isNight = iconCode.slice(-1) === "n";
    //   headerIcon.src = isNight ? "./images/moon.png" : "./images/sun.png";
    //   headerIcon.alt = isNight ? "Moon icon" : "Sun icon";
    // }
    // // --- SUGGESTION END ---

    const weatherDescription =
      weatherData.weather[0]?.description || 'No description available';
    const currentTemp = Math.round(weatherData.main.temp);
    const feelsLike = weatherData.main.feels_like
      ? Math.round(weatherData.main.feels_like)
      : 'N/A';
    const windSpeed = weatherData.wind?.speed ? `${Math.round(weatherData.wind.speed)} m/s` : '--';
    const humidity = weatherData.main?.humidity ? `${weatherData.main.humidity}%` : '--';
    
    document.getElementById('current_temp').textContent = currentTemp;
    document.getElementById('feels_like').textContent = `${feelsLike}°C`;
    
    // New dashboard elements
    const windEl = document.getElementById('wind_speed');
    const humidEl = document.getElementById('humidity');
    const descEl = document.getElementById('weather_desc');
    if (windEl) windEl.textContent = windSpeed;
    if (humidEl) humidEl.textContent = humidity;
    if (descEl) descEl.textContent = weatherDescription;
    const animations = {
      clear: './lottie/clear.json',
      sunny: './lottie/sunny.json',
      rain: './lottie/rainy.json',
      clouds: './lottie/cloudy.json',
      snow: './lottie/snowy.json',
      mist: './lottie/misty.json',
      thunder: './lottie/thunder.json',
    };
    let conditionKey = 'clear';
    const descLower = weatherDescription.toLowerCase();
    if (descLower.includes('rain')) conditionKey = 'rain';
    else if (descLower.includes('cloud')) conditionKey = 'clouds';
    else if (descLower.includes('snow')) conditionKey = 'snow';
    else if (descLower.includes('mist') || descLower.includes('fog'))
      conditionKey = 'mist';
    else if (descLower.includes('thunder')) conditionKey = 'thunder';
    else if (descLower.includes('sun') || descLower.includes('clear'))
      conditionKey = 'sunny';
    if (animationContainer) {
      lottie.loadAnimation({
        container: animationContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: animations[conditionKey] || animations['clear'],
      });
    }
    if (descContainer) {
      descContainer.innerHTML = `<p>Condition: ${weatherDescription}</p>`;
    }
  } catch (error) {
    console.error('Error fetching weather:', error);
    if (descContainer)
      descContainer.innerHTML = '<p class="error-message">Weather unavailable.</p>';
    document.getElementById('current_temp').textContent = 'Error';
    document.getElementById('feels_like').textContent = 'Error';
  }
}

let debounceTimer;

// async function fetchSuggestions() {
//   const input = document.getElementById('locationInput').value.trim();
//   const suggestionList = document.getElementById('suggestionList');
//   suggestionList.innerHTML = '';
//   if (!input) return;
//   try {
//     // Call Vercel function for geocoding suggestions
//     const locationResponse = await fetch(
//       `/api/geocode?query=${encodeURIComponent(input)}`
//     );
//     if (!locationResponse.ok) {
//       const errorData = await locationResponse.json().catch(() => ({}));
//       throw new Error(
//         `Suggestion API Error: ${locationResponse.status} - ${errorData.error || locationResponse.statusText}`
//       );
//     }
//     const locationData = await locationResponse.json();
//     const results = locationData.results;
//     if (results.length === 0) {
//       const noResult = document.createElement('li');
//       noResult.textContent = 'No suggestions found.';
//       noResult.style.color = '#999';
//       noResult.style.pointerEvents = 'none';
//       suggestionList.appendChild(noResult);
//       return;
//     }
//     for (const result of results) {
//       const { formatted, geometry } = result;
//       const { lat, lng } = geometry;
//       const suggestion = document.createElement('li');
//       suggestion.innerHTML = `<span>${formatted}</span>`;
//       suggestion.onclick = async () => {
//         document.getElementById('locationInput').value = formatted;
//         suggestionList.innerHTML = '';
//         map.setView([lat, lng], 10);
//         if (marker) {
//           marker.setLatLng([lat, lng]);
//         } else {
//           marker = L.marker([lat, lng]).addTo(map);
//         }
//         await fetchDataByCoordinates(lat, lng);
//       };
//       suggestionList.appendChild(suggestion);
//     }
//   } catch (error) {
//     console.error('Error fetching suggestions:', error);
//     suggestionList.innerHTML =
//       '<li style="color: red; pointer-events: none;">Error fetching suggestions.</li>';
//   }
// }

async function fetchSuggestions() {
  const input = document.getElementById('locationInput').value.trim();
  const suggestionList = document.getElementById('suggestionList');
  suggestionList.innerHTML = '';
  if (!input) return;

  try {
    // Call Vercel function for geocoding suggestions
    const locationResponse = await fetch(
      `/api/geocode?query=${encodeURIComponent(input)}`
    );
    if (!locationResponse.ok) {
      const errorData = await locationResponse.json().catch(() => ({}));
      throw new Error(
        `Suggestion API Error: ${locationResponse.status} - ${errorData.error || locationResponse.statusText}`
      );
    }
    const locationData = await locationResponse.json();
    const results = locationData.results;

    if (results.length === 0) {
      const noResult = document.createElement('li');
      noResult.textContent = 'No suggestions found.';
      noResult.style.color = 'var(--text-secondary)'; // Use CSS variable
      noResult.style.pointerEvents = 'none';
      suggestionList.appendChild(noResult);
      return;
    }

    // Use Promise.all to fetch weather for all suggestions concurrently
    const suggestionPromises = results.map(async (result) => {
      const { formatted, geometry } = result;
      const { lat, lng } = geometry;

      let weatherInfo = '';
      try {
        // --- Fetch weather for the icon ---
        const weatherResponse = await fetch(
          `/api/weather?type=current&lat=${lat}&lon=${lng}` // Call your Vercel weather function
        );
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          if (weatherData.weather && weatherData.weather[0]) {
            const temperature = Math.round(weatherData.main.temp);
            const icon = weatherData.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${icon}.png`; // Use smaller .png for list

            weatherInfo = `
              <div class="weather-info">
                <img src="${iconUrl}" alt="Weather Icon" style="width: 25px; height: 25px;">
                <span>${temperature}°C</span>
              </div>
            `;
          }
        }
        // --- End fetch weather ---
      } catch (weatherError) {
        console.warn(`Could not fetch weather for suggestion "${formatted}":`, weatherError);
        // Keep weatherInfo empty if fetch fails
      }

      // Return an object containing the data needed to create the list item
      return { formatted, lat, lng, weatherInfo };
    });

    // Wait for all weather fetches to complete (or fail)
    const suggestionsData = await Promise.all(suggestionPromises);

    // Now create and append list items
    suggestionsData.forEach(({ formatted, lat, lng, weatherInfo }) => {
      const suggestion = document.createElement('li');
      suggestion.innerHTML = `
        <span>${formatted}</span>
        ${weatherInfo}
      `;
      suggestion.onclick = async () => {
        document.getElementById('locationInput').value = formatted;
        suggestionList.innerHTML = '';
        map.setView([lat, lng], 10);
        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng]).addTo(map);
        }
        await fetchDataByCoordinates(lat, lng);
      };
      suggestionList.appendChild(suggestion);
    });

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    suggestionList.innerHTML =
      '<li style="color: var(--danger-color); pointer-events: none;">Error fetching suggestions.</li>'; // Use CSS variable
  }
}


function debounce(func, delay) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(func, delay);
}

function updateCurrentTime(timezone) {
  const currentTimeElement = document.getElementById('current_time');
  if (!currentTimeElement) return;
  if (currentTimeElement.intervalId) {
    clearInterval(currentTimeElement.intervalId);
  }
  function updateTime() {
    try {
      const now = new Date();
      const options = {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      // Validate timezone before formatting
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      const formatter = new Intl.DateTimeFormat('en-US', options);
      currentTimeElement.textContent = formatter.format(now);
    } catch (error) {
      console.error('Error updating time (Invalid Timezone?):', error);
      currentTimeElement.textContent = 'Invalid Timezone';
      if (currentTimeElement.intervalId) {
        clearInterval(currentTimeElement.intervalId);
        currentTimeElement.intervalId = null;
      }
    }
  }
  updateTime();
  currentTimeElement.intervalId = setInterval(updateTime, 1000);
}

async function fetchForecast(lat, lng) {
  const forecastContainer = document.getElementById('forecast');
  if (!forecastContainer) return;
  forecastContainer.innerHTML = '<p>Loading forecast...</p>';
  try {
    // Call Vercel function for daily forecast
    const forecastResponse = await fetch(
      `/api/weather?type=forecast&lat=${lat}&lon=${lng}`
    );
    if (!forecastResponse.ok) {
      const errorData = await forecastResponse.json().catch(() => ({}));
      throw new Error(
        `Forecast API Error: ${forecastResponse.status} - ${errorData.error || forecastResponse.statusText}`
      );
    }
    const forecastData = await forecastResponse.json();
    forecastContainer.innerHTML = '';
    const dailyForecasts = forecastData.list.filter(
      (_, index) => index % 8 === 0
    );
    dailyForecasts.forEach((entry) => {
      const date = new Date(entry.dt * 1000).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const temp = Math.round(entry.main.temp);
      const weatherDescription = entry.weather[0].description;
      const icon = entry.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
      const forecastCard = document.createElement('div');
      forecastCard.classList.add('forecast-card-item');
      forecastCard.innerHTML = `
        <p class="date">${date}</p>
        <img src="${iconUrl}" alt="${weatherDescription}">
        <p class="temp">${temp}°C</p>
        <p class="desc">${weatherDescription}</p>
      `;
      forecastContainer.appendChild(forecastCard);
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    forecastContainer.innerHTML =
      '<p class="error-message">Unable to fetch forecast.</p>';
  }
}

async function fetchAirQuality(lat, lng) {
  const airQualityElement = document.getElementById('air_quality');
  if (!airQualityElement) return;
  airQualityElement.textContent = 'Loading...';
  try {
    // Call Vercel function for AQI
    const response = await fetch(`/api/weather?type=aqi&lat=${lat}&lon=${lng}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `AQI API Error: ${response.status} - ${errorData.error || response.statusText}`
      );
    }
    const airQualityData = await response.json();
    // Check if list exists and has data
    if (!airQualityData.list || airQualityData.list.length === 0) {
        throw new Error('AQI data format unexpected');
    }
    const aqi = airQualityData.list[0].main.aqi;
    const aqiDescriptions = [
      'Good (1)',
      'Fair (2)',
      'Moderate (3)',
      'Poor (4)',
      'Very Poor (5)',
    ];
    const aqiDescription = aqiDescriptions[aqi - 1] || `Unknown (${aqi})`;
    airQualityElement.textContent = aqiDescription;
  } catch (error) {
    console.error('Error fetching Air Quality Index:', error);
    airQualityElement.textContent = 'Unavailable';
  }
}

let autoUpdateInterval;

function startAutoUpdate(lat, lng) {
  stopAutoUpdate();
  console.log('Starting auto-update...');
  autoUpdateInterval = setInterval(() => {
    console.log('Auto-updating data...');
    fetchDataByCoordinates(lat, lng);
  }, 600000);
}

function stopAutoUpdate() {
  if (autoUpdateInterval) {
    console.log('Stopping auto-update.');
    clearInterval(autoUpdateInterval);
    autoUpdateInterval = null;
  }
}

function toggleAutoUpdate() {
  const toggle = document.getElementById('autoUpdateToggle');
  if (toggle.checked) {
    if (typeof currentLat !== 'undefined' && typeof currentLng !== 'undefined') {
      startAutoUpdate(currentLat, currentLng);
    } else {
      console.log('Cannot start auto-update: No location selected.');
    }
  } else {
    stopAutoUpdate();
  }
}

// --- Dark Mode Toggle ---
const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');

if (currentTheme === 'dark') {
  document.body.classList.add('dark-mode');
  updateThemeButton(true);
} else {
  updateThemeButton(false);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    let theme = 'light';
    if (document.body.classList.contains('dark-mode')) {
      theme = 'dark';
    }
    localStorage.setItem('theme', theme);
    updateThemeButton(theme === 'dark');
  });
} else {
  console.warn('Theme toggle button not found.');
}

function updateThemeButton(isDarkMode) {
  if (themeToggleBtn) {
    if (isDarkMode) {
      themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
      themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
      themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
      themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
    }
  }
}

function handleThemeTransition() {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 350);
    }
}

const observer = new MutationObserver((mutationsList) => {
    for(let mutation of mutationsList) {
        if (mutation.attributeName === 'class') {
            handleThemeTransition();
        }
    }
});
observer.observe(document.body, { attributes: true });

handleThemeTransition();
// --- End Dark Mode Toggle ---

/* ============================================
   Modal Functions
   ============================================ */
function openModal(modalId) {
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById(modalId);
  if (overlay && modal) {
    overlay.classList.remove('hidden');
    // Hide all modals first
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    // Show requested modal
    modal.classList.remove('hidden');
    
    // Trigger Status Check if opening status modal
    if (modalId === 'statusModal') {
      checkSystemStatus();
    }
  }
}

function closeModal(modalId) {
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById(modalId);
  if (overlay && modal) {
    overlay.classList.add('hidden');
    modal.classList.add('hidden');
  }
}

function closeAllModals(event) {
  // Close if clicking the overlay (outside the modal)
  if (event.target.id === 'modalOverlay') {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  }
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('modalOverlay');
    if (overlay && !overlay.classList.contains('hidden')) {
      overlay.classList.add('hidden');
      document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    }
  }
});

// Update UI based on favorite status
function updateFavoriteUI(locationName) {
  if (!locationName) return;
  // Normalize checking (case-insensitive? or exact?)
  const isFav = favorites.some(fav => fav.name === locationName);
  
  // Header Icon
  const headerIcon = document.getElementById('header-fav-icon');
  if (headerIcon) {
    if (isFav) {
      headerIcon.classList.remove('far');
      headerIcon.classList.add('fas', 'is-favorite');
    } else {
      headerIcon.classList.remove('fas', 'is-favorite');
      headerIcon.classList.add('far');
    }
  }

  // Hero Add Button
  const addFavBtn = document.getElementById('add-favorite');
  if (addFavBtn) {
    const icon = addFavBtn.querySelector('i');
    if (icon) {
      if (isFav) {
        icon.classList.remove('far');
        icon.classList.add('fas', 'is-favorite');
      } else {
        icon.classList.remove('fas', 'is-favorite');
        icon.classList.add('far');
      }
    }
  }
}

/* ============================================
   System Status Logic
   ============================================ */
function checkSystemStatus() {
  const updateStatus = (id, status) => {
    const el = document.getElementById(id);
    if (!el) return;
    const dot = el.querySelector('.status-dot');
    const text = el.querySelector('.status-text');
    
    // Reset classes
    dot.className = 'status-dot';
    if (status === 'loading') dot.classList.add('loading');
    if (status === 'error') dot.classList.add('error');
    
    // Update text
    if (status === 'loading') text.textContent = 'Checking...';
    else if (status === 'error') text.textContent = 'Outage / Slow';
    else text.textContent = 'Operational';
  };

  // Set initial loading state
  updateStatus('status-weather-state', 'loading');
  updateStatus('status-map-state', 'loading');
  updateStatus('status-backend-state', 'loading');

  // Update Check Time
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const checkEl = document.getElementById('status-last-checked');
  if (checkEl) checkEl.innerHTML = `<i class="far fa-clock"></i> Last checked: Today, ${timeString}`;

  // 1. Check Backend & Weather (Proxied)
  // We ping the weather API. Even a 400 Bad Request means the backend is UP.
  fetch('/api/weather')
    .then(res => {
      // 5xx means Server Error. Anything else means server is reachable.
      if (res.status < 500) {
        updateStatus('status-backend-state', 'success');
        updateStatus('status-weather-state', 'success');
      } else {
        updateStatus('status-backend-state', 'error');
        updateStatus('status-weather-state', 'error');
      }
    })
    .catch(err => {
      console.error('Status Check Failed:', err);
      updateStatus('status-backend-state', 'error');
      updateStatus('status-weather-state', 'error');
    });

  // 2. Check Map Tiles (OSM)
  const img = new Image();
  img.onload = () => updateStatus('status-map-state', 'success');
  img.onerror = () => updateStatus('status-map-state', 'error');
  // Load a random low-zoom tile to avoid cache
  img.src = `https://tile.openstreetmap.org/0/0/0.png?t=${Date.now()}`;
}
function updateCopyrightYear() {
  const yearElement = document.getElementById('copyright-year');
  if (yearElement) {
    const currentYear = new Date().getFullYear();
    yearElement.textContent = `© ${currentYear}`;
  }
}
