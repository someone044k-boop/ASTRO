const { errorHandler, asyncHandler } = require('../middleware/errorHandler');

describe('Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('Error Handler', () => {
    test('повинен обробляти загальні помилки', () => {
      const error = new Error('Тестова помилка');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Тестова помилка',
          statusCode: 500,
          timestamp: expect.any(String)
        })
      );
    });

    test('повинен обробляти помилки з кастомним статус кодом', () => {
      const error = new Error('Не знайдено');
      error.statusCode = 404;
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Не знайдено',
          statusCode: 404
        })
      );
    });

    test('повинен обробляти помилки валідації', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Помилка валідації даних',
          statusCode: 400
        })
      );
    });

    test('повинен обробляти JWT помилки', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Недійсний токен',
          statusCode: 401
        })
      );
    });

    test('повинен обробляти PostgreSQL помилки унікальності', () => {
      const error = new Error('Duplicate key');
      error.code = '23505';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Дані вже існують',
          statusCode: 409
        })
      );
    });
  });

  describe('Async Handler', () => {
    test('повинен обробляти успішні асинхронні функції', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(req, res, next);
      
      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test('повинен передавати помилки в next', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(req, res, next);
      
      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    test('повинен обробляти синхронні функції', async () => {
      const syncFn = jest.fn().mockReturnValue('sync result');
      const wrappedFn = asyncHandler(syncFn);
      
      await wrappedFn(req, res, next);
      
      expect(syncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});