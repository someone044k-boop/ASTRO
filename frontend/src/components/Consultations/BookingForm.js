import React, { useState, useEffect } from 'react';
import consultationService from '../../services/consultationService';
import PaymentForm from '../Payment/PaymentForm';
import './ConsultationComponents.css';

const BookingForm = ({ consultationType, onComplete, onBack }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: ''
  });
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [currentConsultation, setCurrentConsultation] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (formData.date) {
      loadAvailableSlots();
    }
  }, [formData.date]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await consultationService.getAvailableSlots(formData.date, consultationType.id);
      
      if (response.success) {
        setAvailableSlots(response.data.available_slots);
      } else {
        setError(response.message || 'Помилка завантаження доступних слотів');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Очищаємо помилки при зміні
    setValidationErrors([]);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валідація
    const consultationData = {
      consultation_type: consultationType.id,
      scheduled_date: `${formData.date}T${formData.time}:00`,
      notes: formData.notes
    };
    
    const errors = consultationService.validateConsultationData(consultationData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await consultationService.createConsultation(consultationData);
      
      if (response.success) {
        setCurrentConsultation(response.data);
        setShowPayment(true);
      } else {
        setError(response.message || 'Помилка створення консультації');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    onComplete();
  };

  const handlePaymentError = (error) => {
    setError(`Помилка оплати: ${error}`);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  if (showPayment && currentConsultation) {
    return (
      <div className="booking-payment">
        <div className="payment-header">
          <h3>💳 Оплата консультації</h3>
          <div className="consultation-summary">
            <div className="summary-item">
              <span className="label">Тип:</span>
              <span className="value">{consultationType.name}</span>
            </div>
            <div className="summary-item">
              <span className="label">Дата:</span>
              <span className="value">
                {consultationService.formatDateTime(currentConsultation.scheduled_date).full}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Тривалість:</span>
              <span className="value">{consultationType.duration} хвилин</span>
            </div>
            <div className="summary-item total">
              <span className="label">До оплати:</span>
              <span className="value">{consultationService.formatPrice(consultationType.price)}</span>
            </div>
          </div>
        </div>

        <PaymentForm
          order={currentConsultation}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  return (
    <div className="booking-form">
      <div className="booking-header">
        <button onClick={onBack} className="back-button">
          ← Назад до типів
        </button>
        <h2>📅 Бронювання консультації</h2>
        <div className="selected-type">
          <div className="type-info">
            <span className="type-icon">{consultationService.getConsultationTypeIcon(consultationType.id)}</span>
            <div className="type-details">
              <h3>{consultationType.name}</h3>
              <p>{consultationType.duration} хвилин • {consultationService.formatPrice(consultationType.price)}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="consultation-form">
        <div className="form-section">
          <h3>📅 Оберіть дату та час</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Дата консультації</label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={consultationService.getMinBookingDate()}
                max={consultationService.getMaxBookingDate()}
                required
              />
              <small>Консультації доступні з понеділка по п'ятницю</small>
            </div>
          </div>

          {formData.date && (
            <div className="form-group">
              <label>Доступний час</label>
              {loading ? (
                <div className="loading-slots">
                  <div className="spinner-small"></div>
                  <span>Завантаження доступних слотів...</span>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="time-slots">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      className={`time-slot ${formData.time === slot ? 'selected' : ''}`}
                      onClick={() => handleInputChange('time', slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="no-slots">
                  <p>На обрану дату немає доступних слотів. Оберіть іншу дату.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>📝 Додаткова інформація</h3>
          
          <div className="form-group">
            <label htmlFor="notes">Ваші питання або побажання (необов'язково)</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Опишіть, що вас цікавить найбільше, або поставте конкретні питання..."
              rows="4"
              maxLength="1000"
            />
            <small>{formData.notes.length}/1000 символів</small>
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

        <div className="booking-summary">
          <h3>📋 Підсумок бронювання</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Тип консультації:</span>
              <span>{consultationType.name}</span>
            </div>
            <div className="summary-row">
              <span>Тривалість:</span>
              <span>{consultationType.duration} хвилин</span>
            </div>
            {formData.date && (
              <div className="summary-row">
                <span>Дата:</span>
                <span>{new Date(formData.date).toLocaleDateString('uk-UA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            )}
            {formData.time && (
              <div className="summary-row">
                <span>Час:</span>
                <span>{formData.time}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Вартість:</span>
              <span>{consultationService.formatPrice(consultationType.price)}</span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onBack}
            className="btn btn-secondary"
          >
            Назад
          </button>
          
          <button
            type="submit"
            disabled={loading || !formData.date || !formData.time}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Створення...
              </>
            ) : (
              <>
                <span className="btn-icon">💳</span>
                Перейти до оплати
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;