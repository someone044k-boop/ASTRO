const request = require('supertest');
const app = require('../../server');
const { query } = require('../../database/connection');
const jwt = require('jsonwebtoken');

// Mock моделей
jest.mock('../../models/Product');
jest.mock('../../models/Order');
jest.mock('../../models/OrderItem');

// Mock the User model for authentication
jest.mock('../../models/User', () => ({
  findById: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'user@test.com',
    role: 'user'
  })
}));

const Product = require('../../models/Product');
const Order = require('../../models/Order');

// Generate test token
const testToken = jwt.sign(
  { userId: 'test-user-id', email: 'user@test.com' },
  'test-secret-key-for-testing',
  { expiresIn: '1h' }
);

describe('Shop Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/shop/products', () => {
    test('should return list of products', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Тестовий Амулет',
          description: 'Опис',
          price: 1000,
          category: 'амулети',
          status: 'active',
          inventory_count: 10,
          toPublicJSON: function() {
            return {
              id: this.id,
              name: this.name,
              description: this.description,
              price: this.price,
              category: this.category,
              status: this.status,
              inventory_count: this.inventory_count
            };
          }
        }
      ];

      Product.findAll.mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/api/shop/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Тестовий Амулет');
      expect(Product.findAll).toHaveBeenCalledWith({
        category: undefined,
        status: 'active',
        limit: 20,
        offset: 0
      });
    });

    test('should filter products by category', async () => {
      Product.findAll.mockResolvedValue([]);

      await request(app)
        .get('/api/shop/products')
        .query({ category: 'амулети', limit: 10 })
        .expect(200);

      expect(Product.findAll).toHaveBeenCalledWith({
        category: 'амулети',
        status: 'active',
        limit: 10,
        offset: 0
      });
    });
  });

  describe('GET /api/shop/products/:id', () => {
    test('should return product by ID', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Тестовий Амулет',
        toPublicJSON: function() {
          return { id: this.id, name: this.name };
        }
      };

      Product.findById.mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/api/shop/products/550e8400-e29b-41d4-a716-446655440000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Тестовий Амулет');
      expect(Product.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
    });

    test('should return 404 if product not found', async () => {
      Product.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/shop/products/550e8400-e29b-41d4-a716-446655440001')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Товар не знайдено');
    });

    test('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/shop/products/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/shop/categories', () => {
    test('should return list of categories', async () => {
      const mockCategories = ['амулети', 'кристали', 'свічки'];
      Product.getCategories.mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/shop/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCategories);
      expect(Product.getCategories).toHaveBeenCalled();
    });
  });

  describe('POST /api/shop/orders', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'student'
    };

    const mockAuthMiddleware = (req, res, next) => {
      req.user = mockUser;
      next();
    };

    beforeEach(() => {
      // Mock аутентифікації
      jest.doMock('../../middleware/auth', () => ({
        authenticateToken: mockAuthMiddleware,
        requireRole: () => mockAuthMiddleware
      }));
    });

    test.skip('should create order successfully', async () => {
      const orderData = {
        items: [
          {
            product_id: 'product-1',
            quantity: 2
          }
        ],
        payment_method: 'card'
      };

      const mockProduct = {
        id: 'product-1',
        name: 'Тестовий Товар',
        price: 500,
        inventory_count: 10,
        isAvailable: jest.fn().mockReturnValue(true),
        decreaseInventory: jest.fn().mockResolvedValue(8)
      };

      const mockOrder = {
        id: 'order-1',
        user_id: 'user-1',
        total_amount: 1000,
        status: 'pending',
        getDetailedOrder: jest.fn().mockResolvedValue({
          id: 'order-1',
          total_amount: 1000,
          items: []
        })
      };

      Product.findById.mockResolvedValue(mockProduct);
      Order.create.mockResolvedValue(mockOrder);

      // Mock OrderItem.create
      const OrderItem = require('../../models/OrderItem');
      OrderItem.create = jest.fn().mockResolvedValue({
        id: 'item-1',
        order_id: 'order-1',
        product_id: 'product-1',
        quantity: 2,
        unit_price: 500
      });

      const response = await request(app)
        .post('/api/shop/orders')
        .set('Authorization', `Bearer ${testToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('order-1');
      expect(Order.create).toHaveBeenCalledWith({
        user_id: 'user-1',
        total_amount: 1000,
        payment_method: 'card'
      });
    });

    test.skip('should return 400 for invalid order data', async () => {
      const invalidOrderData = {
        items: [] // Порожній масив товарів
      };

      const response = await request(app)
        .post('/api/shop/orders')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test.skip('should return 404 if product not found', async () => {
      const orderData = {
        items: [
          {
            product_id: 'non-existent-product',
            quantity: 1
          }
        ]
      };

      Product.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/shop/orders')
        .set('Authorization', `Bearer ${testToken}`)
        .send(orderData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('не знайдено');
    });

    test.skip('should return 400 if product not available', async () => {
      const orderData = {
        items: [
          {
            product_id: 'product-1',
            quantity: 10
          }
        ]
      };

      const mockProduct = {
        id: 'product-1',
        name: 'Тестовий Товар',
        price: 500,
        inventory_count: 5,
        isAvailable: jest.fn().mockReturnValue(false)
      };

      Product.findById.mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/api/shop/orders')
        .set('Authorization', `Bearer ${testToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('недоступний');
    });
  });

  describe('Error handling', () => {
    test('should handle database errors gracefully', async () => {
      Product.findAll.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/shop/products')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Помилка сервера');
    });
  });
});