import React, { useState } from 'react';
import astroService from '../../services/astroService';
import './AstroComponents.css';

const ZodiacCompatibility = () => {
  const [sign1, setSign1] = useState('');
  const [sign2, setSign2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const zodiacSigns = [
    'Овен', 'Телець', 'Близнюки', 'Рак', 'Лев', 'Діва',
    'Терези', 'Скорпіон', 'Стрілець', 'Козеріг', 'Водолій', 'Риби'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!sign1 || !sign2) {
      setError('Будь ласка, оберіть обидва знаки зодіаку');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await astroService.getCompatibility(sign1, sign2);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || 'Помилка розрахунку сумісності');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCompatibilityColor = (percentage) => {
    if (percentage >= 80) return '#10b981'; // Зелений
    if (percentage >= 60) return '#f59e0b'; // Жовтий
    if (percentage >= 40) return '#f97316'; // Помаранчевий
    return '#ef4444'; // Червоний
  };

  const getCompatibilityEmoji = (percentage) => {
    if (percentage >= 80) return '💖';
    if (percentage >= 60) return '💕';
    if (percentage >= 40) return '💛';
    return '💔';
  };

  return (
    <div className="zodiac-compatibility">
      <div className="compatibility-header">
        <h2>💕 Сумісність знаків зодіаку</h2>
        <p>Дізнайтеся, наскільки ви підходите один одному за знаками зодіаку</p>
      </div>

      <form onSubmit={handleSubmit} className="compatibility-form">
        <div className="signs-selection">
          <div className="form-group">
            <label htmlFor="sign1">Перший знак</label>
            <select
              id="sign1"
              value={sign1}
              onChange={(e) => setSign1(e.target.value)}
              required
            >
              <option value="">Оберіть знак...</option>
              {zodiacSigns.map(sign => (
                <option key={sign} value={sign}>{sign}</option>
              ))}
            </select>
          </div>

          <div className="compatibility-vs">💫</div>

          <div className="form-group">
            <label htmlFor="sign2">Другий знак</label>
            <select
              id="sign2"
              value={sign2}
              onChange={(e) => setSign2(e.target.value)}
              required
            >
              <option value="">Оберіть знак...</option>
              {zodiacSigns.map(sign => (
                <option key={sign} value={sign}>{sign}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

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
              <span className="btn-icon">💖</span>
              Перевірити сумісність
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="compatibility-result">
          <div className="result-header">
            <div className="signs-display">
              <div 
                className="zodiac-sign"
                style={{ backgroundColor: astroService.getSignColor(result.sign1) }}
              >
                {result.sign1}
              </div>
              <div className="compatibility-heart">
                {getCompatibilityEmoji(result.percentage)}
              </div>
              <div 
                className="zodiac-sign"
                style={{ backgroundColor: astroService.getSignColor(result.sign2) }}
              >
                {result.sign2}
              </div>
            </div>
          </div>

          <div className="compatibility-score">
            <div className="score-circle">
              <div 
                className="score-fill"
                style={{ 
                  background: `conic-gradient(${getCompatibilityColor(result.percentage)} ${result.percentage * 3.6}deg, #e2e8f0 0deg)`
                }}
              >
                <div className="score-inner">
                  <span className="score-percentage">{result.percentage}%</span>
                  <span className="score-label">Сумісність</span>
                </div>
              </div>
            </div>
          </div>

          <div className="compatibility-description">
            <h3>Опис сумісності</h3>
            <p>{result.description}</p>
          </div>

          <div className="compatibility-details">
            <div className="detail-card">
              <h4>🔥 Емоційна сумісність</h4>
              <div className="detail-bar">
                <div 
                  className="detail-fill"
                  style={{ 
                    width: `${Math.min(result.percentage + 10, 100)}%`,
                    backgroundColor: getCompatibilityColor(result.percentage)
                  }}
                ></div>
              </div>
            </div>

            <div className="detail-card">
              <h4>🧠 Інтелектуальна сумісність</h4>
              <div className="detail-bar">
                <div 
                  className="detail-fill"
                  style={{ 
                    width: `${Math.max(result.percentage - 5, 0)}%`,
                    backgroundColor: getCompatibilityColor(result.percentage)
                  }}
                ></div>
              </div>
            </div>

            <div className="detail-card">
              <h4>💼 Ділова сумісність</h4>
              <div className="detail-bar">
                <div 
                  className="detail-fill"
                  style={{ 
                    width: `${result.percentage}%`,
                    backgroundColor: getCompatibilityColor(result.percentage)
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button 
              onClick={() => {
                setResult(null);
                setSign1('');
                setSign2('');
              }}
              className="btn btn-secondary"
            >
              Нова перевірка
            </button>
          </div>
        </div>
      )}

      {/* Таблиця сумісності */}
      <div className="compatibility-matrix">
        <h3>📊 Таблиця сумісності знаків</h3>
        <p>Швидкий огляд сумісності між різними знаками зодіаку</p>
        
        <div className="matrix-grid">
          <div className="matrix-header">
            <div className="matrix-cell empty"></div>
            {zodiacSigns.slice(0, 6).map(sign => (
              <div key={sign} className="matrix-cell header">{sign.slice(0, 3)}</div>
            ))}
          </div>
          
          {zodiacSigns.slice(0, 6).map(rowSign => (
            <div key={rowSign} className="matrix-row">
              <div className="matrix-cell header">{rowSign.slice(0, 3)}</div>
              {zodiacSigns.slice(0, 6).map(colSign => {
                const compatibility = astroService.getCompatibility ? 
                  Math.floor(Math.random() * 10) + 1 : 5; // Заглушка
                const percentage = compatibility * 10;
                return (
                  <div 
                    key={colSign}
                    className="matrix-cell compatibility"
                    style={{ 
                      backgroundColor: getCompatibilityColor(percentage),
                      color: 'white'
                    }}
                  >
                    {compatibility}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        <div className="matrix-legend">
          <span>Шкала: 1-3 (низька), 4-6 (середня), 7-8 (висока), 9-10 (ідеальна)</span>
        </div>
      </div>
    </div>
  );
};

export default ZodiacCompatibility;