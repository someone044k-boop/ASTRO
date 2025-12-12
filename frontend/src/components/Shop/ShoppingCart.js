import React, { useState } from 'react';
import { shopService } from '../../services/shopService';
import PaymentForm from '../Payment/PaymentForm';
import './ShoppingCart.css';

const ShoppingCart = ({ cartItems, onUpdateCart, onRemoveItem, onCheckout }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      onRemoveItem(productId);
      return;
    }

    onUpdateCart(productId, newQuantity);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Кошик порожній');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      const response = await shopService.createOrder(orderData);
      
      if (response.success) {
        setCurrentOrder(response.data);
        setShowPayment(true);
      } else {
        setError(response.message || 'Помилка при створенні замовлення');
      }
    } catch (error) {
      console.error('Помилка оформлення замовлення:', error);
      setError('Помилка при оформленні замовлення');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    // Очищаємо кошик після успішної оплати
    cartItems.forEach(item => onRemoveItem(item.product_id));
    setShowPayment(false);
    setCurrentOrder(null);
    
    // Викликаємо callback для батьківського компонента
    if (onCheckout) {
      onCheckout({ order: currentOrder, payment: paymentData });
    }
    
    // Можемо показати повідомлення про успіх або перенаправити
    alert('Замовлення успішно оплачено! Дякуємо за покупку.');
  };

  const handlePaymentError = (error) => {
    setError(`Помилка оплати: ${error}`);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    // Замовлення залишається, але повертаємося до кошика
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (cartItems.length === 0) {
    return (
      <div className="shopping-cart empty">
        <div className="cart-header">
          <h3>Кошик</h3>
        </div>
        <div className="cart-empty">
          <div className="empty-icon">🛒</div>
          <p>Ваш кошик порожній</p>
          <p>Додайте товари для оформлення замовлення</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shopping-cart">
      <div className="cart-header">
        <h3>Кошик ({getTotalItems()})</h3>
      </div>

      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={item.product_id} className="cart-item">
            <div className="item-image">
              <img 
                src={item.product?.images?.[0]?.url || '/images/placeholder-product.jpg'}
                alt={item.product?.name || 'Товар'}
                onError={(e) => {
                  e.target.src = '/images/placeholder-product.jpg';
                }}
              />
            </div>
            
            <div className="item-details">
              <h4 className="item-name">{item.product?.name || 'Товар'}</h4>
              <p className="item-price">{formatPrice(item.unit_price)}</p>
              
              <div className="quantity-controls">
                <button 
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                  disabled={isProcessing}
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button 
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                  disabled={isProcessing}
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="item-total">
              <p className="total-price">
                {formatPrice(item.quantity * item.unit_price)}
              </p>
              <button 
                className="remove-btn"
                onClick={() => onRemoveItem(item.product_id)}
                disabled={isProcessing}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Товарів:</span>
          <span>{getTotalItems()}</span>
        </div>
        <div className="summary-row total">
          <span>Загалом:</span>
          <span>{formatPrice(getTotalPrice())}</span>
        </div>
      </div>

      {error && (
        <div className="cart-error">
          <p>{error}</p>
        </div>
      )}

      <div className="cart-actions">
        <button 
          className="checkout-btn"
          onClick={handleCheckout}
          disabled={isProcessing || cartItems.length === 0}
        >
          {isProcessing ? (
            <>
              <span className="loading-spinner"></span>
              Обробка...
            </>
          ) : (
            <>
              <span className="btn-icon">💳</span>
              Оформити замовлення
            </>
          )}
        </button>
      </div>

      {/* Форма оплати */}
      {showPayment && currentOrder && (
        <div className="payment-overlay">
          <div className="payment-modal">
            <PaymentForm
              order={currentOrder}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;