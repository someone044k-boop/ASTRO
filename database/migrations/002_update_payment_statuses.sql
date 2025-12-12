-- Міграція для розширення статусів платежів
-- Додаємо нові статуси для платежів

BEGIN;

-- Оновлюємо CHECK constraint для статусів замовлень
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'payment_failed', 'refunded'));

-- Додаємо індекс для payment_id
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- Додаємо таблицю для зберігання деталей платежів (опціонально)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_provider VARCHAR(50) NOT NULL CHECK (payment_provider IN ('stripe', 'liqpay')),
  transaction_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UAH',
  status VARCHAR(50) NOT NULL,
  provider_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Індекси для транзакцій
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Тригер для автоматичного оновлення updated_at
CREATE TRIGGER update_payment_transactions_updated_at 
  BEFORE UPDATE ON payment_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;