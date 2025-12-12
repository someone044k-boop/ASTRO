const express = require('express');
const router = express.Router();
const { body, param, query: queryValidator, validationResult } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const astroService = require('../services/astroService');
const logger = require('../utils/logger');

// Валідатори
const createChartValidator = [
  body('birthDate').isISO8601().withMessage('Невірний формат дати народження'),
  body('birthTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Невірний формат часу (HH:MM)'),
  body('birthLocation.latitude').isFloat({ min: -90, max: 90 }).withMessage('Невірна широта'),
  body('birthLocation.longitude').isFloat({ min: -180, max: 180 }).withMessage('Невірна довгота'),
  body('birthLocation.city').notEmpty().withMessage('Місто не може бути порожнім'),
  body('birthLocation.country').notEmpty().withMessage('Країна не може бути порожньою'),
];

const compatibilityValidator = [
  body('sign1').notEmpty().withMessage('Перший знак зодіаку обов\'язковий'),
  body('sign2').notEmpty().withMessage('Другий знак зодіаку обов\'язковий'),
];

// Створення натальної карти
router.post('/natal-chart', authenticateToken, createChartValidator, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { birthDate, birthTime, birthLocation } = req.body;
    const userId = req.user.id;

    const natalChart = await astroService.generateNatalChart({
      birthDate,
      birthTime,
      birthLocation,
      userId
    });

    logger.info(`Створено натальну карту для користувача ${userId}`);

    res.json({
      success: true,
      message: 'Натальна карта створена успішно',
      data: natalChart
    });

  } catch (error) {
    logger.error('Помилка створення натальної карти:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Створення натальної карти без реєстрації (гостьовий режим)
router.post('/natal-chart/guest', createChartValidator, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { birthDate, birthTime, birthLocation } = req.body;

    const natalChart = await astroService.generateNatalChart({
      birthDate,
      birthTime,
      birthLocation,
      userId: null // Гостьовий режим
    });

    logger.info(`Створено гостьову натальну карту для ${birthLocation.city}`);

    res.json({
      success: true,
      message: 'Натальна карта створена успішно',
      data: natalChart
    });

  } catch (error) {
    logger.error('Помилка створення гостьової натальної карти:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Отримання збережених натальних карт користувача
router.get('/natal-charts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const charts = await astroService.getUserCharts(userId);

    res.json({
      success: true,
      data: charts
    });

  } catch (error) {
    logger.error('Помилка отримання натальних карт:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Отримання конкретної натальної карти
router.get('/natal-chart/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const chart = await astroService.getChartById(id, userId);
    
    if (!chart) {
      return res.status(404).json({
        success: false,
        message: 'Натальна карта не знайдена'
      });
    }

    res.json({
      success: true,
      data: chart
    });

  } catch (error) {
    logger.error('Помилка отримання натальної карти:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Швидке визначення знаку зодіаку
router.post('/zodiac-sign', [
  body('birthDate').isISO8601().withMessage('Невірний формат дати народження')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { birthDate } = req.body;
    const zodiacSign = astroService.getZodiacSign(birthDate);

    res.json({
      success: true,
      data: {
        sign: zodiacSign,
        birthDate
      }
    });

  } catch (error) {
    logger.error('Помилка визначення знаку зодіаку:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Сумісність знаків зодіаку
router.post('/compatibility', compatibilityValidator, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { sign1, sign2 } = req.body;
    const compatibility = astroService.getCompatibility(sign1, sign2);

    let description = '';
    if (compatibility >= 8) {
      description = 'Відмінна сумісність! Ви ідеально підходите один одному.';
    } else if (compatibility >= 6) {
      description = 'Хороша сумісність. У вас є потенціал для гармонійних стосунків.';
    } else if (compatibility >= 4) {
      description = 'Середня сумісність. Потрібно працювати над стосунками.';
    } else {
      description = 'Складна сумісність. Потрібно багато зусиль для гармонії.';
    }

    res.json({
      success: true,
      data: {
        sign1,
        sign2,
        compatibility,
        description,
        percentage: Math.round(compatibility * 10)
      }
    });

  } catch (error) {
    logger.error('Помилка розрахунку сумісності:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Отримання інформації про всі знаки зодіаку
router.get('/zodiac-signs', async (req, res) => {
  try {
    res.json({
      success: true,
      data: astroService.zodiacSigns
    });
  } catch (error) {
    logger.error('Помилка отримання знаків зодіаку:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Отримання інформації про планети
router.get('/planets', async (req, res) => {
  try {
    res.json({
      success: true,
      data: astroService.planets
    });
  } catch (error) {
    logger.error('Помилка отримання планет:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

// Отримання інформації про будинки
router.get('/houses', async (req, res) => {
  try {
    res.json({
      success: true,
      data: astroService.houses
    });
  } catch (error) {
    logger.error('Помилка отримання будинків:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

module.exports = router;