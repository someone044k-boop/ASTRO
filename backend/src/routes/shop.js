const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Валідатори
const productValidation = [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Назва товару обов\'язкова та не більше 255 символів'),
  body('description').optional().trim(),
  body('price').isFloat({ min: 0 }).withMessage('Ціна повинна бути позитивним числом'),
  body('category').optional().trim().isLength({ max: 100 }),
  body('images').optional().isArray(),
  body('inventory_count').optional().isInt({ min: 0 }).withMessage('Кількість на складі повинна бути невід\'ємним числом')
];

const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Замовлення повинно містити хоча б один товар'),
  body('items.*.product_id').isUUID().withMessage('ID товару повинен бути валідним UUID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Кількість повинна бути позитивним числом'),
  body('payment_method').optional().trim().isLength({ max: 100 })
];

// Обробка помилок валідації
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Помилки валідації',
      errors: errors.array()
    });
  }
  next();
};

// === ТОВАРИ ===

// Отримання всіх товарів з фільтрацією
router.get('/products', [
  query('category').optional().trim(),
  query('status').optional().isIn(['active', 'inactive', 'out_of_stock']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const { category, status = 'active', limit = 20, offset = 0 } = req.query;
    
    const products = await Product.findAll({
      category,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: products.map(product => product.toPublicJSON()),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: products.length
      }
    });
  } catch (error) {
    logger.error('Помилка отримання товарів:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при отриманні товарів'
    });
  }
});

// Отримання товару за ID
router.get('/products/:id', [
  param('id').isUUID().withMessage('ID товару повинен бути валідним UUID')
], handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не знайдено'
      });
    }

    res.json({
      success: true,
      data: product.toPublicJSON()
    });
  } catch (error) {
    logger.error('Помилка отримання товару:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при отриманні товару'
    });
  }
});

// Отримання категорій товарів
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.getCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Помилка отримання категорій:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при отриманні категорій'
    });
  }
});

// Отримання товарів за категорією
router.get('/categories/:category/products', [
  param('category').trim().isLength({ min: 1 }).withMessage('Категорія обов\'язкова')
], handleValidationErrors, async (req, res) => {
  try {
    const products = await Product.findByCategory(req.params.category);
    
    res.json({
      success: true,
      data: products.map(product => product.toPublicJSON())
    });
  } catch (error) {
    logger.error('Помилка отримання товарів за категорією:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при отриманні товарів за категорією'
    });
  }
});

// Створення товару (тільки для адміністраторів)
router.post('/products', authenticateToken, requireRole('admin'), productValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, description, price, category, images, inventory_count } = req.body;
    
    const product = await Product.create({
      name,
      description,
      price,
      category,
      images,
      inventory_count
    });

    res.status(201).json({
      success: true,
      message: 'Товар успішно створено',
      data: product.toPublicJSON()
    });
  } catch (error) {
    logger.error('Помилка створення товару:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при створенні товару'
    });
  }
});

// Оновлення товару (тільки для адміністраторів)
router.put('/products/:id', authenticateToken, requireRole('admin'), [
  param('id').isUUID().withMessage('ID товару повинен бути валідним UUID'),
  ...productValidation
], handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не знайдено'
      });
    }

    const { name, description, price, category, images, inventory_count, status } = req.body;
    
    await product.update({
      name,
      description,
      price,
      category,
      images,
      inventory_count,
      status
    });

    res.json({
      success: true,
      message: 'Товар успішно оновлено',
      data: product.toPublicJSON()
    });
  } catch (error) {
    logger.error('Помилка оновлення товару:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при оновленні товару'
    });
  }
});

// Видалення товару (тільки для адміністраторів)
router.delete('/products/:id', authenticateToken, requireRole('admin'), [
  param('id').isUUID().withMessage('ID товару повинен бути валідним UUID')
], handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не знайдено'
      });
    }

    await product.delete();

    res.json({
      success: true,
      message: 'Товар успішно видалено'
    });
  } catch (error) {
    logger.error('Помилка видалення товару:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при видаленні товару'
    });
  }
});

// === ЗАМОВЛЕННЯ ===

