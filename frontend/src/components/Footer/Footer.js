import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const FooterContainer = styled.footer`
  background: #333;
  color: white;
  padding: 3rem 0 1rem;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0 1rem;
  }
`;

const FooterSection = styled.div`
  h3 {
    margin-bottom: 1rem;
    color: #6366f1;
    font-size: 1.2rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
  
  p {
    color: #ccc;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`;

const FooterLink = styled(Link)`
  color: #ccc;
  text-decoration: none;
  transition: color 0.2s ease;
  display: inline-block;
  
  &:hover {
    color: #6366f1;
  }
`;

const ExternalLink = styled.a`
  color: #ccc;
  text-decoration: none;
  transition: color 0.2s ease;
  display: inline-block;
  
  &:hover {
    color: #6366f1;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SocialLink = styled.a`
  color: #ccc;
  font-size: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    color: #6366f1;
    transform: translateY(-2px);
  }
`;

const Newsletter = styled.div`
  background: #444;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
  
  h4 {
    color: #6366f1;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }
`;

const NewsletterForm = styled.form`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const NewsletterInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background: #555;
  color: white;
  
  &::placeholder {
    color: #999;
  }
  
  &:focus {
    outline: none;
    background: #666;
  }
`;

const NewsletterButton = styled.button`
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #5855eb;
  }
`;

const Copyright = styled.div`
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #555;
  color: #999;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const LegalLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const Footer = () => {
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Тут буде логіка підписки на розсилку
    alert('Дякуємо за підписку! Функціонал буде реалізований в наступних завданнях.');
  };

  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <h3>Навчання</h3>
          <ul>
            <li><FooterLink to="/courses/level-1">1й курс - Основи</FooterLink></li>
            <li><FooterLink to="/courses/level-2">2й курс - Поглиблення</FooterLink></li>
            <li><FooterLink to="/courses/level-3">3й курс - Майстерність</FooterLink></li>
            <li><FooterLink to="/courses/level-4">4й курс - Експертиза</FooterLink></li>
            <li><FooterLink to="/courses/program">Програма навчання</FooterLink></li>
          </ul>
        </FooterSection>
        
        <FooterSection>
          <h3>База знань</h3>
          <ul>
            <li><FooterLink to="/base-knowledge/faq">Часті питання</FooterLink></li>
            <li><FooterLink to="/base-knowledge/about-master">Про майстра</FooterLink></li>
            <li><FooterLink to="/base-knowledge/youtube">YouTube канал</FooterLink></li>
            <li><FooterLink to="/base-knowledge/navigation">Навігація сайтом</FooterLink></li>
            <li><FooterLink to="/base-knowledge/ask-author">Спитати автора</FooterLink></li>
            <li><FooterLink to="/base-knowledge/city-of-gods">Місто Богів</FooterLink></li>
          </ul>
        </FooterSection>
        
        <FooterSection>
          <h3>Сервіси</h3>
          <ul>
            <li><FooterLink to="/consultations">Консультації</FooterLink></li>
            <li><FooterLink to="/workshop">Майстерня артефактів</FooterLink></li>
            <li><FooterLink to="/astro">Астро калькулятор</FooterLink></li>
          </ul>
          
          <SocialLinks>
            <SocialLink href="#" aria-label="YouTube">📺</SocialLink>
            <SocialLink href="#" aria-label="Telegram">📱</SocialLink>
            <SocialLink href="#" aria-label="Instagram">📷</SocialLink>
            <SocialLink href="#" aria-label="Facebook">📘</SocialLink>
          </SocialLinks>
        </FooterSection>
        
        <FooterSection>
          <h3>Зв'язок</h3>
          <p>
            Маєте питання? Ми завжди готові допомогти вам на шляху духовного розвитку.
          </p>
          <ul>
            <li><FooterLink to="/base-knowledge/ask-author">Задати питання</FooterLink></li>
            <li><ExternalLink href="mailto:support@learning-school.com">support@learning-school.com</ExternalLink></li>
          </ul>
          
          <Newsletter>
            <h4>Розсилка</h4>
            <p>Отримуйте новини та корисні матеріали</p>
            <NewsletterForm onSubmit={handleNewsletterSubmit}>
              <NewsletterInput 
                type="email" 
                placeholder="Ваш email"
                required
              />
              <NewsletterButton type="submit">
                Підписатися
              </NewsletterButton>
            </NewsletterForm>
          </Newsletter>
        </FooterSection>
      </FooterContent>
      
      <Copyright>
        <div>© 2024 Онлайн Школа Навчання. Всі права захищені.</div>
        <LegalLinks>
          <FooterLink to="/privacy">Політика конфіденційності</FooterLink>
          <FooterLink to="/terms">Умови використання</FooterLink>
          <FooterLink to="/cookies">Політика cookies</FooterLink>
        </LegalLinks>
      </Copyright>
    </FooterContainer>
  );
};

export default Footer;