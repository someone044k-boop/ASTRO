import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ConsultationTypes from '../../components/Consultations/ConsultationTypes';
import BookingForm from '../../components/Consultations/BookingForm';
import MyConsultations from '../../components/Consultations/MyConsultations';
import consultationService from '../../services/consultationService';
import './ConsultationsPage.css';

const ConsultationsPage = () => {
  const [activeTab, setActiveTab] = useState('types');
  const [selectedType, setSelectedType] = useState(null);
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    loadConsultationTypes();
  }, []);

  const loadConsultationTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await consultationService.getConsultationTypes();
      if (response.success) {
        setConsultationTypes(response.data);
      } else {
        setError(response.message || 'Помилка завантаження типів консультацій');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (type) => {
    if (!isAuthenticated) {
      alert('Для бронювання консультації потрібно увійти в систему');
      return;
    }
    
    setSelectedType(type);
    setActiveTab('booking');
  };

  const handleBookingComplete = () => {
    setActiveTab('my-consultations');
    setSelectedType(null);
  };

  const handleBackToTypes = () => {
    setActiveTab('types');
    setSelectedType(null);
  };

  const tabs = [
    { id: 'types', name: 'Типи консультацій', icon: '📋' },
    ...(isAuthenticated ? [
      { id: 'booking', name: 'Бронювання', icon: '📅', disabled: !selectedType },
      { id: 'my-consultations', name: 'Мої консультації', icon: '👤' }
    ] : [])
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'types':
        return (
          <ConsultationTypes
            types={consultationTypes}
            onSelectType={handleSelectType}
            loading={loading}
            error={error}
          />
        );
      
      case 'booking':
        return selectedType ? (
          <BookingForm
            consultationType={selectedType}
            onComplete={handleBookingComplete}
            onBack={handleBackToTypes}
          />
        ) : (
          <div className="no-selection">
            <p>Оберіть тип консультації для бронювання</p>
            <button onClick={() => setActiveTab('types')} className="btn btn-primary">
              Обрати тип консультації
            </button>
          </div>
        );
      
      case 'my-consultations':
        return <MyConsultations />;
      
      default:
        return null;
    }
  };

  return (
    <div className="consultations-page">
      <div className="container">
        <div className="consultations-header">
          <h1>🔮 Астрологічні консультації</h1>
          <p>Отримайте персональні поради та глибокий аналіз вашої натальної карти</p>
        </div>

        <div className="consultations-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="consultations-content">
          {renderTabContent()}
        </div>

        {!isAuthenticated && (
          <div className="auth-notice">
            <div className="notice-content">
              <h3>💡 Хочете записатися на консультацію?</h3>
              <p>
                Увійдіть в систему або зареєструйтеся, щоб мати можливість 
                бронювати консультації та відстежувати їх статус.
              </p>
              <div className="notice-actions">
                <button className="btn btn-primary">Увійти</button>
                <button className="btn btn-secondary">Реєстрація</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationsPage;