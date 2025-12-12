import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const CourseCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const CourseHeader = styled.div`
  background: ${props => props.gradient || 'linear-gradient(135deg, #6366f1, #8b5cf6)'};
  padding: 2rem;
  color: white;
  text-align: center;
`;

const CourseLevel = styled.div`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const CourseName = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
`;

const CourseBody = styled.div`
  padding: 1.5rem;
`;

const CourseDescription = styled.p`
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 0.95rem;
`;

const TabsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TabBadge = styled.span`
  background: #f3f4f6;
  color: #4b5563;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
`;

const CourseFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
`;

const Price = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
`;

const ViewButton = styled.button`
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const Timeline = styled.div`
  margin-top: 4rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #6366f1, #8b5cf6, #ec4899);
    border-radius: 2px;
    
    @media (max-width: 768px) {
      left: 20px;
    }
  }
`;

const TimelineItem = styled(motion.div)`
  display: flex;
  justify-content: ${props => props.align === 'right' ? 'flex-start' : 'flex-end'};
  padding: 2rem 0;
  position: relative;
  
  @media (max-width: 768px) {
    justify-content: flex-start;
    padding-left: 60px;
  }
`;

const TimelineContent = styled.div`
  width: 45%;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const TimelineDot = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: ${props => props.color || '#6366f1'};
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    left: 20px;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  
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

const CourseProgram = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const courseGradients = {
    1: 'linear-gradient(135deg, #667eea, #764ba2)',
    2: 'linear-gradient(135deg, #f093fb, #f5576c)',
    3: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    4: 'linear-gradient(135deg, #fa709a, #fee140)'
  };

  const courseDescriptions = {
    1: 'Вступний курс для початківців. Основи езотеричних знань, базові практики медитації та енергетичної роботи.',
    2: 'Поглиблене вивчення енергетичних практик, розширення свідомості та робота з тонкими енергіями.',
    3: 'Розвиток майстерності в різних напрямках езотеричних практик. Робота з архетипами та символами.',
    4: 'Експертний рівень. Підготовка до самостійної практики та можливість навчання інших.'
  };

  const defaultTabs = {
    1: ['Теорія', 'Практика', 'Екзамен'],
    2: ['Теорія', 'Практика', 'Вплив', 'Герої', 'Екзамен'],
    3: ['Теорія', 'Практика', 'Вплив', 'Герої', 'Екзамен'],
    4: ['Теорія', 'Практика', 'Вплив', 'Герої', 'Екзамен']
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getAllCourses();
        if (response.success && response.data?.length > 0) {
          setCourses(response.data);
        } else {
          // Fallback дані
          setCourses([
            { id: 1, level: 1, title: '1й Курс - Основи', price: 2500 },
            { id: 2, level: 2, title: '2й Курс - Поглиблення', price: 3500 },
            { id: 3, level: 3, title: '3й Курс - Майстерність', price: 4500 },
            { id: 4, level: 4, title: '4й Курс - Експертиза', price: 5500 }
          ]);
        }
      } catch (err) {
        console.error('Помилка завантаження курсів:', err);
        // Fallback дані
        setCourses([
          { id: 1, level: 1, title: '1й Курс - Основи', price: 2500 },
          { id: 2, level: 2, title: '2й Курс - Поглиблення', price: 3500 },
          { id: 3, level: 3, title: '3й Курс - Майстерність', price: 4500 },
          { id: 4, level: 4, title: '4й Курс - Експертиза', price: 5500 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = (level) => {
    navigate(`/courses/level-${level}`);
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Програма Навчання</Title>
        <Subtitle>
          Комплексна система навчання від основ до експертного рівня. 
          Кожен курс побудований на знаннях попереднього та веде до глибшого розуміння.
        </Subtitle>
      </Header>

      <CoursesGrid>
        {courses.map((course, index) => (
          <CourseCard
            key={course.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleCourseClick(course.level)}
          >
            <CourseHeader gradient={courseGradients[course.level]}>
              <CourseLevel>{course.level}</CourseLevel>
              <CourseName>{course.title}</CourseName>
            </CourseHeader>
            
            <CourseBody>
              <CourseDescription>
                {course.description || courseDescriptions[course.level]}
              </CourseDescription>
              
              <TabsList>
                {(defaultTabs[course.level] || []).map(tab => (
                  <TabBadge key={tab}>{tab}</TabBadge>
                ))}
              </TabsList>
              
              <CourseFooter>
                <Price>{course.price ? `${course.price} грн` : 'Безкоштовно'}</Price>
                <ViewButton>Детальніше</ViewButton>
              </CourseFooter>
            </CourseBody>
          </CourseCard>
        ))}
      </CoursesGrid>

      <Timeline>
        <TimelineItem align="left">
          <TimelineDot color="#667eea" />
          <TimelineContent>
            <h3>Етап 1: Основи</h3>
            <p>Знайомство з базовими концепціями, термінологією та першими практиками.</p>
          </TimelineContent>
        </TimelineItem>
        
        <TimelineItem align="right">
          <TimelineDot color="#f5576c" />
          <TimelineContent>
            <h3>Етап 2: Поглиблення</h3>
            <p>Розширення знань, робота з енергіями та розвиток інтуїції.</p>
          </TimelineContent>
        </TimelineItem>
        
        <TimelineItem align="left">
          <TimelineDot color="#00f2fe" />
          <TimelineContent>
            <h3>Етап 3: Майстерність</h3>
            <p>Освоєння складних технік, робота з архетипами та символами.</p>
          </TimelineContent>
        </TimelineItem>
        
        <TimelineItem align="right">
          <TimelineDot color="#fee140" />
          <TimelineContent>
            <h3>Етап 4: Експертиза</h3>
            <p>Досягнення майстерності та можливість передавати знання іншим.</p>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    </Container>
  );
};

export default CourseProgram;
