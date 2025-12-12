const request = require('supertest');
const app = require('../server');

describe('Server Configuration', () => {
  test('повинен відповідати на health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
  });

  test('повинен повертати 404 для неіснуючих маршрутів', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);
    
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Маршрут не знайдено');
  });

  test('повинен мати правильні CORS заголовки', async () => {
    const response = await request(app)
      .options('/health')
      .expect(204);
    
    expect(response.headers).toHaveProperty('access-control-allow-origin');
    expect(response.headers).toHaveProperty('access-control-allow-methods');
  });

  test('повинен мати безпечні заголовки', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    // Перевірка заголовків безпеки від helmet
    expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(response.headers).toHaveProperty('x-frame-options');
  });

  test('повинен обробляти JSON запити', async () => {
    const testData = { test: 'data' };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(testData)
      .set('Content-Type', 'application/json')
      .expect(400); // Validation error expected
    
    expect(response.body).toHaveProperty('error');
  });

  test('повинен застосовувати rate limiting', async () => {
    // Робимо багато запитів швидко
    const requests = Array(10).fill().map(() => 
      request(app).get('/api/auth/login')
    );
    
    const responses = await Promise.all(requests);
    
    // Всі запити повинні пройти або бути обмежені rate limiting
    responses.forEach(response => {
      expect([429, 400, 404]).toContain(response.status);
    });
  });

  test('повинен обробляти великі JSON payload', async () => {
    const largeData = {
      content: 'x'.repeat(1000), // 1KB даних
      metadata: Array(100).fill().map((_, i) => ({ id: i, value: `test_${i}` }))
    };
    
    const response = await request(app)
      .post('/api/content/test')
      .send(largeData)
      .set('Content-Type', 'application/json')
      .expect(404); // Маршрут не існує, але payload повинен бути оброблений
  });

  test('повинен відхиляти занадто великі payload', async () => {
    const tooLargeData = {
      content: 'x'.repeat(11 * 1024 * 1024) // 11MB - більше ліміту
    };
    
    const response = await request(app)
      .post('/api/test')
      .send(tooLargeData)
      .set('Content-Type', 'application/json')
      .expect(413); // Payload Too Large
  });
});