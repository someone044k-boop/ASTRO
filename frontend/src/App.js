import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import styled from 'styled-components';

// Компоненти
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import LazyWrapper from './components/LazyLoad/LazyWrapper';
import MetaTags from './components/SEO/MetaTags';
import PerformanceMonitor from './components/Performance/PerformanceMonitor';

// Lazy imports
import {
  LazyHomePage,
  LazyFAQ,
  LazyAboutMaster,
  LazyYouTubeChannel,
  LazySiteNavigation,
  LazyAskAuthor,
  LazyCityOfGods,
  LazyCourseLevel,
  LazyCourseProgram,
  LazyLessonPage,
  LazyMyCourses,
  LazyProgressDashboard,
  LazyShopPage,
  LazyPaymentResult,
  LazyAstroCalculator,
  LazyConsultationsPage,
  LazyNotFoundPage
} from './utils/lazyImports';

// Redux actions
import { checkAuthStatus } from './store/slices/authSlice';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  padding-top: 80px; /* Висота хедера */
`;

function App() {
  const dispatch = useDispatch();

  // Перевіряємо статус аутентифікації при завантаженні додатку
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(checkAuthStatus());
    }
  }, [dispatch]);

  return (
    <HelmetProvider>
      <AppContainer>
        <MetaTags />
        <Header />
        <MainContent>
          <Routes>
            <Route path="/" element={
              <LazyWrapper fallback={<div>Завантаження головної сторінки...</div>}>
                <LazyHomePage />
              </LazyWrapper>
            } />
            
            {/* База знань */}
            <Route path="/base-knowledge/faq" element={
              <LazyWrapper>
                <LazyFAQ />
              </LazyWrapper>
            } />
            <Route path="/base-knowledge/about" element={
              <LazyWrapper>
                <LazyAboutMaster />
              </LazyWrapper>
            } />
            <Route path="/base-knowledge/about-master" element={
              <LazyWrapper>
                <LazyAboutMaster />
              </LazyWrapper>
            } />
            <Route path="/base-knowledge/youtube" element={
              <LazyWrapper>
                <LazyYouTubeChannel />
              </LazyWrapper>
            } />
            <Route path="/base-knowledge/navigation" element={
              <LazyWrapper>
                <LazySiteNavigation />
              </LazyWrapper>
            } />
            <Route path="/base-knowledge/ask-author" element={
              <LazyWrapper>
                <LazyAskAuthor />
              </LazyWrapper>
            } />
            <Route path="/base-knowledge/city-of-gods" element={
              <LazyWrapper>
                <LazyCityOfGods />
              </LazyWrapper>
            } />
            
            {/* Курси */}
            <Route path="/courses/level-:level" element={
              <LazyWrapper>
                <LazyCourseLevel />
              </LazyWrapper>
            } />
            <Route path="/courses/program" element={
              <LazyWrapper>
                <LazyCourseProgram />
              </LazyWrapper>
            } />
            <Route path="/courses/level-:level/lessons" element={<div>Список уроків курсу</div>} />
            <Route path="/courses/level-:level/lesson/:lessonId" element={
              <LazyWrapper>
                <LazyLessonPage />
              </LazyWrapper>
            } />
            
            {/* Інші сторінки */}
            <Route path="/consultations" element={
              <LazyWrapper>
                <LazyConsultationsPage />
              </LazyWrapper>
            } />
            <Route path="/workshop" element={
              <LazyWrapper>
                <LazyShopPage />
              </LazyWrapper>
            } />
            <Route path="/shop" element={
              <LazyWrapper>
                <LazyShopPage />
              </LazyWrapper>
            } />
            <Route path="/astro" element={
              <LazyWrapper>
                <LazyAstroCalculator />
              </LazyWrapper>
            } />
            <Route path="/auth" element={<div>Аутентифікація (завдання 9)</div>} />
            <Route path="/profile/my-courses" element={
              <LazyWrapper>
                <LazyMyCourses />
              </LazyWrapper>
            } />
            <Route path="/profile/progress" element={
              <LazyWrapper>
                <LazyProgressDashboard />
              </LazyWrapper>
            } />
            <Route path="/profile/*" element={<div>Профіль (завдання 9)</div>} />
            
            {/* Платежі */}
            <Route path="/payment/result" element={
              <LazyWrapper>
                <LazyPaymentResult />
              </LazyWrapper>
            } />
            
            {/* 404 сторінка */}
            <Route path="*" element={
              <LazyWrapper>
                <LazyNotFoundPage />
              </LazyWrapper>
            } />
          </Routes>
        </MainContent>
        <Footer />
        <PerformanceMonitor />
      </AppContainer>
    </HelmetProvider>
  );
}

export default App;