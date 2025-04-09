import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import { LoadScript, Autocomplete } from "@react-google-maps/api";
import logo from "./assets/weathernest-long.png";
import { getImageBrightness } from "./utils/colorHelper";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons';

const libraries = ["places"];

const weatherToGif = {
  Sunny: "clear.gif",
  Clear: "clear.gif",
  "Partly cloudy": "partly-cloudy.gif",
  Cloudy: "clouds.gif",
  Overcast: "overcast.gif",
  Mist: "fog.gif",
  Fog: "fog.gif",
  "Patchy rain possible": "rain.gif",
  "Light rain": "rain.gif",
  "Moderate rain": "rain.gif",
  "Heavy rain": "rain.gif",
  Thunderstorm: "thunderstorm.gif",
  "Torrential rain shower": "stormy.gif",
  Snow: "snow.gif",
  "Patchy snow possible": "snow.gif",
  "Moderate or heavy snow": "snow.gif",
  Blizzard: "snow.gif",
  "Thundery outbreaks possible": "thunderstorm.gif",
  Tornado: "tornado.gif",
  Hurricane: "hurricane.gif",
  Sandstorm: "sandstorm.gif",
  Dust: "sandstorm.gif",
};

function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");
  const [backgroundSrc, setBackgroundSrc] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const autocompleteRef = useRef(null);

  const weatherApiKey = process.env.REACT_APP_WEATHERAPI_KEY;
  const googleKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

  useEffect(() => {
    if (backgroundSrc) {
      getImageBrightness(backgroundSrc, (brightness) => {
        const threshold = 130;
        setTheme(brightness > threshold ? "light" : "dark");
      });
    }
  }, [backgroundSrc]);

  const fetchWeatherData = async (query) => {
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${query}&days=7&aqi=no&alerts=no`
      );
      const data = await res.json();
      if (data?.location) {
        setLocationName(`${data.location.name}, ${data.location.region}`);
        setWeather(data.current);
        setForecast(data.forecast);
        setLastUpdated(new Date());

        const condition = data.current.condition.text;
        const gif = weatherToGif[condition] || "clear.gif";
        const gifPath = require(`./assets/${gif}`);
        const imageURL = gifPath.default || gifPath;
        setBackgroundSrc(imageURL);
      } else {
        setError("Location not found.");
        setWeather(null);
        setForecast(null);
      }
    } catch (err) {
      setError("Error fetching weather data.");
      setWeather(null);
      setForecast(null);
    }
  };

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place?.geometry?.location) {
      const location = place.formatted_address || place.name;
      setQuery("");
      fetchWeatherData(location);
    } else {
      setError("Unable to get location data.");
    }
  };

  const fetchWeatherByCoords = () => {
    setIsLocating(true); // show loading state

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const query = `${position.coords.latitude},${position.coords.longitude}`;
        fetchWeatherData(query);
        setIsLocating(false); // hide on success
      },
      () => {
        setError("Unable to access your location.");
        setIsLocating(false); // hide on failure
      }
    );
  };

  const formatTime12hr = (dateStr) => {
    const date = new Date(dateStr);
    const hour = date.getHours();
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:00 ${ampm}`;
  };

  const now = new Date();
  const upcomingHours = forecast
    ? [
        ...forecast.forecastday[0].hour,
        ...(forecast.forecastday[1]?.hour || []),
      ]
        .filter((hour) => new Date(hour.time) > now)
        .slice(0, 12)
    : [];

  return (
    <LoadScript googleMapsApiKey={googleKey} libraries={libraries}>
      <div className={`app ${theme}`}>
        {backgroundSrc && (
          <img
            src={backgroundSrc}
            className="weather-background fade-in"
            alt="Weather background"
            onError={(e) => (e.target.style.display = "none")}
          />
        )}

        <main>
          <header className="app-header">
            <img src={logo} alt="WeatherNest" className="logo" />
          </header>

          <div className="search-box">
  <Autocomplete
    onLoad={(auto) => (autocompleteRef.current = auto)}
    onPlaceChanged={handlePlaceChanged}
    options={{ types: ['geocode'], componentRestrictions: { country: 'us' } }}
  >
    <div className="search-input-wrapper">
      <input
        type="text"
        className="search-bar"
        placeholder="Enter a city, address, or zip..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="locate-btn" onClick={fetchWeatherByCoords} title="Use my location">
        <FontAwesomeIcon icon={faLocationCrosshairs} />
      </button>
    </div>
  </Autocomplete>

  {isLocating && <div className="location-status">Getting your location...</div>}
</div>

          {error && <div className="error-message">{error}</div>}

          {weather && (
            <>
              <div className="location-box">
                <div className="location">{locationName}</div>
                {lastUpdated && (
                  <div className="last-updated">
                    Last updated:{" "}
                    {lastUpdated.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>

              <div className="weather-box">
                <div className="weather">{weather.condition.text}</div>
                <div className="temp">
                  <span className="temp-value">
                    {Math.round(weather.temp_f)}
                  </span>
                  <span className="temp-unit">°F</span>
                </div>
              </div>
            </>
          )}

          {forecast && (
            <div className="forecast-container">
              <h3>Next 12 Hours</h3>
              <div className="hourly-forecast">
                {upcomingHours.map((hour, i) => (
                  <div key={i} className="forecast-hour">
                    <div>{formatTime12hr(hour.time)}</div>
                    <img
                      src={`https:${hour.condition.icon}`}
                      width="36"
                      alt=""
                    />
                    <div>{Math.round(hour.temp_f)}°</div>
                  </div>
                ))}
              </div>

              <h3>Next 5 Days</h3>
              <div className="daily-forecast">
                {forecast.forecastday
                  .filter((day) => new Date(day.date) > now)
                  .slice(0, 5)
                  .map((day, i) => (
                    <div key={i} className="forecast-day">
                      <div>
                        {new Date(day.date).toLocaleDateString(undefined, {
                          weekday: "short",
                        })}
                      </div>
                      <img
                        src={`https:${day.day.condition.icon}`}
                        width="40"
                        alt=""
                      />
                      <div>
                        {Math.round(day.day.maxtemp_f)}° /{" "}
                        {Math.round(day.day.mintemp_f)}°
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </LoadScript>
  );
}

export default App;
