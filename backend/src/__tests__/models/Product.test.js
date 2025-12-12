const Product = require('../../models/Product');
const { query } = require('../../database/connection');

describe('Product Model', () => {
  beforeEach(() => {
    // Очищаємо всі моки перед кожним тестом
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

      expect(product).toBeInstanceOf(Product);
      expect(product.name).toBe(productData.name);
      expect(product.description).toBe(productData.description);
      expect(parseFloat(product.price)).toBe(productData.price);
      expect(product.category).toBe(productData.category);
      expect(product.inventory_count).toBe(productData.inventory_count);
      expect(product.status).toBe('active');
      expect(product.id).toBeDefined();
    });

    test('should create product with default values', async () => {
      const productData = {
        name: 'Мінімальний Товар',
        description: 'Опис',
        price: 500,
        category: 'тест'
      };

      const mockResult = {
        rows: [{
          id: 'test-id-456',
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          images: [],
          inventory_count: 0, // Default value
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      query.mockResolvedValue(mockResult);

      const product = await Product.create(productData);

      expect(product.inventory_count).toBe(0);
      expect(product.status).toBe('active');
    });
  });

  describe('Product.findById', () => {
    test('should find product by ID successfully', async () => {
      const mockProduct = {
        id: 'test-id-123',
        name: 'Знайти Товар',
        description: 'Опис',
        price: 750,
        category: 'тест',
        images: [],
        inventory_count: 10,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      query.mockResolvedValue({ rows: [mockProduct] });

      const foundProduct = await Product.findById('test-id-123');

      expect(foundProduct).toBeInstanceOf(Product);
      expect(foundProduct.id).toBe(mockProduct.id);
      expect(foundProduct.name).toBe(mockProduct.name);
    });

    test('should return null if product not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const fakeId = '00000000-0000-0000-0000-000000000000';
      const product = await Product.findById(fakeId);

      expect(product).toBeNull();
    });
  });

  describe('Product.findAll', () => {
    test('should find all active products', async () => {
      const mockProducts = [
        {
          id: 'test-id-1',
          name: 'Товар 1',
          description: 'Опис 1',
          price: 100,
          category: 'категорія1',
          images: [],
          inventory_count: 10,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'test-id-2',
          name: 'Товар 2',
          description: 'Опис 2',
          price: 200,
          category: 'категорія2',
          images: [],
          inventory_count: 5,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'test-id-3',
          name: 'Товар 3',
          description: 'Опис 3',
          price: 300,
          category: 'категорія1',
          images: [],
          inventory_count: 15,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      query.mockResolvedValue({ rows: mockProducts });

      const products = await Product.findAll();

      expect(products).toHaveLength(3);
      expect(products[0]).toBeInstanceOf(Product);
    });

    test('should filter products by category', async () => {
      const mockProducts = [
        {
          id: 'test-id-1',
          name: 'Товар 1',
          description: 'Опис 1',
          price: 100,
          category: 'категорія1',
          images: [],
          inventory_count: 10,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'test-id-3',
          name: 'Товар 3',
          description: 'Опис 3',
          price: 300,
          category: 'категорія1',
          images: [],
          inventory_count: 15,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      query.mockResolvedValue({ rows: mockProducts });

      const products = await Product.findAll({ category: 'категорія1' });

      expect(products).toHaveLength(2);
      products.forEach(product => {
        expect(product.category).toBe('категорія1');
      });
    });

    test('should limit results', async () => {
      const mockProducts = [
        {
          id: 'test-id-1',
          name: 'Товар 1',
          description: 'Опис 1',
          price: 100,
          category: 'категорія1',
          images: [],
          inventory_count: 10,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'test-id-2',
          name: 'Товар 2',
          description: 'Опис 2',
          price: 200,
          category: 'категорія2',
          images: [],
          inventory_count: 5,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      query.mockResolvedValue({ rows: mockProducts });

      const products = await Product.findAll({ limit: 2 });

      expect(products).toHaveLength(2);
    });
  });

  describe('Product.getCategories', () => {
    test('should return unique categories', async () => {
      const mockCategories = [
        { category: 'амулети' },
        { category: 'кристали' }
      ];

      query.mockResolvedValue({ rows: mockCategories });

      const categories = await Product.getCategories();

      expect(categories).toHaveLength(2);
      expect(categories).toContain('амулети');
      expect(categories).toContain('кристали');
    });
  });

  describe('Product.prototype.update', () => {
    test('should update product successfully', async () => {
      const mockProduct = {
        id: 'test-id-123',
        name: 'Оновлена Назва',
        description: 'Оригінальний опис',
        price: 750,
        category: 'тест',
        images: [],
        inventory_count: 10,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock the update query
      query.mockResolvedValue({ rows: [mockProduct] });

      const product = new Product({
        id: 'test-id-123',
        name: 'Оригінальна Назва',
        description: 'Оригінальний опис',
        price: 500,
        category: 'тест',
        images: [],
        inventory_count: 10,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });

      await product.update({
        name: 'Оновлена Назва',
        price: 750
      });

      expect(product.name).toBe('Оновлена Назва');
      expect(parseFloat(product.price)).toBe(750);
      expect(product.description).toBe('Оригінальний опис'); // Не змінився
    });
  });

  describe('Product.prototype.decreaseInventory', () => {
    test('should decrease inventory successfully', async () => {
      const product = new Product({
        id: 'test-id-123',
        name: 'Товар',
        description: 'Опис',
        price: 100,
        category: 'тест',
        images: [],
        inventory_count: 10,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });

      // Mock the decrease inventory query
      query.mockResolvedValue({ rows: [{ inventory_count: 7 }] });

      const newCount = await product.decreaseInventory(3);

      expect(newCount).toBe(7);
      expect(product.inventory_count).toBe(7);
    });

    test('should throw error if insufficient inventory', async () => {
      const product = new Product({
        id: 'test-id-123',
        name: 'Товар',
        description: 'Опис',
        price: 100,
        category: 'тест',
        images: [],
        inventory_count: 5,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });

      await expect(product.decreaseInventory(10))
        .rejects.toThrow('Недостатньо товару на складі');
    });
  });

  describe('Product.prototype.increaseInventory', () => {
    test('should increase inventory successfully', async () => {
      const product = new Product({
        id: 'test-id-123',
        name: 'Товар',
        description: 'Опис',
        price: 100,
        category: 'тест',
        images: [],
        inventory_count: 5,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });

      // Mock the increase inventory query
      query.mockResolvedValue({ rows: [{ inventory_count: 8 }] });

      const newCount = await product.increaseInventory(3);

      expect(newCount).toBe(8);
      expect(product.inventory_count).toBe(8);
    });
  });

  describe('Product.prototype.isAvailable', () => {
    test('should return true for available product', async () => {
      const product = new Product({
        id: 'test-id-123',
        name: 'Товар',
        description: 'Опис',
        price: 100,
        category: 'тест',
        images: [],
        inventory_count: 10,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });

      expect(product.isAvailable(5)).toBe(true);
      expect(product.isAvailable(10)).toBe(true);
    });

    test('should return false for insufficient inventory', async () => {
      const product = new Product({
        id: 'test-id-123',
        name: 'Товар',
        description: 'Опис',
        price: 100,
        category: 'тест',
        images: [],
        inventory_count: 3,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });

      expect(product.isAvailable(5)).toBe(false);
    });

    test('should return false for inactive product', async () => {
      const product = new Product({
        id: 'test-id-123',
        name: 'Товар',
        description: 'Опис',
        price: 100,
        category: 'тест',
        images: [],
        inventory_count: 10,
        status: 'inactive',
        created_at: new Date(),
        updated_at: new Date()
      });

      expect(product.isAvailable(1)).toBe(false);
    });
  });

  describe('Product.prototype.toPublicJSON', () => {
    test('should return public data without sensitive information', async () => {
      const product = new Product({
        id: 'test-id-123',
        name: 'Товар',
        description: 'Опис',
        price: 100,
        category: 'тест',
        images: [],
        inventory_count: 10,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });

      const publicData = product.toPublicJSON();

      expect(publicData).toHaveProperty('id');
      expect(publicData).toHaveProperty('name');
      expect(publicData).toHaveProperty('description');
      expect(publicData).toHaveProperty('price');
      expect(publicData).toHaveProperty('category');
      expect(publicData).toHaveProperty('images');
      expect(publicData).toHaveProperty('inventory_count');
      expect(publicData).toHaveProperty('status');
      expect(publicData).toHaveProperty('created_at');
      expect(publicData).toHaveProperty('updated_at');

      expect(typeof publicData.price).toBe('number');
    });
  });
});