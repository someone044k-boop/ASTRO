# API Платежів

## Огляд

API платежів забезпечує інтеграцію з платіжними системами Stripe та LiqPay для обробки онлайн-платежів за замовлення в магазині.

## Підтримувані платіжні системи

- **Stripe**: Міжнародні картки, Apple Pay, Google Pay
- **LiqPay**: Українські картки, інтернет-банкінг, електронні гаманці

## Ендпоінти

### POST /api/payments/create

Створення нового платежу для замовлення.

**Параметри запиту:**
```json
{
  "order_id": 123,
  "payment_method": "stripe", // або "liqpay"
  "return_url": "https://example.com/payment/result" // опціонально для LiqPay
}
```

**Відповідь для Stripe:**
```json
{
  "success": true,
  "message": "Платіж створено успішно",
  "data": {
    "payment": {
      "id": "pi_1234567890",
      "client_secret": "pi_1234567890_secret_abc123",
      "amount": 1000.00,
      "currency": "uah",
      "status": "requires_payment_method"
    },
    "order": {
      "id": 123,
      "status": "processing",
      "total_amount": 1000.00
    }
  }
}
```

**Відповідь для LiqPay:**
```json
{
  "success": true,
  "message": "Платіж створено успішно",
  "data": {
    "payment": {
      "data": "eyJhbW91bnQiOjEwMDAuMDB9...",
      "signature": "abc123def456...",
      "checkout_url": "https://www.liqpay.ua/api/3/checkout",
      "order_id": "123"
    },
    "order": {
      "id": 123,
      "status": "processing",
      "total_amount": 1000.00
    }
  }
}
```

### POST /api/payments/confirm/:payment_id

Підтвердження платежу Stripe (викликається після успішної оплати на клієнті).

**Відповідь:**
```json
{
  "success": true,
  "message": "Статус платежу оновлено",
  "data": {
    "payment": {
      "id": "pi_1234567890",
      "status": "succeeded",
      "amount": 1000.00,
      "currency": "uah"
    },
    "order": {
      "id": 123,
      "status": "paid",
      "total_amount": 1000.00
    }
  }
}
```

### GET /api/payments/status/:order_id

Отримання поточного статусу платежу для замовлення.

**Відповідь:**
```json
{
  "success": true,
  "data": {
    "order_id": 123,
    "payment_id": "pi_1234567890",
    "status": "paid",
    "total_amount": 1000.00,
    "payment_method": "stripe"
  }
}
```

### POST /api/payments/webhook/stripe

Webhook для обробки подій від Stripe (автоматичні виклики від Stripe).

### POST /api/payments/webhook/liqpay

Webhook для обробки callback'ів від LiqPay.

**Параметри:**
```json
{
  "data": "eyJzdGF0dXMiOiJzdWNjZXNzIn0=",
  "signature": "abc123def456..."
}
```

### POST /api/payments/refund/:order_id

Створення повернення коштів (тільки для адміністраторів).

**Параметри:**
```json
{
  "amount": 500.00 // опціонально, якщо не вказано - повертається вся сума
}
```

## Статуси платежів

- `pending` - Очікує оплати
- `processing` - Обробляється
- `paid` - Оплачено
- `cancelled` - Скасовано
- `payment_failed` - Платіж не вдався
- `refunded` - Повернено

## Налаштування

### Змінні середовища

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LiqPay
LIQPAY_PUBLIC_KEY=sandbox_i12345678901
LIQPAY_PRIVATE_KEY=sandbox_abc123def456

# Базовий URL
BASE_URL=https://your-domain.com
```

### Frontend налаштування

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Безпека

1. **Webhook підписи**: Всі webhook'и перевіряються на автентичність
2. **HTTPS**: Обов'язкове використання HTTPS в продакшені
3. **Валідація**: Всі дані валідуються перед обробкою
4. **Авторизація**: Доступ до платежів тільки для власників замовлень

## Тестування

### Тестові картки Stripe

- Успішна оплата: `4242424242424242`
- Відхилена картка: `4000000000000002`
- Потребує 3D Secure: `4000002500003155`

### Тестові дані LiqPay

Використовуйте sandbox режим з тестовими даними згідно документації LiqPay.

## Помилки

### Коди помилок

- `400` - Невірні параметри запиту
- `401` - Не авторизований
- `403` - Доступ заборонено
- `404` - Замовлення не знайдено
- `500` - Внутрішня помилка сервера

### Приклади помилок

```json
{
  "success": false,
  "message": "Помилки валідації",
  "errors": [
    {
      "field": "order_id",
      "message": "ID замовлення повинен бути позитивним числом"
    }
  ]
}
```

## Інтеграція з frontend

### Stripe Elements

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_...');

// Використання в компоненті
const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
  payment_method: {
    card: elements.getElement(CardElement),
  }
});
```

### LiqPay форма

```javascript
// Створення форми для редиректу
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
```