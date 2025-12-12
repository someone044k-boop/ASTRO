import React, { useState } from 'react';
import astroService from '../../services/astroService';
import './AstroComponents.css';

const QuickZodiacLookup = () => {
  const [birthDate, setBirthDate] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!birthDate) {
      setError('Будь ласка, введіть дату народження');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await astroService.getZodiacSign(birthDate);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || 'Помилка визначення знаку зодіаку');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="quick-zodiac-lookup">
      <div className="lookup-header">
        <h2>♈ Швидке визначення знаку зодіаку</h2>
        <p>Введіть дату народження, щоб дізнатися свій знак зодіаку</p>
      </div>

      <form onSubmit={handleSubmit} className="lookup-form">
        <div className="form-group">
          <label htmlFor="quickBirthDate">Дата народження</label>
          <input
            type="date"
            id="quickBirthDate"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={getCurrentDate()}
            required
          />
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
              Визначення...
            </>
          ) : (
            <>
              <span className="btn-icon">🔍</span>
              Визначити знак
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="zodiac-result">
          <div className="result-card">
            <div className="zodiac-display">
              <div 
                className="zodiac-sign large"
                style={{ backgroundColor: astroService.getSignColor(result.sign.name) }}
              >
                <span className="zodiac-symbol large">{result.sign.symbol}</span>
                <span className="zodiac-name">{result.sign.name}</span>
              </div>
            </div>

            <div className="zodiac-info">
              <div className="info-row">
                <span className="label">Елемент:</span>
                <span className="value">{result.sign.element}</span>
              </div>
              <div className="info-row">
                <span className="label">Період:</span>
                <span className="value">
                  {result.sign.dates.start[1]}.{result.sign.dates.start[0]} - {result.sign.dates.end[1]}.{result.sign.dates.end[0]}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Дата народження:</span>
                <span className="value">{astroService.formatDate(result.birthDate)}</span>
              </div>
            </div>

            <div className="element-description">
              <h4>Характеристика елементу {result.sign.element}</h4>
              <p>{astroService.getElementDescription(result.sign.element)}</p>
            </div>

            <div className="daily-horoscope">
              <h4>Гороскоп на сьогодні</h4>
              <p>{astroService.generateDailyHoroscope(result.sign.name)}</p>
            </div>

            <div className="result-actions">
              <button 
                onClick={() => setResult(null)}
                className="btn btn-secondary"
              >
                Нове визначення
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Інформація про всі знаки */}
      <div className="all-signs-info">
        <h3>📚 Всі знаки зодіаку</h3>
        <div className="signs-overview">
          <div className="signs-grid-overview">
            {[
              { name: 'Овен', symbol: '♈', element: 'Вогонь', period: '21.03 - 19.04' },
              { name: 'Телець', symbol: '♉', element: 'Земля', period: '20.04 - 20.05' },
              { name: 'Близнюки', symbol: '♊', element: 'Повітря', period: '21.05 - 20.06' },
              { name: 'Рак', symbol: '♋', element: 'Вода', period: '21.06 - 22.07' },
              { name: 'Лев', symbol: '♌', element: 'Вогонь', period: '23.07 - 22.08' },
              { name: 'Діва', symbol: '♍', element: 'Земля', period: '23.08 - 22.09' },
              { name: 'Терези', symbol: '♎', element: 'Повітря', period: '23.09 - 22.10' },
              { name: 'Скорпіон', symbol: '♏', element: 'Вода', period: '23.10 - 21.11' },
              { name: 'Стрілець', symbol: '♐', element: 'Вогонь', period: '22.11 - 21.12' },
              { name: 'Козеріг', symbol: '♑', element: 'Земля', period: '22.12 - 19.01' },
              { name: 'Водолій', symbol: '♒', element: 'Повітря', period: '20.01 - 18.02' },
              { name: 'Риби', symbol: '♓', element: 'Вода', period: '19.02 - 20.03' }
            ].map((sign, index) => (
              <div 
                key={index} 
                className="sign-overview-card"
                style={{ borderColor: astroService.getSignColor(sign.name) }}
              >
                <div className="sign-symbol-small">{sign.symbol}</div>
                <div className="sign-name-small">{sign.name}</div>
                <div className="sign-element-small">{sign.element}</div>
                <div className="sign-period-small">{sign.period}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickZodiacLookup;