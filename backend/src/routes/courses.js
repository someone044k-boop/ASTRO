const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const Course = require('../models/Course');
const CourseTab = require('../models/CourseTab');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const logger = require('../utils/logger');

// Отримання списку всіх курсів
router.get('/', asyncHandler(async (req, res) => {
  const courses = await Course.findAll();
  
  res.json({
    success: true,
    data: courses.map(c => c.toJSON())
  });
}));

// Отримання курсу за рівнем
router.get('/level/:level', optionalAuth, asyncHandler(async (req, res) => {
  const { level } = req.params;
  const course = await Course.findByLevel(parseInt(level));
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Курс рівня ${level} не знайдено`
    });
  }

  const tabs = await course.getTabs();
  
  // Перевіряємо чи користувач записаний на курс
  let isEnrolled = false;
  let enrollment = null;
  if (req.user) {
    enrollment = await Enrollment.findByUserAndCourse(req.user.id, course.id);
    isEnrolled = enrollment !== null;
  }

  res.json({
    success: true,
    data: {
      ...course.toJSON(),
      tabs: tabs,
      isEnrolled,
      progress: enrollment?.progress_percentage || 0
    }
  });
}));

// Отримання курсу за ID
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Курс не знайдено'
    });
  }

  const tabs = await course.getTabs();
  
  let isEnrolled = false;
  let enrollment = null;
  if (req.user) {
    enrollment = await Enrollment.findByUserAndCourse(req.user.id, course.id);
    isEnrolled = enrollment !== null;
  }

  res.json({
    success: true,
    data: {
      ...course.toJSON(),
      tabs: tabs,
      isEnrolled,
      progress: enrollment?.progress_percentage || 0
    }
  });
}));

// Отримання вкладок курсу
router.get('/:id/tabs', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tabs = await CourseTab.findByCourseId(id);
  
  res.json({
    success: true,
    data: tabs.map(t => t.toJSON())
  });
}));

// Отримання уроків вкладки
router.get('/:courseId/tabs/:tabId/lessons', authenticateToken, asyncHandler(async (req, res) => {
  const { courseId, tabId } = req.params;
  
  // Перевіряємо чи користувач записаний на курс
  const isEnrolled = await Enrollment.isEnrolled(req.user.id, courseId);
  if (!isEnrolled) {
    return res.status(403).json({
      success: false,
      message: 'Ви не записані на цей курс'
    });
  }

  const lessons = await Lesson.findByTabId(tabId);
  
  res.json({
    success: true,
    data: lessons.map(l => l.toJSON())
  });
}));

// Отримання конкретного уроку
router.get('/lessons/:lessonId', authenticateToken, asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const lesson = await Lesson.findById(lessonId);
  
  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: 'Урок не знайдено'
    });
  }

  // Перевіряємо доступ
  const isEnrolled = await Enrollment.isEnrolled(req.user.id, lesson.course_id);
  if (!isEnrolled) {
    return res.status(403).json({
      success: false,
      message: 'Ви не записані на цей курс'
    });
  }

  res.json({
    success: true,
    data: lesson.toJSON()
  });
}));

// Запис на курс
router.post('/:id/enroll', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Курс не знайдено'
    });
  }

  // Перевіряємо чи вже записаний
  const existingEnrollment = await Enrollment.findByUserAndCourse(req.user.id, id);
  if (existingEnrollment) {
    return res.json({
      success: true,
      message: 'Ви вже записані на цей курс',
      data: existingEnrollment.toJSON()
    });
  }

  // TODO: Тут буде перевірка оплати для платних курсів
  
  const enrollment = await Enrollment.create({
    user_id: req.user.id,
    course_id: id
  });

  logger.info(`Користувач ${req.user.email} записався на курс ${course.title}`);

  res.status(201).json({
    success: true,
    message: 'Успішно записано на курс',
    data: enrollment.toJSON()
  });
}));

// Отримання курсів користувача
router.get('/my/enrolled', authenticateToken, asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.findByUserId(req.user.id);
  
  res.json({
    success: true,
    data: enrollments
  });
}));

// Адміністративні маршрути

// Створення курсу (тільки для адмінів)
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Недостатньо прав'
    });
  }

  const { title, level, description, price, thumbnail_url } = req.body;
  
  const course = await Course.create({
    title, level, description, price, thumbnail_url
  });

  res.status(201).json({
    success: true,
    data: course.toJSON()
  });
}));

// Створення вкладки курсу
router.post('/:id/tabs', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Недостатньо прав' });
  }

  const { name, type, content, order_index } = req.body;
  
  const tab = await CourseTab.create({
    course_id: req.params.id,
    name, type, content, order_index
  });

  res.status(201).json({
    success: true,
    data: tab.toJSON()
  });
}));

// Створення уроку
router.post('/:courseId/tabs/:tabId/lessons', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Недостатньо прав' });
  }

  const { title, content, audio_url, slides, order_index, duration_minutes } = req.body;
  
  const lesson = await Lesson.create({
    course_id: req.params.courseId,
    tab_id: req.params.tabId,
    title, content, audio_url, slides, order_index, duration_minutes
  });

  res.status(201).json({
    success: true,
    data: lesson.toJSON()
  });
}));

module.exports = router;