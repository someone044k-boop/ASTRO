const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, requireRole } = require('../middleware/auth');
const ContentPage = require('../models/ContentPage');
const logger = require('../utils/logger');

// Отримання сторінки за slug (публічний доступ)
router.get('/page/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const page = await ContentPage.findBySlug(slug);
  
  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Сторінку не знайдено'
    });
  }

  if (page.status !== 'published') {
    return res.status(404).json({
      success: false,
      message: 'Сторінка недоступна'
    });
  }

  res.json({
    success: true,
    data: page.toPublicJSON(),
    meta: page.getMetaData()
  });
}));

// Отримання списку сторінок з фільтрацією
router.get('/pages', asyncHandler(async (req, res) => {
  const { 
    status = 'published', 
    parent_id, 
    limit = 50, 
    offset = 0,
    search 
  } = req.query;

  let pages;

  if (search) {
    pages = await ContentPage.search(search, { 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
  } else {
    pages = await ContentPage.findAll({
      status: status === 'all' ? null : status,
      parent_id,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  res.json({
    success: true,
    data: pages.map(page => page.toPublicJSON()),
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: pages.length
    }
  });
}));

// Отримання навігаційного меню
router.get('/navigation', asyncHandler(async (req, res) => {
  const menuItems = await ContentPage.getNavigationMenu();
  
  res.json({
    success: true,
    data: menuItems.map(item => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      parent_id: item.parent_id,
      order_index: item.order_index,
      level: item.level || 0
    }))
  });
}));

// Отримання дочірніх сторінок
router.get('/page/:slug/children', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const page = await ContentPage.findBySlug(slug);
  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Батьківську сторінку не знайдено'
    });
  }

  const children = await page.getChildren();
  
  res.json({
    success: true,
    data: children.map(child => child.toPublicJSON())
  });
}));

// Створення нової сторінки (тільки для адміністраторів)
router.post('/pages', authenticateToken, requireRole(['admin', 'teacher']), asyncHandler(async (req, res) => {
  const { slug, title, content, meta_data, parent_id, order_index, status } = req.body;

  // Валідація обов'язкових полів
  if (!slug || !title || !content) {
    return res.status(400).json({
      success: false,
      message: 'Поля slug, title та content є обов\'язковими'
    });
  }

  try {
    const page = await ContentPage.create({
      slug,
      title,
      content,
      meta_data,
      parent_id,
      order_index,
      status
    });

    // Валідація контенту
    page.validateContent();

    logger.info(`Користувач ${req.user.email} створив сторінку: ${slug}`);

    res.status(201).json({
      success: true,
      data: page.toPublicJSON(),
      message: 'Сторінку успішно створено'
    });
  } catch (error) {
    if (error.message.includes('вже існує')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
}));

// Оновлення сторінки (тільки для адміністраторів)
router.put('/pages/:id', authenticateToken, requireRole(['admin', 'teacher']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, meta_data, parent_id, order_index, status } = req.body;

  const page = await ContentPage.findById(id);
  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Сторінку не знайдено'
    });
  }

  await page.update({
    title,
    content,
    meta_data,
    parent_id,
    order_index,
    status
  });

  // Валідація оновленого контенту
  if (content) {
    page.validateContent();
  }

  logger.info(`Користувач ${req.user.email} оновив сторінку: ${page.slug}`);

  res.json({
    success: true,
    data: page.toPublicJSON(),
    message: 'Сторінку успішно оновлено'
  });
}));

// Видалення сторінки (м'яке видалення)
router.delete('/pages/:id', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hard_delete = false } = req.query;

  const page = await ContentPage.findById(id);
  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Сторінку не знайдено'
    });
  }

  if (hard_delete === 'true') {
    await page.hardDelete();
    logger.info(`Користувач ${req.user.email} жорстко видалив сторінку: ${page.slug}`);
  } else {
    await page.delete();
    logger.info(`Користувач ${req.user.email} архівував сторінку: ${page.slug}`);
  }

  res.json({
    success: true,
    message: hard_delete === 'true' ? 'Сторінку повністю видалено' : 'Сторінку архівовано'
  });
}));

// Отримання конкретної сторінки за ID (для адміністрування)
router.get('/admin/pages/:id', authenticateToken, requireRole(['admin', 'teacher']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const page = await ContentPage.findById(id);
  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Сторінку не знайдено'
    });
  }

  res.json({
    success: true,
    data: page.toPublicJSON()
  });
}));

// Отримання всіх сторінок для адміністрування
router.get('/admin/pages', authenticateToken, requireRole(['admin', 'teacher']), asyncHandler(async (req, res) => {
  const { 
    status, 
    parent_id, 
    limit = 100, 
    offset = 0 
  } = req.query;

  const pages = await ContentPage.findAll({
    status: status === 'all' ? null : status,
    parent_id,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: pages.map(page => page.toPublicJSON()),
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: pages.length
    }
  });
}));

// Валідація контенту сторінки
router.post('/validate', authenticateToken, requireRole(['admin', 'teacher']), asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Контент є обов\'язковим для валідації'
    });
  }

  try {
    // Створюємо тимчасовий об'єкт для валідації
    const tempPage = new ContentPage({
      id: 'temp',
      slug: 'temp',
      title: 'temp',
      content: content,
      status: 'draft'
    });

    tempPage.validateContent();

    res.json({
      success: true,
      message: 'Контент валідний',
      data: {
        blocks_count: content.blocks ? content.blocks.length : 0,
        block_types: content.blocks ? content.blocks.map(b => b.type) : []
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Помилка валідації контенту',
      error: error.message
    });
  }
}));

module.exports = router;