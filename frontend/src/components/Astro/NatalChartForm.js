import React, { useState } from 'react';
import astroService from '../../services/astroService';
import './AstroComponents.css';

const NatalChartForm = ({ onSubmit, loading, error }) => {
  const [formData, setFormData] = useState({
    birthDate: '',
    birthTime: '',
    birthLocation: {
      city: '',
      country: '',
      latitude: '',
      longitude: ''
    }
  });
  
  const [validationErrors, setValidationErrors] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Очищаємо помилки при зміні
    setValidationErrors([]);
  };

  const handleLocationSearch = async (city) => {
    if (city.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    // Тут би була інтеграція з геокодинг API (Google Maps, OpenStreetMap)
    // Для демонстрації використовуємо заглушку
    const mockSuggestions = [
      { city: 'Київ', country: 'Україна', latitude: 50.4501, longitude: 30.5234 },
      { city: 'Львів', country: 'Україна', latitude: 49.8397, longitude: 24.0297 },
      { city: 'Одеса', country: 'Україна', latitude: 46.4825, longitude: 30.7233 },
      { city: 'Харків', country: 'Україна', latitude: 49.9935, longitude: 36.2304 },
      { city: 'Дніпро', country: 'Україна', latitude: 48.4647, longitude: 35.0462 }
    ].filter(location => 
      location.city.toLowerCase().includes(city.toLowerCase())
    );

    setLocationSuggestions(mockSuggestions);
  };

  const selectLocation = (location) => {
    setFormData(prev => ({
      ...prev,
      birthLocation: {
        city: location.city,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude
      }
    }));
    setLocationSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Валідація
    const errors = astroService.validateChartData(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Конвертуємо координати в числа
    const chartData = {
      ...formData,
      birthLocation: {
        ...formData.birthLocation,
        latitude: parseFloat(formData.birthLocation.latitude),
        longitude: parseFloat(formData.birthLocation.longitude)
      }
    };

    onSubmit(chartData);
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  return (
    <div className="natal-chart-form">
      <div className="form-header">
        <h2>🌟 Створення натальної карти</h2>
        <p>Введіть точні дані народження для розрахунку вашої натальної карти</p>
      </div>

      <form onSubmit={handleSubmit} className="chart-form">
        <div className="form-section">
          <h3>📅 Дата та час народження</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="birthDate">Дата народження</label>
              <input
                type="date"
                id="birthDate"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                max={getCurrentDate()}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="birthTime">Час народження</label>
              <input
                type="time"
                id="birthTime"
                value={formData.birthTime}
                onChange={(e) => handleInputChange('birthTime', e.target.value)}
                required
              />
              <small>Точний час важливий для розрахунку асценденту</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>📍 Місце народження</h3>
          
          <div className="form-row">
            <div className="form-group location-search">
              <label htmlFor="city">Місто</label>
              <input
                type="text"
                id="city"
                value={formData.birthLocation.city}
                onChange={(e) => {
                  handleInputChange('birthLocation.city', e.target.value);
                  handleLocationSearch(e.target.value);
                }}
                placeholder="Почніть вводити назву міста..."
                required
              />
              
              {locationSuggestions.length > 0 && (
                <div className="location-suggestions">
                  {locationSuggestions.map((location, index) => (
                    <div
                      key={index}
                      className="location-suggestion"
                      onClick={() => selectLocation(location)}
                    >
                      <strong>{location.city}</strong>, {location.country}
                      <small>{location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="country">Країна</label>
              <input
                type="text"
                id="country"
                value={formData.birthLocation.country}
                onChange={(e) => handleInputChange('birthLocation.country', e.target.value)}
                placeholder="Україна"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">Широта</label>
              <input
                type="number"
                id="latitude"
                value={formData.birthLocation.latitude}
                onChange={(e) => handleInputChange('birthLocation.latitude', e.target.value)}
                step="0.0001"
                min="-90"
                max="90"
                placeholder="50.4501"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="longitude">Довгота</label>
              <input
                type="number"
                id="longitude"
                value={formData.birthLocation.longitude}
                onChange={(e) => handleInputChange('birthLocation.longitude', e.target.value)}
                step="0.0001"
                min="-180"
                max="180"
                placeholder="30.5234"
                required
              />
            </div>
          </div>
          
          <div className="coordinates-help">
            <small>
              💡 Координати заповнюються автоматично при виборі міста. 
              Для точності можете уточнити їх на картах Google.
            </small>
          </div>
        </div>

        {(validationErrors.length > 0 || error) && (
          <div className="form-errors">
            {validationErrors.map((err, index) => (
              <div key={index} className="error-message">{err}</div>
            ))}
            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                birthDate: getCurrentDate(),
                birthTime: getCurrentTime()
              }));
            }}
            className="btn btn-secondary"
          >
            Поточний час
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Розрахунок...
              </>
            ) : (
              <>
                <span className="btn-icon">✨</span>
                Створити натальну карту
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NatalChartForm;