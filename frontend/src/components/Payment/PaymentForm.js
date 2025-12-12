import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import paymentService from '../../services/paymentService';
import './PaymentForm.css';

// Ініціалізуємо Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Компонент форми Stripe
const StripePaymentForm = ({ order, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Створюємо платіж на сервері
      const paymentResponse = await paymentService.createPayment({
        order_id: order.id,
        payment_method: 'stripe'
      });

      const { client_secret } = paymentResponse.data.payment;

      // Підтверджуємо платіж через Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (error) {
        setPaymentError(error.message);
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Підтверджуємо платіж на сервері
        await paymentService.confirmStripePayment(paymentIntent.id);
        onSuccess(paymentIntent);
      }
    } catch (error) {
      setPaymentError(error.message);
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <div className="payment-header">
        <h3>Оплата картою через Stripe</h3>
        <p>Сума до оплати: {paymentService.formatAmount(order.total_amount)}</p>
      </div>

      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {paymentError && (
        <div className="payment-error">
          {paymentError}
        </div>
      )}

      <div className="payment-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isProcessing}
        >
          Скасувати
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="btn btn-primary"
        >
          {isProcessing ? 'Обробка...' : `Оплатити ${paymentService.formatAmount(order.total_amount)}`}
        </button>
      </div>
    </form>
  );
};

// Компонент форми LiqPay
const LiqPayPaymentForm = ({ order, onSuccess, onError, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleLiqPayPayment = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Створюємо платіж через LiqPay
      const paymentResponse = await paymentService.createPayment({
        order_id: order.id,
        payment_method: 'liqpay',
        return_url: `${window.location.origin}/payment/result`
      });

      const { data, signature, checkout_url } = paymentResponse.data.payment;

      // Створюємо форму для редиректу на LiqPay
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = checkout_url;
      form.target = '_blank';

      const dataInput = document.createElement('input');
      dataInput.type = 'hidden';
      dataInput.name = 'data';
      dataInput.value = data;

      const signatureInput = document.createElement('input');
      signatureInput.type = 'hidden';
      signatureInput.name = 'signature';
      signatureInput.value = signature;

      form.appendChild(dataInput);
      form.appendChild(signatureInput);
      document.body.appendChild(form);

      form.submit();
      document.body.removeChild(form);

      // Показуємо повідомлення про редирект
      onSuccess({ message: 'Перенаправлення на LiqPay...' });

    } catch (error) {
      setPaymentError(error.message);
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="liqpay-payment-form">
      <div className="payment-header">
        <h3>Оплата через LiqPay</h3>
        <p>Сума до оплати: {paymentService.formatAmount(order.total_amount)}</p>
      </div>

      <div className="liqpay-info">
        <p>Ви будете перенаправлені на безпечну сторінку LiqPay для завершення оплати.</p>
        <p>Підтримувані методи: банківські картки, інтернет-банкінг, електронні гаманці.</p>
      </div>

      {paymentError && (
        <div className="payment-error">
          {paymentError}
        </div>
      )}

      <div className="payment-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isProcessing}
        >
          Скасувати
        </button>
        <button
          onClick={handleLiqPayPayment}
          disabled={isProcessing}
          className="btn btn-primary"
        >
          {isProcessing ? 'Обробка...' : `Оплатити через LiqPay`}
        </button>
      </div>
    </div>
  );
};

// Головний компонент вибору методу платежу
const PaymentForm = ({ order, onSuccess, onError, onCancel }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentMethods] = useState([
    { id: 'stripe', name: 'Картка (Stripe)', icon: '💳', description: 'Visa, MasterCard, American Express' },
    { id: 'liqpay', name: 'LiqPay', icon: '🏦', description: 'Банківські картки, інтернет-банкінг' }
  ]);

  if (!selectedMethod) {
    return (
      <div className="payment-method-selector">
        <div className="payment-header">
          <h3>Оберіть спосіб оплати</h3>
          <p>Замовлення #{order.id} на суму {paymentService.formatAmount(order.total_amount)}</p>
        </div>

        <div className="payment-methods">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="payment-method"
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="method-icon">{method.icon}</div>
              <div className="method-info">
                <h4>{method.name}</h4>
                <p>{method.description}</p>
              </div>
              <div className="method-arrow">→</div>
            </div>
          ))}
        </div>

        <div className="payment-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            Скасувати
          </button>
        </div>
      </div>
    );
  }

  if (selectedMethod === 'stripe') {
    return (
      <Elements stripe={stripePromise}>
        <StripePaymentForm
          order={order}
          onSuccess={onSuccess}
          onError={onError}
          onCancel={() => setSelectedMethod(null)}
        />
      </Elements>
    );
  }

  if (selectedMethod === 'liqpay') {
    return (
      <LiqPayPaymentForm
        order={order}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={() => setSelectedMethod(null)}
      />
    );
  }

  return null;
};

export default PaymentForm;