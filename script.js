// script.js - Weather Now (Open-Meteo, no API key needed)

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const infoDiv = document.getElementById("info");

searchBtn.addEventListener("click", () => fetchWeatherForCity());
cityInput.addEventListener("keydown", (e) => { if (e.key === "Enter") fetchWeatherForCity(); });

async function fetchWeatherForCity() {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  clearInfo();
  showLoading("Finding city coordinates...");

  try {
    // 1) Geocoding (city -> lat/lon) using Open-Meteo geocoding
    const geoResp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5`);
    const geoJson = await geoResp.json();

    if (!geoJson.results || geoJson.results.length === 0) {
      showError("City not found. Try a different name.");
      return;
    }

    // pick first result (most relevant)
    const place = geoJson.results[0];
    const lat = place.latitude;
    const lon = place.longitude;
    const displayName = `${place.name}${place.admin1 ? ", " + place.admin1 : ""}, ${place.country}`;

    showLoading("Fetching current weather...");

    // 2) Get current weather
    // current_weather=true returns temperature (C) and windspeed (km/h) and weathercode
    const weatherResp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const weatherJson = await weatherResp.json();

    if (!weatherJson.current_weather) {
      showError("Weather info not available for this location.");
      return;
    }

    const current = weatherJson.current_weather;
    // Map weathercode to readable description (simple mapping)
    const desc = weatherCodeToDesc(current.weathercode);

    renderWeather({
      name: displayName,
      temperature: current.temperature,
      windspeed: current.windspeed,
      description: desc,
      time: current.time
    });

  } catch (err) {
    console.error(err);
    showError("Network error or API problem. Try again.");
  }
}

// small helper UI functions
function clearInfo() {
  infoDiv.innerHTML = "";
}
function showLoading(msg) {
  infoDiv.innerHTML = `<div class="loading">${escapeHtml(msg)}</div>`;
}
function showError(msg) {
  infoDiv.innerHTML = `<div class="error">${escapeHtml(msg)}</div>`;
}

function renderWeather({name, temperature, windspeed, description, time}) {
  infoDiv.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-size:16px;">${escapeHtml(name)}</div>
          <div class="small">${escapeHtml(time)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:22px; font-weight:800;">${temperature}°C</div>
          <div class="small">Wind: ${windspeed} km/h</div>
        </div>
      </div>
      <div style="margin-top:8px; font-size:14px;">${escapeHtml(description)}</div>
    </div>
  `;
}

// small escape to avoid accidental HTML injection if names contain characters
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// map open-meteo weather codes to human text (basic)
function weatherCodeToDesc(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return map[code] || `Weather code ${code}`;
}
