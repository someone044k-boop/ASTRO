import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import RichTextRenderer from '../../components/Content/RichTextRenderer';
import contentService from '../../services/contentService';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Hero = styled(motion.section)`
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  padding: 3rem 2rem;
  border-radius: 16px;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const NavigationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const NavigationSection = styled(motion.section)`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
`;

const SectionTitle = styled.h2`
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SectionIcon = styled.span`
  font-size: 1.8rem;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin-bottom: 1rem;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #4f46e5;
  text-decoration: none;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  
  &:hover {
    background: #f8f9ff;
    border-color: #e0e7ff;
    transform: translateX(5px);
  }
`;

const LinkIcon = styled.span`
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
`;

const LinkText = styled.span`
  font-weight: 500;
`;

const LinkDescription = styled.span`
  color: #666;
  font-size: 0.9rem;
  margin-left: auto;
`;

const SearchSection = styled.section`
  background: #f8f9fa;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 3rem;
`;

const SearchTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  text-align: center;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const SearchResults = styled.div`
  margin-top: 1rem;
`;

const SearchResult = styled(motion.div)`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  
  &:hover {
    border-color: #4f46e5;
  }
`;

const QuickLinksSection = styled.section`
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
`;

const QuickLinksTitle = styled.h3`
  margin-bottom: 2rem;
  font-size: 1.5rem;
`;

const QuickLinksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const QuickLinkCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const QuickLinkIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const QuickLinkTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const QuickLinkDesc = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const SiteNavigation = () => {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadNavigationContent();
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2) {
      performSearch(searchTerm);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadNavigationContent = async () => {
    try {
      setLoading(true);
      const response = await contentService.getPageBySlug('site-navigation');
      setPageContent(response.data);
    } catch (err) {
      console.error('Помилка завантаження навігації сайту:', err);
      setError('Не вдалося завантажити контент. Показуємо базову навігацію.');
      
      setPageContent({
        title: 'Навігація по сайту',
        content: getDefaultNavigationContent()
      });
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (term) => {
    try {
      // Симуляція пошуку
      const mockResults = [
        { title: 'Курс астрології', url: '/courses/astrology', description: 'Основи натальної астрології' },
        { title: 'Консультації', url: '/consultations', description: 'Персональні консультації' },
        { title: 'FAQ', url: '/base-knowledge/faq', description: 'Часті питання' }
      ].filter(item => 
        item.title.toLowerCase().includes(term.toLowerCase()) ||
        item.description.toLowerCase().includes(term.toLowerCase())
      );
      
      setSearchResults(mockResults);
    } catch (err) {
      console.error('Помилка пошуку:', err);
    }
  };

  const getDefaultNavigationContent = () => {
    return {
      blocks: [
        {
          type: 'text',
          content: '<h3>Карта сайту</h3><p>Тут ви знайдете всі розділи нашого сайту, організовані за категоріями для зручної навігації. Використовуйте пошук або переглядайте розділи нижче.</p>',
          alignment: 'center'
        }
      ]
    };
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Завантаження навігації...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Hero
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Title>Навігація по сайту</Title>
        <Subtitle>
          Знайдіть все, що вас цікавить - від курсів навчання до консультацій та магазину артефактів
        </Subtitle>
      </Hero>

      {error && (
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          color: '#856404',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <SearchSection>
        <SearchTitle>🔍 Швидкий пошук</SearchTitle>
        <SearchInput
          type="text"
          placeholder="Введіть що шукаєте..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchResults.length > 0 && (
          <SearchResults>
            {searchResults.map((result, index) => (
              <SearchResult
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => window.location.href = result.url}
              >
                <strong>{result.title}</strong>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>{result.description}</div>
              </SearchResult>
            ))}
          </SearchResults>
        )}
      </SearchSection>

      <RichTextRenderer 
        content={pageContent?.content || getDefaultNavigationContent()} 
        className="navigation-content"
      />

      <NavigationGrid>
        <NavigationSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SectionTitle>
            <SectionIcon>📚</SectionIcon>
            База знань
          </SectionTitle>
          <NavList>
            <NavItem>
              <NavLink to="/base-knowledge/faq">
                <LinkIcon>❓</LinkIcon>
                <LinkText>FAQ</LinkText>
                <LinkDescription>Часті питання (20 розділів)</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/base-knowledge/about">
                <LinkIcon>👨‍🏫</LinkIcon>
                <LinkText>Про майстра</LinkText>
                <LinkDescription>Біографія та досвід</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/base-knowledge/youtube">
                <LinkIcon>📺</LinkIcon>
                <LinkText>YouTube канал</LinkText>
                <LinkDescription>Відео уроки</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/base-knowledge/ask-author">
                <LinkIcon>💬</LinkIcon>
                <LinkText>Спитати автора</LinkText>
                <LinkDescription>Q&A з майстром</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/base-knowledge/city-of-gods">
                <LinkIcon>🏛️</LinkIcon>
                <LinkText>Технологія "Місто Богів"</LinkText>
                <LinkDescription>Унікальна методика</LinkDescription>
              </NavLink>
            </NavItem>
          </NavList>
        </NavigationSection>

        <NavigationSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <SectionTitle>
            <SectionIcon>🎓</SectionIcon>
            Навчання
          </SectionTitle>
          <NavList>
            <NavItem>
              <NavLink to="/courses/level-1">
                <LinkIcon>1️⃣</LinkIcon>
                <LinkText>1-й курс</LinkText>
                <LinkDescription>Основи</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/courses/level-2">
                <LinkIcon>2️⃣</LinkIcon>
                <LinkText>2-й курс</LinkText>
                <LinkDescription>Поглиблене вивчення</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/courses/level-3">
                <LinkIcon>3️⃣</LinkIcon>
                <LinkText>3-й курс</LinkText>
                <LinkDescription>Практичне застосування</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/courses/level-4">
                <LinkIcon>4️⃣</LinkIcon>
                <LinkText>4-й курс</LinkText>
                <LinkDescription>Майстерність</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/courses/program">
                <LinkIcon>📋</LinkIcon>
                <LinkText>Програма навчання</LinkText>
                <LinkDescription>Повний опис курсів</LinkDescription>
              </NavLink>
            </NavItem>
          </NavList>
        </NavigationSection>

        <NavigationSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <SectionTitle>
            <SectionIcon>🔮</SectionIcon>
            Сервіси
          </SectionTitle>
          <NavList>
            <NavItem>
              <NavLink to="/consultations">
                <LinkIcon>💫</LinkIcon>
                <LinkText>Консультації</LinkText>
                <LinkDescription>Персональні сесії</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/astro">
                <LinkIcon>⭐</LinkIcon>
                <LinkText>Астро калькулятор</LinkText>
                <LinkDescription>Натальні карти</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/workshop">
                <LinkIcon>🔨</LinkIcon>
                <LinkText>Майстерня</LinkText>
                <LinkDescription>Магазин артефактів</LinkDescription>
              </NavLink>
            </NavItem>
          </NavList>
        </NavigationSection>

        <NavigationSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <SectionTitle>
            <SectionIcon>👤</SectionIcon>
            Особистий кабінет
          </SectionTitle>
          <NavList>
            <NavItem>
              <NavLink to="/profile/courses">
                <LinkIcon>📖</LinkIcon>
                <LinkText>Мої курси</LinkText>
                <LinkDescription>Прогрес навчання</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/profile/settings">
                <LinkIcon>⚙️</LinkIcon>
                <LinkText>Налаштування</LinkText>
                <LinkDescription>Профіль користувача</LinkDescription>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink to="/profile/notifications">
                <LinkIcon>🔔</LinkIcon>
                <LinkText>Сповіщення</LinkText>
                <LinkDescription>Повідомлення системи</LinkDescription>
              </NavLink>
            </NavItem>
          </NavList>
        </NavigationSection>
      </NavigationGrid>

      <QuickLinksSection>
        <QuickLinksTitle>⚡ Швидкі посилання</QuickLinksTitle>
        <QuickLinksGrid>
          <QuickLinkCard
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.location.href = '/courses'}
          >
            <QuickLinkIcon>🚀</QuickLinkIcon>
            <QuickLinkTitle>Почати навчання</QuickLinkTitle>
            <QuickLinkDesc>Записатися на курс</QuickLinkDesc>
          </QuickLinkCard>

          <QuickLinkCard
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.location.href = '/consultations'}
          >
            <QuickLinkIcon>💎</QuickLinkIcon>
            <QuickLinkTitle>Консультація</QuickLinkTitle>
            <QuickLinkDesc>Замовити сесію</QuickLinkDesc>
          </QuickLinkCard>

          <QuickLinkCard
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.location.href = '/astro'}
          >
            <QuickLinkIcon>🌟</QuickLinkIcon>
            <QuickLinkTitle>Натальна карта</QuickLinkTitle>
            <QuickLinkDesc>Розрахувати зараз</QuickLinkDesc>
          </QuickLinkCard>

          <QuickLinkCard
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.location.href = '/workshop'}
          >
            <QuickLinkIcon>🛍️</QuickLinkIcon>
            <QuickLinkTitle>Магазин</QuickLinkTitle>
            <QuickLinkDesc>Артефакти та атрибутика</QuickLinkDesc>
          </QuickLinkCard>
        </QuickLinksGrid>
      </QuickLinksSection>
    </Container>
  );
};

export default SiteNavigation;