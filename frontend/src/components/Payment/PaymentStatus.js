import React, { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService';
import './PaymentForm.css';

const PaymentStatus = ({ orderId, onStatusChange }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchPaymentStatus();
      
      // Оновлюємо статус кожні 5 секунд для pending платежів
      const interval = setInterval(() => {
        if (status?.status === 'pending' || status?.status === 'processing') {
          fetchPaymentStatus();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [orderId, status?.status]);

  const fetchPaymentStatus = async () => {
    try {
      setError(null);
      const response = await paymentService.getPaymentStatus(orderId);
      const newStatus = response.data;
      
      setStatus(newStatus);
      
      // Викликаємо callback при зміні статусу
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      processing: '🔄',
      paid: '✅',
      cancelled: '❌',
      failed: '❌',
      refunded: '↩️',
      payment_failed: '❌',
    };
    return icons[status] || '❓';
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Очікує оплати. Будь ласка, завершіть платіж.',
      processing: 'Платіж обробляється. Зачекайте, будь ласка.',
      paid: 'Платіж успішно завершено! Дякуємо за покупку.',
      cancelled: 'Платіж було скасовано.',
      failed: 'Платіж не вдався. Спробуйте ще раз.',
      refunded: 'Кошти повернено на ваш рахунок.',
      payment_failed: 'Помилка при обробці платежу. Зверніться до підтримки.',
    };
    return messages[status] || 'Невідомий статус платежу';
  };

  if (loading) {
    return (
      <div className="payment-status-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Завантаження статусу платежу...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-status-container">
        <div className="payment-error">
          <h3>Помилка завантаження</h3>
          <p>{error}</p>
          <button onClick={fetchPaymentStatus} className="btn btn-primary">
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="payment-status-container">
        <div className="payment-error">
          <h3>Статус не знайдено</h3>
          <p>Не вдалося знайти інформацію про платіж</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-status-container">
      <div className="payment-status-card">
        <div className="status-header">
          <div className="status-icon">
            {getStatusIcon(status.status)}
          </div>
          <div className="status-info">
            <h3>Замовлення #{status.order_id}</h3>
            <div className={`payment-status ${status.status}`}>
              {paymentService.getPaymentStatusText(status.status)}
            </div>
          </div>
        </div>

        <div className="status-details">
          <div className="detail-row">
            <span className="detail-label">Сума:</span>
            <span className="detail-value">
              {paymentService.formatAmount(status.total_amount)}
            </span>
          </div>
          
          {status.payment_method && (
            <div className="detail-row">
              <span className="detail-label">Метод оплати:</span>
              <span className="detail-value">
                {paymentService.getPaymentMethodIcon(status.payment_method)}{' '}
                {paymentService.getPaymentMethodName(status.payment_method)}
              </span>
            </div>
          )}
          
          {status.payment_id && (
            <div className="detail-row">
              <span className="detail-label">ID платежу:</span>
              <span className="detail-value payment-id">
                {status.payment_id}
              </span>
            </div>
          )}
        </div>

        <div className="status-message">
          <p>{getStatusMessage(status.status)}</p>
        </div>

        {(status.status === 'pending' || status.status === 'processing') && (
          <div className="status-actions">
            <button onClick={fetchPaymentStatus} className="btn btn-secondary">
              Оновити статус
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;