const Product = require('../../models/Product');
const { query } = require('../../database/connection');

// Mock the database query function
jest.mock('../../database/connection');

describe('Product Model - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product.create', () => {
    test('should create a new product successfully', async () => {
      const productData = {
        name: 'Тестовий Амулет',
        description: 'Опис тестового амулету',
        price: 1000,
        category: 'амулети',
        images: [{ url: '/test-image.jpg', alt: 'Тест' }],
        inventory_count: 10
      };

      const mockResult = {
        rows: [{
          id: 'test-id-123',
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          images: productData.images,
          inventory_count: productData.inventory_count,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      query.mockResolvedValue(mockResult);

      const product = await Product.create(productData);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        expect.arrayContaining([
          productData.name,
          productData.description,
          productData.price,
          productData.category,
          JSON.stringify(productData.images),
          productData.inventory_count
        ])
      );

      expect(product).toBeInstanceOf(Product);
      expect(product.name).toBe(productData.name);
      expect(product.category).toBe(productData.category);
    });
  });

  describe('Product.findById', () => {
    test('should find product by ID successfully', async () => {
      const productId = 'test-id-123';
      const mockResult = {
        rows: [{
          id: productId,
          name: 'Тестовий Товар',
          description: 'Опис',
          price: 500,
          category: 'тест',
          images: [],
          inventory_count: 5,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      query.mockResolvedValue(mockResult);

      const product = await Product.findById(productId);

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE id = $1',
        [productId]
      );

      expect(product).toBeInstanceOf(Product);
      expect(product.id).toBe(productId);
    });

    test('should return null if product not found', async () => {
      const mockResult = { rows: [] };
      query.mockResolvedValue(mockResult);

      const product = await Product.findById('non-existent-id');

      expect(product).toBeNull();
    });
  });

  describe('Product.getCategories', () => {
    test('should return unique categories', async () => {
      const mockResult = {
        rows: [
          { category: 'амулети' },
          { category: 'кристали' },
          { category: 'свічки' }
        ]
      };

      query.mockResolvedValue(mockResult);

      const categories = await Product.getCategories();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT category FROM products'),
        ['active']
      );

      expect(categories).toEqual(['амулети', 'кристали', 'свічки']);
    });
  });

  describe('Product.prototype.isAvailable', () => {
    test('should return true for available product', () => {
      const productData = {
        id: 'test-id',
        name: 'Товар',
        status: 'active',
        inventory_count: 10
      };

      const product = new Product(productData);

      expect(product.isAvailable(5)).toBe(true);
      expect(product.isAvailable(10)).toBe(true);
      expect(product.isAvailable(1)).toBe(true);
    });

    test('should return false for insufficient inventory', () => {
      const productData = {
        id: 'test-id',
        name: 'Товар',
        status: 'active',
        inventory_count: 3
      };

      const product = new Product(productData);

      expect(product.isAvailable(5)).toBe(false);
      expect(product.isAvailable(10)).toBe(false);
    });

    test('should return false for inactive product', () => {
      const productData = {
        id: 'test-id',
        name: 'Товар',
        status: 'inactive',
        inventory_count: 10
      };

      const product = new Product(productData);

      expect(product.isAvailable(1)).toBe(false);
    });
  });

  describe('Product.prototype.toPublicJSON', () => {
    test('should return public data with correct types', () => {
      const productData = {
        id: 'test-id',
        name: 'Товар',
        description: 'Опис',
        price: '100.50', // Зберігається як string в БД
        category: 'тест',
        images: [{ url: '/test.jpg' }],
        inventory_count: 10,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      const product = new Product(productData);
      const publicData = product.toPublicJSON();

      expect(publicData).toHaveProperty('id', 'test-id');
      expect(publicData).toHaveProperty('name', 'Товар');
      expect(publicData).toHaveProperty('description', 'Опис');
      expect(publicData).toHaveProperty('price', 100.50); // Конвертується в number
      expect(publicData).toHaveProperty('category', 'тест');
      expect(publicData).toHaveProperty('images');
      expect(publicData).toHaveProperty('inventory_count', 10);
      expect(publicData).toHaveProperty('status', 'active');
      expect(publicData).toHaveProperty('created_at');
      expect(publicData).toHaveProperty('updated_at');

      expect(typeof publicData.price).toBe('number');
    });
  });
});