// Створення замовлення
router.post('/orders', authenticateToken, orderValidation, handleValidationErrors, async (req, res) => {
  try {
    const { items, payment_method } = req.body;
    const user_id = req.user.id;

    // Перевіряємо доступність всіх товарів
    let total_amount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Товар з ID ${item.product_id} не знайдено`
        });
      }

      if (!product.isAvailable(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Товар "${product.name}" недоступний в потрібній кількості. Доступно: ${product.inventory_count}`
        });
      }

      const itemTotal = parseFloat(product.price) * item.quantity;
      total_amount += itemTotal;
      
      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        product: product
      });
    }

    // Створюємо замовлення
    const order = await Order.create({
      user_id,
      total_amount,
      payment_method
    });

    // Додаємо елементи замовлення та резервуємо товари
    for (const item of orderItems) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      });

      // Резервуємо товар
      await item.product.decreaseInventory(item.quantity);
    }

    // Отримуємо детальну інформацію про замовлення
    const detailedOrder = await order.getDetailedOrder();

    res.status(201).json({
      success: true,
      message: 'Замовлення успішно створено',
      data: detailedOrder
    });
  } catch (error) {
    logger.error('Помилка створення замовлення:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при створенні замовлення'
    });
  }
});

// Отримання замовлень користувача
router.get('/orders', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const user_id = req.user.id;

    const orders = await Order.findByUserId(user_id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Отримуємо детальну інформацію для кожного замовлення
    const detailedOrders = await Promise.all(
      orders.map(order => order.getDetailedOrder())
    );

    res.json({
      success: true,
      data: detailedOrders,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: orders.length
      }
    });
  } catch (error) {
    logger.error('Помилка отримання замовлень користувача:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при отриманні замовлень'
    });
  }
});

// Отримання замовлення за ID
router.get('/orders/:id', authenticateToken, [
  param('id').isUUID().withMessage('ID замовлення повинен бути валідним UUID')
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Замовлення не знайдено'
      });
    }

    // Перевіряємо права доступу
    if (!order.belongsToUser(req.user.id) && !req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }

    const detailedOrder = await order.getDetailedOrder();

    res.json({
      success: true,
      data: detailedOrder
    });
  } catch (error) {
    logger.error('Помилка отримання замовлення:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при отриманні замовлення'
    });
  }
});

// Скасування замовлення
router.post('/orders/:id/cancel', authenticateToken, [
  param('id').isUUID().withMessage('ID замовлення повинен бути валідним UUID')
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Замовлення не знайдено'
      });
    }

    // Перевіряємо права доступу
    if (!order.belongsToUser(req.user.id) && !req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Доступ заборонено'
      });
    }

    await order.cancel();

    res.json({
      success: true,
      message: 'Замовлення успішно скасовано',
      data: order.toPublicJSON()
    });
  } catch (error) {
    logger.error('Помилка скасування замовлення:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Помилка сервера при скасуванні замовлення'
    });
  }
});

// Оновлення статусу замовлення (тільки для адміністраторів)
router.put('/orders/:id/status', authenticateToken, requireRole('admin'), [
  param('id').isUUID().withMessage('ID замовлення повинен бути валідним UUID'),
  body('status').isIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled']).withMessage('Невалідний статус'),
  body('payment_id').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Замовлення не знайдено'
      });
    }

    const { status, payment_id } = req.body;
    await order.updateStatus(status, payment_id);

    res.json({
      success: true,
      message: 'Статус замовлення успішно оновлено',
      data: order.toPublicJSON()
    });
  } catch (error) {
    logger.error('Помилка оновлення статусу замовлення:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при оновленні статусу замовлення'
    });
  }
});

// Отримання всіх замовлень (тільки для адміністраторів)
router.get('/admin/orders', authenticateToken, requireRole('admin'), [
  query('status').optional().isIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const orders = await Order.findAll({
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Отримуємо детальну інформацію для кожного замовлення
    const detailedOrders = await Promise.all(
      orders.map(order => order.getDetailedOrder())
    );

    res.json({
      success: true,
      data: detailedOrders,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: orders.length
      }
    });
  } catch (error) {
    logger.error('Помилка отримання всіх замовлень:', error.message);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при отриманні замовлень'
    });
  }
});

module.exports = router;