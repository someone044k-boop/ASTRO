const { body, validationResult } = require('express-validator');

// Валідатор для реєстрації
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введіть дійсну електронну адресу')
    .isLength({ max: 255 })
    .withMessage('Електронна адреса занадто довга'),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('Пароль повинен містити мінімум 8 символів')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль повинен містити принаймні одну малу літеру, одну велику літеру та одну цифру'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Паролі не співпадають');
      }
      return true;
    }),
    
  body('phone')
    .optional()
    .isMobilePhone('uk-UA')
    .withMessage('Введіть дійсний номер телефону')
    .isLength({ max: 20 })
    .withMessage('Номер телефону занадто довгий'),
    
  body('role')
    .optional()
    .isIn(['student', 'teacher'])
    .withMessage('Невірна роль користувача')
];

// Валідатор для входу
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введіть дійсну електронну адресу'),
    
  body('password')
    .notEmpty()
    .withMessage('Пароль обов\'язковий')
    .isLength({ min: 1 })
    .withMessage('Пароль не може бути порожнім')
];

// Валідатор для оновлення токена
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Токен оновлення обов\'язковий')
    .isLength({ min: 10 })
    .withMessage('Невірний формат токена оновлення')
];

// Валідатор для зміни пароля
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Поточний пароль обов\'язковий'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Новий пароль повинен містити мінімум 8 символів')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Новий пароль повинен містити принаймні одну малу літеру, одну велику літеру та одну цифру'),
    
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Нові паролі не співпадають');
      }
      return true;
    })
];

// Валідатор для оновлення профілю
const validateProfileUpdate = [
  body('phone')
    .optional()
    .isMobilePhone('uk-UA')
    .withMessage('Введіть дійсний номер телефону')
    .isLength({ max: 20 })
    .withMessage('Номер телефону занадто довгий'),
    
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('Введіть дійсне посилання на аватар')
    .isLength({ max: 500 })
    .withMessage('Посилання на аватар занадто довге')
];

// Middleware для обробки помилок валідації
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      error: 'Помилки валідації',
      code: 'VALIDATION_ERROR',
      details: formattedErrors
    });
  }
  
  next();
};

// Валідатор для email підтвердження
const validateEmailVerification = [
  body('token')
    .notEmpty()
    .withMessage('Токен підтвердження обов\'язковий')
    .isLength({ min: 10 })
    .withMessage('Невірний формат токена підтвердження')
];

// Валідатор для скидання пароля
const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введіть дійсну електронну адресу')
];

// Валідатор для підтвердження скидання пароля
const validatePasswordResetConfirm = [
  body('token')
    .notEmpty()
    .withMessage('Токен скидання обов\'язковий'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Новий пароль повинен містити мінімум 8 символів')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Новий пароль повинен містити принаймні одну малу літеру, одну велику літеру та одну цифру'),
    
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Паролі не співпадають');
      }
      return true;
    })
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validatePasswordChange,
  validateProfileUpdate,
  validateEmailVerification,
  validatePasswordReset,
  validatePasswordResetConfirm,
  handleValidationErrors
};