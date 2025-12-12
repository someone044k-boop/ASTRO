import React from 'react';
import astroService from '../../services/astroService';
import './AstroComponents.css';

const NatalChartDisplay = ({ chart, onBack }) => {
  const { chartData, birthDate, birthTime, birthLocation } = chart;

  const formatLocation = (location) => {
    if (typeof location === 'string') {
      return location;
    }
    return `${location.city}, ${location.country}`;
  };

  return (
    <div className="natal-chart-display">
      <div className="chart-header">
        <h2>🌟 Ваша натальна карта</h2>
        <div className="chart-info">
          <div className="info-card">
            <h4>Дата народження</h4>
            <div className="value">{astroService.formatDate(birthDate)}</div>
          </div>
          <div className="info-card">
            <h4>Час народження</h4>
            <div className="value">{astroService.formatTime(birthTime)}</div>
          </div>
          <div className="info-card">
            <h4>Місце народження</h4>
            <div className="value">{formatLocation(birthLocation)}</div>
          </div>
        </div>
      </div>

      <div className="chart-sections">
        {/* Основні знаки */}
        <section className="chart-section">
          <h3>🌞 Основні знаки</h3>
          <div className="signs-grid">
            <div className="sign-card sun-sign">
              <h4>Знак Сонця</h4>
              <div className="zodiac-sign" style={{ backgroundColor: astroService.getSignColor(chartData.sunSign.name) }}>
                <span className="zodiac-symbol">{chartData.sunSign.symbol}</span>
                <span>{chartData.sunSign.name}</span>
              </div>
              <p className="element">Елемент: {chartData.sunSign.element}</p>
              <p className="description">{astroService.getElementDescription(chartData.sunSign.element)}</p>
            </div>

            <div className="sign-card ascendant-sign">
              <h4>Асцендент</h4>
              <div className="zodiac-sign" style={{ backgroundColor: astroService.getSignColor(chartData.ascendant.name) }}>
                <span className="zodiac-symbol">{chartData.ascendant.symbol}</span>
                <span>{chartData.ascendant.name}</span>
              </div>
              <p className="element">Елемент: {chartData.ascendant.element}</p>
              <p className="description">Ваш зовнішній образ та перше враження</p>
            </div>
          </div>
        </section>

        {/* Планети */}
        <section className="chart-section">
          <h3>🪐 Позиції планет</h3>
          <div className="planets-grid">
            {chartData.planetPositions.map((planet, index) => (
              <div key={index} className="planet-card">
                <div className="planet-header">
                  <span className="planet-symbol">{astroService.getPlanetIcon(planet.planet)}</span>
                  <span className="planet-name">{planet.planet}</span>
                </div>
                <div className="planet-position">
                  у знаку {planet.sign} {planet.signSymbol} ({planet.degree}°)
                </div>
                <div className="planet-meaning">{planet.meaning}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Будинки */}
        <section className="chart-section">
          <h3>🏠 Астрологічні будинки</h3>
          <div className="houses-grid">
            {chartData.houses.slice(0, 6).map((house, index) => (
              <div key={index} className="house-card">
                <div className="house-number">{house.number}</div>
                <div className="house-name">{house.name}</div>
                <div className="house-sign">
                  {house.signSymbol} {house.sign}
                </div>
                <div className="house-meaning">{house.meaning}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Аспекти */}
        {chartData.aspects && chartData.aspects.length > 0 && (
          <section className="chart-section">
            <h3>⚡ Основні аспекти</h3>
            <div className="aspects-list">
              {chartData.aspects.slice(0, 8).map((aspect, index) => (
                <div key={index} className="aspect-item">
                  <span className="aspect-symbol">{aspect.symbol}</span>
                  <span className="aspect-planets">
                    {aspect.planet1} - {aspect.planet2}
                  </span>
                  <span className="aspect-name">{aspect.aspect}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Інтерпретація */}
        {chartData.interpretation && (
          <section className="chart-section">
            <h3>📖 Інтерпретація</h3>
            <div className="interpretation">
              <div className="interpretation-summary">
                <h4>Загальна характеристика</h4>
                <p>{chartData.interpretation.summary}</p>
              </div>

              {chartData.interpretation.recommendations && (
                <div className="recommendations">
                  <h4>Рекомендації</h4>
                  <ul>
                    {chartData.interpretation.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="daily-horoscope">
                <h4>Гороскоп на сьогодні</h4>
                <p>{astroService.generateDailyHoroscope(chartData.sunSign.name)}</p>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="chart-actions">
        <button onClick={onBack} className="btn btn-secondary">
          ← Назад до форми
        </button>
        <button 
          onClick={() => window.print()} 
          className="btn btn-primary"
        >
          🖨️ Роздрукувати
        </button>
      </div>
    </div>
  );
};

export default NatalChartDisplay;