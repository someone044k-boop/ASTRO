import React from 'react';
import consultationService from '../../services/consultationService';
import './ConsultationComponents.css';

const ConsultationTypes = ({ types, onSelectType, loading, error }) => {
  if (loading) {
    return (
      <div className="consultation-types loading">
        <div className="loading-spinner-large">
          <div className="spinner"></div>
          <p>Завантаження типів консультацій...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="consultation-types error">
        <div className="error-state">
          <h3>Помилка завантаження</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="consultation-types">
      <div className="types-header">
        <h2>🔮 Оберіть тип консультації</h2>
        <p>Кожна консультація проводиться індивідуально з детальним аналізом вашої натальної карти</p>
      </div>

      <div className="types-grid">
        {types.map((type) => (
          <div key={type.id} className="type-card">
            <div className="type-header">
              <div className="type-icon">
                {consultationService.getConsultationTypeIcon(type.id)}
              </div>
              <h3 className="type-name">{type.name}</h3>
              <div className="type-price">
                {consultationService.formatPrice(type.price)}
              </div>
            </div>

            <div className="type-body">
              <p className="type-description">{type.description}</p>
              
              <div className="type-duration">
                <span className="duration-icon">⏱️</span>
                <span>Тривалість: {type.duration} хвилин</span>
              </div>

              <div className="type-features">
                <h4>Що включено:</h4>
                <ul>
                  {type.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="type-footer">
              <button
                onClick={() => onSelectType(type)}
                className="btn btn-primary btn-full"
              >
                <span className="btn-icon">📅</span>
                Обрати цю консультацію
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="consultation-info">
        <div className="info-section">
          <h3>📋 Як проходить консультація</h3>
          <div className="info-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Бронювання</h4>
                <p>Оберіть зручний час та оплатіть консультацію</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Підготовка</h4>
                <p>Надішліть точні дані народження та питання</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Консультація</h4>
                <p>Онлайн зустріч з детальним розбором</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Матеріали</h4>
                <p>Отримайте запис та додаткові рекомендації</p>
              </div>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>⭐ Чому варто обрати наші консультації</h3>
          <div className="benefits-grid">
            <div className="benefit">
              <div className="benefit-icon">🎯</div>
              <h4>Персональний підхід</h4>
              <p>Кожна консультація унікальна та адаптована під ваші потреби</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">📚</div>
              <h4>Глибокі знання</h4>
              <p>Багаторічний досвід в астрології та психології</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">🔒</div>
              <h4>Конфіденційність</h4>
              <p>Повна конфіденційність та професійна етика</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">💎</div>
              <h4>Практичність</h4>
              <p>Конкретні рекомендації для вашого життя</p>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>❓ Часті питання</h3>
          <div className="faq-list">
            <div className="faq-item">
              <h4>Чи потрібно знати точний час народження?</h4>
              <p>Так, точний час народження критично важливий для якісної консультації. Якщо ви не знаєте точного часу, ми допоможемо з ректифікацією.</p>
            </div>
            <div className="faq-item">
              <h4>Як проходить онлайн консультація?</h4>
              <p>Консультація проводиться через Zoom або Google Meet. Посилання надсилається за день до зустрічі.</p>
            </div>
            <div className="faq-item">
              <h4>Чи можна перенести консультацію?</h4>
              <p>Так, ви можете перенести консультацію за 24 години до призначеного часу безкоштовно.</p>
            </div>
            <div className="faq-item">
              <h4>Чи надається запис консультації?</h4>
              <p>Так, всі консультації записуються та надсилаються вам протягом 24 годин після зустрічі.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationTypes;