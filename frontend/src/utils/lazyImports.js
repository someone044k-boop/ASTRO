import { lazy } from 'react';

// Lazy imports для основних сторінок
export const LazyHomePage = lazy(() => import('../pages/HomePage/HomePage'));

// База знань
export const LazyFAQ = lazy(() => import('../pages/BaseKnowledge/FAQ'));
export const LazyAboutMaster = lazy(() => import('../pages/BaseKnowledge/AboutMaster'));
export const LazyYouTubeChannel = lazy(() => import('../pages/BaseKnowledge/YouTubeChannel'));
export const LazySiteNavigation = lazy(() => import('../pages/BaseKnowledge/SiteNavigation'));
export const LazyAskAuthor = lazy(() => import('../pages/BaseKnowledge/AskAuthor'));
export const LazyCityOfGods = lazy(() => import('../pages/BaseKnowledge/CityOfGods'));

// Курси
export const LazyCourseLevel = lazy(() => import('../pages/Courses/CourseLevel'));
export const LazyCourseProgram = lazy(() => import('../pages/Courses/CourseProgram'));
export const LazyLessonPage = lazy(() => import('../pages/Courses/LessonPage'));

// Профіль
export const LazyMyCourses = lazy(() => import('../pages/Profile/MyCourses'));
export const LazyProgressDashboard = lazy(() => import('../components/Progress/ProgressDashboard'));

// Магазин
export const LazyShopPage = lazy(() => import('../pages/Shop/ShopPage'));

// Платежі
export const LazyPaymentResult = lazy(() => import('../pages/Payment/PaymentResult'));

// Астрологія
export const LazyAstroCalculator = lazy(() => import('../pages/Astro/AstroCalculator'));

// Консультації
export const LazyConsultationsPage = lazy(() => import('../pages/Consultations/ConsultationsPage'));

// 404
export const LazyNotFoundPage = lazy(() => import('../pages/NotFoundPage/NotFoundPage'));