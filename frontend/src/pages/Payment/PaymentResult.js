import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PaymentStatus from '../../components/Payment/PaymentStatus';
import paymentService from '../../services/paymentService';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Отримуємо параметри з URL (LiqPay повертає їх після платежу)
    const orderIdParam = searchParams.get('order_id');
    const status = searchParams.get('status');
    
    if (orderIdParam) {
      setOrderId(parseInt(orderIdParam));
    }
    
    setLoading(false);
  }, [searchParams]);

  const handleStatusChange = (status) => {
    // Можемо додати логіку для обробки зміни статусу
    console.log('Статус платежу змінився:', status);
  };

  const handleBackToShop = () => {
    navigate('/shop');
  };

  const handleBackToOrders = () => {
    navigate('/profile/orders');
  };

  if (loading) {
    return (
      <div className="payment-result-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Завантаження результату платежу...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="payment-result-page">
        <div className="container">
          <div className="payment-error">
            <h2>Помилка</h2>
            <p>Не вдалося знайти інформацію про платіж</p>
            <button onClick={handleBackToShop} className="btn btn-primary">
              Повернутися до магазину
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <div className="container">
        <div className="payment-result-header">
          <h1>Результат платежу</h1>
          <p>Інформація про ваше замовлення та статус оплати</p>
        </div>

        <PaymentStatus 
          orderId={orderId} 
          onStatusChange={handleStatusChange}
        />

        <div className="payment-result-actions">
          <button onClick={handleBackToShop} className="btn btn-secondary">
            Продовжити покупки
          </button>
          <button onClick={handleBackToOrders} className="btn btn-primary">
            Мої замовлення
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;