import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import courseService from '../../services/courseService';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #f0f0f0;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.active ? '#6366f1' : '#666'};
  border-bottom: 2px solid ${props => props.active ? '#6366f1' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #6366f1;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
`;

const TabContent = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-height: 400px;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ContentTitle = styled.h2`
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ContentCard = styled(motion.div)`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  border-left: 4px solid #6366f1;
`;

const CardTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.2rem;
`;

const CardContent = styled.div`
  color: #666;
  line-height: 1.6;
  
  ul {
    padding-left: 1.5rem;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
`;

const EnrollButton = styled(motion.button)`
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 2rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
`;

const ExamSubMenu = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ExamCard = styled(motion.div)`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 3px solid #f0f0f0;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #ef4444;
  
  h2 {
    margin-bottom: 1rem;
  }
  
  button {
    background: #6366f1;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 1rem;
    
    &:hover {
      background: #5558e3;
    }
  }
`;

const ProgressBar = styled.div`
  background: #e5e7eb;
  border-radius: 8px;
  height: 8px;
  margin-top: 1rem;
  overflow: hidden;
  
  div {
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    height: 100%;
    border-radius: 8px;
    transition: width 0.3s ease;
  }
`;

const EnrolledBadge = styled.span`
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-left: 1rem;
`;

const CourseLevel = () => {
  const { level } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('theory');
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  
  const { isAuthenticated } = useSelector(state => state.auth);

  // Статичні дані для fallback
  const fallbackCourseData = {
    '1': {
      title: '1й Курс - Основи',
      description: 'Вступний курс для початківців. Основи езотеричних знань та базові практики.',
      tabs: [
        { type: 'theory', name: 'Теорія' },
        { type: 'practice', name: 'Практика' },
        { type: 'exam', name: 'Екзамен' }
      ]
    },
    '2': {
      title: '2й Курс - Поглиблення',
      description: 'Поглиблене вивчення енергетичних практик та розширення свідомості.',
      tabs: [
        { type: 'theory', name: 'Теорія' },
        { type: 'practice', name: 'Практика' },
        { type: 'influence', name: 'Вплив' },
        { type: 'heroes', name: 'Герої' },
        { type: 'exam', name: 'Екзамен' }
      ]
    },
    '3': {
      title: '3й Курс - Майстерність',
      description: 'Розвиток майстерності в різних напрямках езотеричних практик.',
      tabs: [
        { type: 'theory', name: 'Теорія' },
        { type: 'practice', name: 'Практика' },
        { type: 'influence', name: 'Вплив' },
        { type: 'heroes', name: 'Герої' },
        { type: 'exam', name: 'Екзамен' }
      ]
    },
    '4': {
      title: '4й Курс - Експертиза',
      description: 'Експертний рівень. Підготовка до самостійної практики та навчання інших.',
      tabs: [
        { type: 'theory', name: 'Теорія' },
        { type: 'practice', name: 'Практика' },
        { type: 'influence', name: 'Вплив' },
        { type: 'heroes', name: 'Герої' },
        { type: 'exam', name: 'Екзамен' }
      ]
    }
  };

  const tabNames = {
    theory: 'Теорія',
    practice: 'Практика',
    influence: 'Вплив',
    heroes: 'Герої',
    exam: 'Екзамен'
  };

  // Завантаження даних курсу з API
  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await courseService.getCourseByLevel(level);
        if (response.success && response.data) {
          setCourse(response.data);
        } else {
          // Використовуємо fallback дані
          const fallback = fallbackCourseData[level];
          if (fallback) {
            setCourse({
              ...fallback,
              level: parseInt(level),
              isEnrolled: false,
              progress: 0
            });
          } else {
            setError('Курс не знайдено');
          }
        }
      } catch (err) {
        console.error('Помилка завантаження курсу:', err);
        // Використовуємо fallback дані при помилці
        const fallback = fallbackCourseData[level];
        if (fallback) {
          setCourse({
            ...fallback,
            level: parseInt(level),
            isEnrolled: false,
            progress: 0
          });
        } else {
          setError('Помилка завантаження курсу');
        }
      } finally {
        setLoading(false);
      }
    };

    if (level) {
      fetchCourse();
    }
  }, [level]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(`/courses/level-${level}`));
      return;
    }

    if (course?.isEnrolled) {
      navigate(`/courses/level-${level}/lessons`);
      return;
    }

    setEnrolling(true);
    try {
      const response = await courseService.enrollCourse(course.id);
      if (response.success) {
        setCourse(prev => ({ ...prev, isEnrolled: true }));
        navigate(`/courses/level-${level}/lessons`);
      }
    } catch (err) {
      console.error('Помилка запису на курс:', err);
      // Для демо - перенаправляємо на уроки
      navigate(`/courses/level-${level}/lessons`);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  if (error || !course) {
    return (
      <Container>
        <ErrorMessage>
          <h2>{error || 'Курс не знайдено'}</h2>
          <p>Спробуйте оновити сторінку або поверніться на головну</p>
          <button onClick={() => navigate('/')}>На головну</button>
        </ErrorMessage>
      </Container>
    );
  }

  const courseTabs = course.tabs || fallbackCourseData[level]?.tabs || [];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'theory':
        return (
          <div>
            <ContentTitle>Теоретична частина</ContentTitle>
            <ContentGrid>
              <ContentCard whileHover={{ y: -2 }}>
                <CardTitle>Основні концепції</CardTitle>
                <CardContent>
                  <ul>
                    <li>Історія та філософія</li>
                    <li>Базові принципи</li>
                    <li>Термінологія</li>
                    <li>Етичні аспекти</li>
                  </ul>
                </CardContent>
              </ContentCard>
              
              <ContentCard whileHover={{ y: -2 }}>
                <CardTitle>Теоретичні основи</CardTitle>
                <CardContent>
                  <ul>
                    <li>Енергетична анатомія</li>
                    <li>Чакральна система</li>
                    <li>Астральні плани</li>
                    <li>Кармічні закони</li>
                  </ul>
                </CardContent>
              </ContentCard>
            </ContentGrid>
          </div>
        );
        
      case 'practice':
        return (
          <div>
            <ContentTitle>Практичні заняття</ContentTitle>
            <ContentGrid>
              <ContentCard whileHover={{ y: -2 }}>
                <CardTitle>Медитативні практики</CardTitle>
                <CardContent>
                  <ul>
                    <li>Базові техніки медитації</li>
                    <li>Візуалізація</li>
                    <li>Дихальні вправи</li>
                    <li>Концентрація уваги</li>
                  </ul>
                </CardContent>
              </ContentCard>
              
              <ContentCard whileHover={{ y: -2 }}>
                <CardTitle>Енергетичні вправи</CardTitle>
                <CardContent>
                  <ul>
                    <li>Робота з чакрами</li>
                    <li>Очищення ауры</li>
                    <li>Захисні техніки</li>
                    <li>Енергетичне цілительство</li>
                  </ul>
                </CardContent>
              </ContentCard>
            </ContentGrid>
          </div>
        );
        
      case 'influence':
        return (
          <div>
            <ContentTitle>Вплив та Трансформація</ContentTitle>
            <ContentGrid>
              <ContentCard whileHover={{ y: -2 }}>
                <CardTitle>Особистісна трансформація</CardTitle>
                <CardContent>
                  <p>Вивчення методів глибокої особистісної трансформації через езотеричні практики.</p>
                </CardContent>
              </ContentCard>
              
              <ContentCard whileHover={{ y: -2 }}>
                <CardTitle>Вплив на реальність</CardTitle>
                <CardContent>
                  <p>Техніки маніфестації та створення бажаної реальності через свідомість.</p>
                </CardContent>
              </ContentCard>
            </ContentGrid>
          </div>
        );
        
      case 'heroes':
        return (
          <div>
            <ContentTitle>Герої та Архетипи</ContentTitle>
            <ContentGrid>
              <ContentCard whileHover={{ y: -2 }}>
                <CardTitle>Архетипічні образи</CardTitle>
                <CardContent>
                  <p>Вивчення архетипів та їх роль у духовному розвитку.</p>
                </CardContent>
              </ContentCard>
              
              <ContentCard whileHover={{ y: -2 }}>
                <CardTitle>Видатні особистості</CardTitle>
                <CardContent>
                  <p>Біографії та вчення великих майстрів минулого та сучасності.</p>
                </CardContent>
              </ContentCard>
            </ContentGrid>
          </div>
        );
        
      case 'exam':
        return (
          <div>
            <ContentTitle>Екзаменаційна частина</ContentTitle>
            {level === '3' ? (
              <ExamSubMenu>
                <ExamCard whileHover={{ y: -2 }}>
                  <h3>Мечі</h3>
                  <p>Інтелектуальні аспекти</p>
                </ExamCard>
                <ExamCard whileHover={{ y: -2 }}>
                  <h3>Чаші</h3>
                  <p>Емоційні аспекти</p>
                </ExamCard>
                <ExamCard whileHover={{ y: -2 }}>
                  <h3>Пентаклі</h3>
                  <p>Матеріальні аспекти</p>
                </ExamCard>
                <ExamCard whileHover={{ y: -2 }}>
                  <h3>Жезли</h3>
                  <p>Духовні аспекти</p>
                </ExamCard>
              </ExamSubMenu>
            ) : (
              <ContentGrid>
                <ContentCard whileHover={{ y: -2 }}>
                  <CardTitle>Теоретичний екзамен</CardTitle>
                  <CardContent>
                    <p>Перевірка засвоєння теоретичного матеріалу курсу.</p>
                  </CardContent>
                </ContentCard>
                
                <ContentCard whileHover={{ y: -2 }}>
                  <CardTitle>Практичне завдання</CardTitle>
                  <CardContent>
                    <p>Демонстрація практичних навичок та вмінь.</p>
                  </CardContent>
                </ContentCard>
              </ContentGrid>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          {course.title}
          {course.isEnrolled && <EnrolledBadge>Записано</EnrolledBadge>}
        </Title>
        <Description>{course.description}</Description>
        {course.isEnrolled && course.progress > 0 && (
          <ProgressBar>
            <div style={{ width: `${course.progress}%` }} />
          </ProgressBar>
        )}
      </Header>

      <TabsContainer>
        {courseTabs.map(tab => (
          <Tab
            key={tab.type || tab}
            active={activeTab === (tab.type || tab)}
            onClick={() => setActiveTab(tab.type || tab)}
          >
            {tab.name || tabNames[tab] || tab}
          </Tab>
        ))}
      </TabsContainer>

      <AnimatePresence mode="wait">
        <TabContent
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
          
          <EnrollButton
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? 'Завантаження...' : 
             course.isEnrolled ? 'Перейти до уроків' : 'Записатися на курс'}
          </EnrollButton>
        </TabContent>
      </AnimatePresence>
    </Container>
  );
};

export default CourseLevel;