import React, { useState, useEffect } from 'react';
import consultationService from '../../services/consultationService';
import './ConsultationComponents.css';

const MyConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await consultationService.getMyConsultations();
      if (response.success) {
        setConsultations(response.data);
      } else {
        setError(response.message || 'Помилка завантаження консультацій');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConsultation = async (consultationId) => {
    if (!window.confirm('Ви впевнені, що хочете скасувати цю консультацію?')) {
      return;
    }

    try {
      const response = await consultationService.cancelConsultation(consultationId);
      if (response.success) {
        await loadConsultations();
        alert('Консультацію скасовано успішно');
      } else {
        alert(response.message || 'Помилка скасування консультації');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleReschedule = (consultation) => {
    setSelectedConsultation(consultation);
    setShowRescheduleForm(true);
  };

  const handleRescheduleSubmit = async (newDate) => {
    try {
      const response = await consultationService.rescheduleConsultation(
        selectedConsultation.id, 
        newDate
      );
      
      if (response.success) {
        await loadConsultations();
        setShowRescheduleForm(false);
        setSelectedConsultation(null);
        alert('Консультацію перенесено успішно');
      } else {
        alert(response.message || 'Помилка перенесення консультації');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="my-consultations loading">
        <div className="loading-spinner-large">
          <div className="spinner"></div>
          <p>Завантаження ваших консультацій...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-consultations error">
        <div className="error-state">
          <h3>Помилка завантаження</h3>
          <p>{error}</p>
          <button onClick={loadConsultations} className="btn btn-primary">
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="my-consultations empty">
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>У вас поки немає консультацій</h3>
          <p>Оберіть тип консультації та забронюйте зручний час</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-consultations">
      <div className="consultations-header">
        <h2>👤 Мої консультації</h2>
        <p>Управляйте своїми заброньованими консультаціями</p>
      </div>

      <div className="consultations-list">
        {consultations.map((consultation) => {
          const dateTime = consultationService.formatDateTime(consultation.scheduled_date);
          const canEdit = consultationService.canEditConsultation(consultation);
          const canCancel = consultationService.canCancelConsultation(consultation);

          return (
            <div key={consultation.id} className="consultation-card">
              <div className="consultation-header">
                <div className="consultation-type">
                  <span className="type-icon">
                    {consultationService.getConsultationTypeIcon(consultation.consultation_type)}
                  </span>
                  <div className="type-info">
                    <h3>{consultationService.getConsultationTypeName(consultation.consultation_type)}</h3>
                    <p>{consultation.duration_minutes} хвилин</p>
                  </div>
                </div>
                
                <div 
                  className="consultation-status"
                  style={{ 
                    backgroundColor: consultationService.getConsultationStatusColor(consultation.status),
                    color: 'white'
                  }}
                >
                  {consultationService.getConsultationStatusText(consultation.status)}
                </div>
              </div>

              <div className="consultation-body">
                <div className="consultation-details">
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span className="detail-label">Дата:</span>
                    <span className="detail-value">{dateTime.date}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-icon">⏰</span>
                    <span className="detail-label">Час:</span>
                    <span className="detail-value">{dateTime.time}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-icon">💰</span>
                    <span className="detail-label">Вартість:</span>
                    <span className="detail-value">
                      {consultationService.formatPrice(consultation.price)}
                    </span>
                  </div>

                  {consultation.meeting_link && (
                    <div className="detail-row">
                      <span className="detail-icon">🔗</span>
                      <span className="detail-label">Посилання:</span>
                      <a 
                        href={consultation.meeting_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="meeting-link"
                      >
                        Приєднатися до зустрічі
                      </a>
                    </div>
                  )}
                </div>

                {consultation.notes && (
                  <div className="consultation-notes">
                    <h4>📝 Ваші нотатки:</h4>
                    <p>{consultation.notes}</p>
                  </div>
                )}
              </div>

              <div className="consultation-footer">
                <div className="consultation-date">
                  Створено: {new Date(consultation.created_at).toLocaleDateString('uk-UA')}
                </div>
                
                <div className="consultation-actions">
                  {canEdit && (
                    <button
                      onClick={() => handleReschedule(consultation)}
                      className="btn btn-secondary btn-small"
                    >
                      📅 Перенести
                    </button>
                  )}
                  
                  {canCancel && (
                    <button
                      onClick={() => handleCancelConsultation(consultation.id)}
                      className="btn btn-danger btn-small"
                    >
                      ❌ Скасувати
                    </button>
                  )}
                  
                  {consultation.status === 'completed' && (
                    <button className="btn btn-primary btn-small">
                      📄 Матеріали
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Форма перенесення */}
      {showRescheduleForm && selectedConsultation && (
        <RescheduleForm
          consultation={selectedConsultation}
          onSubmit={handleRescheduleSubmit}
          onCancel={() => {
            setShowRescheduleForm(false);
            setSelectedConsultation(null);
          }}
        />
      )}

      <div className="consultations-actions">
        <button onClick={loadConsultations} className="btn btn-secondary">
          🔄 Оновити список
        </button>
      </div>
    </div>
  );
};

// Компонент форми перенесення
const RescheduleForm = ({ consultation, onSubmit, onCancel }) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (newDate) {
      loadAvailableSlots();
    }
  }, [newDate]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await consultationService.getAvailableSlots(newDate, consultation.consultation_type);
      
      if (response.success) {
        setAvailableSlots(response.data.available_slots);
      }
    } catch (error) {
      console.error('Помилка завантаження слотів:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newDate && newTime) {
      onSubmit(`${newDate}T${newTime}:00`);
    }
  };

  return (
    <div className="reschedule-overlay">
      <div className="reschedule-modal">
        <div className="modal-header">
          <h3>📅 Перенесення консультації</h3>
          <button onClick={onCancel} className="close-button">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="reschedule-form">
          <div className="form-group">
            <label htmlFor="newDate">Нова дата</label>
            <input
              type="date"
              id="newDate"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={consultationService.getMinBookingDate()}
              max={consultationService.getMaxBookingDate()}
              required
            />
          </div>

          {newDate && (
            <div className="form-group">
              <label>Новий час</label>
              {loading ? (
                <div className="loading-slots">Завантаження...</div>
              ) : availableSlots.length > 0 ? (
                <div className="time-slots">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      className={`time-slot ${newTime === slot ? 'selected' : ''}`}
                      onClick={() => setNewTime(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p>Немає доступних слотів на цю дату</p>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Скасувати
            </button>
            <button 
              type="submit" 
              disabled={!newDate || !newTime}
              className="btn btn-primary"
            >
              Перенести
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyConsultations;