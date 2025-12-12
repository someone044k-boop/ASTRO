import React, { useState, useEffect } from 'react';
import astroService from '../../services/astroService';
import './AstroComponents.css';

const SavedCharts = ({ onLoadChart }) => {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCharts();
  }, []);

  const loadCharts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await astroService.getUserCharts();
      if (response.success) {
        setCharts(response.data);
      } else {
        setError(response.message || 'Помилка завантаження карт');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadChart = async (chartId) => {
    try {
      const response = await astroService.getChartById(chartId);
      if (response.success) {
        onLoadChart(response.data);
      } else {
        setError(response.message || 'Помилка завантаження карти');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const formatLocation = (location) => {
    if (typeof location === 'string') {
      return location;
    }
    return `${location.city}, ${location.country}`;
  };

  if (loading) {
    return (
      <div className="saved-charts loading">
        <div className="loading-spinner-large">
          <div className="spinner"></div>
          <p>Завантаження збережених карт...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saved-charts error">
        <div className="error-state">
          <h3>Помилка завантаження</h3>
          <p>{error}</p>
          <button onClick={loadCharts} className="btn btn-primary">
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="saved-charts empty">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Немає збережених карт</h3>
          <p>Створіть свою першу натальну карту, щоб вона з'явилася тут</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-charts">
      <div className="charts-header">
        <h2>📋 Збережені натальні карти</h2>
        <p>Ваші раніше створені астрологічні карти</p>
      </div>

      <div className="charts-grid">
        {charts.map((chart) => (
          <div key={chart.id} className="chart-card">
            <div className="chart-card-header">
              <div className="chart-date">
                {astroService.formatDate(chart.birthDate)}
              </div>
              <div className="chart-time">
                {astroService.formatTime(chart.birthTime)}
              </div>
            </div>

            <div className="chart-card-body">
              <div className="chart-location">
                <span className="location-icon">📍</span>
                {formatLocation(chart.birthLocation)}
              </div>

              {chart.chartData && (
                <div className="chart-preview">
                  <div className="main-signs">
                    <div className="preview-sign">
                      <span className="sign-label">Сонце:</span>
                      <div 
                        className="zodiac-sign mini"
                        style={{ backgroundColor: astroService.getSignColor(chart.chartData.sunSign.name) }}
                      >
                        <span className="zodiac-symbol">{chart.chartData.sunSign.symbol}</span>
                        <span className="zodiac-name">{chart.chartData.sunSign.name}</span>
                      </div>
                    </div>

                    <div className="preview-sign">
                      <span className="sign-label">Асцендент:</span>
                      <div 
                        className="zodiac-sign mini"
                        style={{ backgroundColor: astroService.getSignColor(chart.chartData.ascendant.name) }}
                      >
                        <span className="zodiac-symbol">{chart.chartData.ascendant.symbol}</span>
                        <span className="zodiac-name">{chart.chartData.ascendant.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="planets-preview">
                    {chart.chartData.planetPositions && chart.chartData.planetPositions.slice(0, 3).map((planet, index) => (
                      <div key={index} className="planet-preview">
                        <span className="planet-symbol">{astroService.getPlanetIcon(planet.planet)}</span>
                        <span className="planet-info">{planet.planet} в {planet.sign}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="chart-card-footer">
              <div className="chart-created">
                Створено: {new Date(chart.createdAt).toLocaleDateString('uk-UA')}
              </div>
              
              <button
                onClick={() => handleLoadChart(chart.id)}
                className="btn btn-primary btn-small"
              >
                <span className="btn-icon">👁️</span>
                Переглянути
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-actions">
        <button onClick={loadCharts} className="btn btn-secondary">
          🔄 Оновити список
        </button>
      </div>
    </div>
  );
};

export default SavedCharts;