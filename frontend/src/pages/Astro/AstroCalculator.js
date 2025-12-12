import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import NatalChartForm from '../../components/Astro/NatalChartForm';
import NatalChartDisplay from '../../components/Astro/NatalChartDisplay';
import ZodiacCompatibility from '../../components/Astro/ZodiacCompatibility';
import QuickZodiacLookup from '../../components/Astro/QuickZodiacLookup';
import SavedCharts from '../../components/Astro/SavedCharts';
import astroService from '../../services/astroService';
import './AstroCalculator.css';

const AstroCalculator = () => {
  const [activeTab, setActiveTab] = useState('natal-chart');
  const [currentChart, setCurrentChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { isAuthenticated } = useSelector(state => state.auth);

  const tabs = [
    { id: 'natal-chart', name: 'Натальна карта', icon: '🌟' },
    { id: 'compatibility', name: 'Сумісність', icon: '💕' },
    { id: 'zodiac-lookup', name: 'Знак зодіаку', icon: '♈' },
    ...(isAuthenticated ? [{ id: 'saved-charts', name: 'Збережені карти', icon: '📋' }] : [])
  ];

  const handleCreateChart = async (chartData) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (isAuthenticated) {
        response = await astroService.createNatalChart(chartData);
      } else {
        response = await astroService.createGuestNatalChart(chartData);
      }

      if (response.success) {
        setCurrentChart(response.data);
        setActiveTab('chart-display');
      } else {
        setError(response.message || 'Помилка створення натальної карти');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadChart = (chart) => {
    setCurrentChart(chart);
    setActiveTab('chart-display');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'natal-chart':
        return (
          <NatalChartForm
            onSubmit={handleCreateChart}
            loading={loading}
            error={error}
          />
        );
      
      case 'chart-display':
        return currentChart ? (
          <NatalChartDisplay
            chart={currentChart}
            onBack={() => setActiveTab('natal-chart')}
          />
        ) : (
          <div className="no-chart">
            <p>Немає даних для відображення</p>
            <button 
              onClick={() => setActiveTab('natal-chart')}
              className="btn btn-primary"
            >
              Створити натальну карту
            </button>
          </div>
        );
      
      case 'compatibility':
        return <ZodiacCompatibility />;
      
      case 'zodiac-lookup':
        return <QuickZodiacLookup />;
      
      case 'saved-charts':
        return (
          <SavedCharts
            onLoadChart={handleLoadChart}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="astro-calculator">
      <div className="container">
        <div className="astro-header">
          <h1>🌟 Астрологічний калькулятор</h1>
          <p>Дізнайтеся більше про себе через призму зірок</p>
        </div>

        <div className="astro-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="astro-content">
          {renderTabContent()}
        </div>

        {!isAuthenticated && (
          <div className="guest-notice">
            <p>
              💡 <strong>Підказка:</strong> Зареєструйтеся, щоб зберігати свої натальні карти 
              та отримувати персональні рекомендації!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AstroCalculator;