import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const HomeContainer = styled.div`
  min-height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
`;

const Title = styled(motion.h1)`
  font-size: 3rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: #666;
  max-width: 600px;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const StatusCard = styled(motion.div)`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  margin-top: 2rem;
`;

const StatusTitle = styled.h2`
  color: #28a745;
  margin-bottom: 1rem;
`;

const StatusList = styled.ul`
  text-align: left;
  color: #666;
  
  li {
    margin-bottom: 0.5rem;
  }
`;

const HomePage = () => {
  return (
    <HomeContainer>
      <Title
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Онлайн Школа Навчання
      </Title>
      
      <Subtitle
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Навчання містичних та езотеричних практик з сучасними технологіями
      </Subtitle>
      
      <StatusCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <StatusTitle>✅ Базова інфраструктура налаштована</StatusTitle>
        <StatusList>
          <li>✅ React frontend з Redux та React Router</li>
          <li>✅ Node.js backend з Express</li>
          <li>✅ PostgreSQL база даних</li>
          <li>✅ Redis кешування</li>
          <li>✅ Docker контейнеризація</li>
          <li>✅ Базові налаштування безпеки та CORS</li>
          <li>🔄 Готово до реалізації наступних завдань</li>
        </StatusList>
      </StatusCard>
    </HomeContainer>
  );
};

export default HomePage;