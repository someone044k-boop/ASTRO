const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const LessonProgress = require('../models/LessonProgress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const logger = require('../utils/logger');

/**
 * @route POST /api/progress/lesson/:lessonId
 * @desc Оновлення прогресу уроку
 * @access Private
 */
router.post('/lesson/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { progress_percentage, time_spent_minutes = 0, last_position } = req.body;
    const userId = req.user.id;

    // Перевірка валідності даних
    if (progress_percentage < 0 || progress_percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Прогрес повинен бути від 0 до 100%'
      });
    }

    // Отримання інформації про урок
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Урок не знайдено'
      });
    }

    // Перевірка чи користувач записаний на курс
    const isEnrolled = await Enrollment.isEnrolled(userId, lesson.course_id);
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Ви не записані на цей курс'
      });
    }

    // Оновлення прогресу уроку
    const lessonProgress = await LessonProgress.createOrUpdate({
      user_id: userId,
      lesson_id: lessonId,
      course_id: lesson.course_id,
      progress_percentage,
      time_spent_minutes,
      last_position
    });

    // Оновлення загального прогресу курсу
    const courseProgress = await LessonProgress.getCourseProgress(lesson.course_id, userId);
    
    // Оновлення прогресу в таблиці enrollments
    const enrollment = await Enrollment.findByUserAndCourse(userId, lesson.course_id);
    if (enrollment) {
      await enrollment.updateProgress(parseFloat(courseProgress.completion_percentage));
    }

    res.json({
      success: true,
      data: {
        lesson_progress: lessonProgress.toJSON(),
        course_progress: courseProgress
      },
      message: 'Прогрес успішно оновлено'
    });

  } catch (error) {
    logger.error('Помилка оновлення прогресу уроку:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

/**
 * @route GET /api/progress/lesson/:lessonId
 * @desc Отримання прогресу конкретного уроку
 * @access Private
 */
router.get('/lesson/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const progress = await LessonProgress.findByUserAndLesson(userId, lessonId);
    
    res.json({
      success: true,
      data: progress ? progress.toJSON() : null
    });

  } catch (error) {
    logger.error('Помилка отримання прогресу уроку:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

/**
 * @route POST /api/progress/lesson/:lessonId/complete
 * @desc Позначення уроку як завершеного
 * @access Private
 */
router.post('/lesson/:lessonId/complete', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    // Отримання або створення прогресу уроку
    let progress = await LessonProgress.findByUserAndLesson(userId, lessonId);
    
    if (!progress) {
      // Отримання інформації про урок для створення прогресу
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Урок не знайдено'
        });
      }

      progress = await LessonProgress.createOrUpdate({
        user_id: userId,
        lesson_id: lessonId,
        course_id: lesson.course_id,
        progress_percentage: 100
      });
    } else {
      await progress.markAsCompleted();
    }

    // Оновлення загального прогресу курсу
    const courseProgress = await LessonProgress.getCourseProgress(progress.course_id, userId);
    
    // Оновлення прогресу в enrollments
    const enrollment = await Enrollment.findByUserAndCourse(userId, progress.course_id);
    if (enrollment) {
      await enrollment.updateProgress(parseFloat(courseProgress.completion_percentage));
    }

    res.json({
      success: true,
      data: {
        lesson_progress: progress.toJSON(),
        course_progress: courseProgress
      },
      message: 'Урок успішно завершено'
    });

  } catch (error) {
    logger.error('Помилка завершення уроку:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

/**
 * @route GET /api/progress/course/:courseId
 * @desc Отримання прогресу курсу
 * @access Private
 */
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Перевірка чи користувач записаний на курс
    const isEnrolled = await Enrollment.isEnrolled(userId, courseId);
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Ви не записані на цей курс'
      });
    }

    // Отримання загального прогресу курсу
    const courseProgress = await LessonProgress.getCourseProgress(courseId, userId);
    
    // Отримання прогресу по урокам
    const lessonsProgress = await LessonProgress.findByCourseAndUser(courseId, userId);

    res.json({
      success: true,
      data: {
        course_progress: courseProgress,
        lessons_progress: lessonsProgress.map(lp => lp.toJSON())
      }
    });

  } catch (error) {
    logger.error('Помилка отримання прогресу курсу:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

/**
 * @route GET /api/progress/my-stats
 * @desc Отримання статистики навчання користувача
 * @access Private
 */
router.get('/my-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Отримання загальної статистики
    const learningStats = await LessonProgress.getUserLearningStats(userId);
    
    // Отримання останніх активностей
    const recentActivity = await LessonProgress.getRecentActivity(userId, 5);

    // Отримання записаних курсів
    const enrolledCourses = await Enrollment.findByUserId(userId);

    res.json({
      success: true,
      data: {
        learning_stats: learningStats,
        recent_activity: recentActivity,
        enrolled_courses: enrolledCourses
      }
    });

  } catch (error) {
    logger.error('Помилка отримання статистики навчання:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

/**
 * @route GET /api/progress/dashboard
 * @desc Отримання даних для дашборду прогресу
 * @access Private
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Отримання записаних курсів з прогресом
    const enrolledCourses = await Enrollment.findByUserId(userId);
    
    // Додавання детального прогресу для кожного курсу
    const coursesWithProgress = await Promise.all(
      enrolledCourses.map(async (enrollment) => {
        const courseProgress = await LessonProgress.getCourseProgress(enrollment.course_id, userId);
        return {
          ...enrollment,
          detailed_progress: courseProgress
        };
      })
    );

    // Отримання загальної статистики
    const learningStats = await LessonProgress.getUserLearningStats(userId);
    
    // Отримання останніх активностей
    const recentActivity = await LessonProgress.getRecentActivity(userId, 10);

    res.json({
      success: true,
      data: {
        enrolled_courses: coursesWithProgress,
        learning_stats: learningStats,
        recent_activity: recentActivity
      }
    });

  } catch (error) {
    logger.error('Помилка отримання даних дашборду:', error.message);
    res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера'
    });
  }
});

module.exports = router;