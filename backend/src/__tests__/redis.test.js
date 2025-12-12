// Redis Cache Tests - Using mocked Redis
const redis = require('../cache/redis');

describe('Redis Cache Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('повинен успішно підключитися до Redis', async () => {
    // Перевіряємо, що connect функція існує і може бути викликана
    expect(redis.connect).toBeDefined();
    const result = await redis.connect();
    expect(result).toBe(true);
  });

  test('повинен встановлювати значення', async () => {
    const key = 'test_key';
    const value = 'test_value';
    
    const result = await redis.set(key, value);
    expect(redis.set).toHaveBeenCalledWith(key, value);
    expect(result).toBe('OK');
  });

  test('повинен отримувати значення', async () => {
    const key = 'test_key';
    
    const result = await redis.get(key);
    expect(redis.get).toHaveBeenCalledWith(key);
    expect(result).toBeNull(); // Мок повертає null за замовчуванням
  });

  test('повинен видаляти значення', async () => {
    const key = 'test_key';
    
    const result = await redis.del(key);
    expect(redis.del).toHaveBeenCalledWith(key);
    expect(result).toBe(1);
  });

  test('повинен відключатися від Redis', async () => {
    const result = await redis.disconnect();
    expect(redis.disconnect).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('повинен мати властивість isOpen', () => {
    expect(redis.isOpen).toBeDefined();
    expect(redis.isOpen).toBe(false);
  });
});