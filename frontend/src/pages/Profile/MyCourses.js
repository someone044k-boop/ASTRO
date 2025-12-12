import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Award, 
  PlayCircle, 
  CheckCircle,
  TrendingUp,
  Calendar,
  ArrowRight
} from 'lucide-react';
import courseService from '../../services/courseService';
import progressService from '../../services/progressService';

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
  
  h1 {
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 1rem;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }
  
  p {
    font-size: 1.1rem;
    color: #666;
    max-width: 600px;
    margin: 0 auto;
  }
`;

const StatsOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled(motion.div)`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  
  .icon {
    width: 48px;
    height: 48px;
    background: ${props => props.color || '#6366f1'};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: white;
  }
  
  .value {
    font-size: 2rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .label {
    font-size: 0.9rem;
    color: #666;
  }
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CourseCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const CourseHeader = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  
  .level {
    font-size: 0.8rem;
    opacity: 0.9;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  .enrolled-date {
    font-size: 0.85rem;
    opacity: 0.8;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
`;

const CourseBody = styled.div`
  padding: 1.5rem;
`;

const ProgressSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  
  .label {
    font-weight: 600;
    color: #333;
  }
  
  .percentage {
    font-weight: 700;
    color: ${props => props.color || '#6366f1'};
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, ${props => props.color || '#6366f1'}, ${props => props.color || '#8b5cf6'});
  border-radius: 4px;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatItem = styled.div`
  text-align: center;
  
  .icon {
    color: #6366f1;
    margin-bottom: 0.25rem;
  }
  
  .value {
    font-weight: 600;
    color: #333;
    font-size: 0.9rem;
  }
  
  .label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled(motion.button)`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &.primary {
    background: #6366f1;
    color: white;
    
    &:hover {
      background: #5558e3;
    }
  }
  
  &.secondary {
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  
  &::after {
    content: '';
    width: 48px;
    height: 48px;
    border: 4px solid #f0f0f0;
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
  
  h3 {
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

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
  
  .icon {
    width: 80px;
    height: 80px;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 2rem;
    color: #9ca3af;
  }
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #374151;
  }
  
  p {
    margin-bottom: 2rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
  
  button {
    background: #6366f1;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    
    &:hover {
      background: #5558e3;
    }
  }
`;

const MyCourses = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchMyCoursesData();
    }
  }, [user]);

  const fetchMyCoursesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Отримуємо дані дашборду прогресу
      const dashboardResponse = await progressService.getProgressDashboard();
      const { enrolled_courses, learning_stats } = dashboardResponse.data;
      
      setCourses(enrolled_courses);
      setStats(learning_stats);
    } catch (err) {
      console.error('Помилка завантаження курсів:', err);
      setError('Не вдалося завантажити ваші курси');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const continueCourse = (course) => {
    // Перехід до останнього уроку або першого незавершеного
    navigate(`/courses/level-${course.level}/lessons`);
  };

  const viewCourseDetails = (course) => {
    navigate(`/courses/level-${course.level}`);
  };

  if (!user) {
    return (
      <Container>
        <EmptyState>
          <div className="icon">
            <BookOpen size={40} />
          </div>
          <h3>Увійдіть в систему</h3>
          <p>Щоб переглянути свої курси, потрібно увійти в систему</p>
          <button onClick={() => navigate('/auth')}>
            Увійти
          </button>
        </EmptyState>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>
          <h3>Помилка завантаження</h3>
          <p>{error}</p>
          <button onClick={fetchMyCoursesData}>Спробувати знову</button>
        </ErrorMessage>
      </Container>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <Container>
        <Header>
          <h1>Мої курси</h1>
          <p>Ваші записані курси та прогрес навчання</p>
        </Header>
        
        <EmptyState>
          <div className="icon">
            <BookOpen size={40} />
          </div>
          <h3>У вас ще немає курсів</h3>
          <p>Почніть своє навчання, записавшись на один з наших курсів</p>
          <button onClick={() => navigate('/courses')}>
            Переглянути курси
          </button>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1>Мої курси</h1>
        <p>Ваші записані курси та прогрес навчання</p>
      </Header>

      {stats && (
        <StatsOverview>
          <StatCard
            color="#6366f1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="icon">
              <BookOpen size={24} />
            </div>
            <div className="value">{stats.enrolled_courses}</div>
            <div className="label">Активних курсів</div>
          </StatCard>

          <StatCard
            color="#10b981"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="icon">
              <Award size={24} />
            </div>
            <div className="value">{stats.total_lessons_completed}</div>
            <div className="label">Завершених уроків</div>
          </StatCard>

          <StatCard
            color="#f59e0b"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="icon">
              <Clock size={24} />
            </div>
            <div className="value">{progressService.formatLearningTime(stats.total_learning_time)}</div>
            <div className="label">Час навчання</div>
          </StatCard>

          <StatCard
            color="#8b5cf6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="icon">
              <TrendingUp size={24} />
            </div>
            <div className="value">{stats.completion_rate}%</div>
            <div className="label">Рівень завершення</div>
          </StatCard>
        </StatsOverview>
      )}

      <CoursesGrid>
        {courses.map((course, index) => {
          const progressColor = progressService.getProgressColor(course.progress_percentage);
          const detailedProgress = course.detailed_progress;
          
          return (
            <CourseCard
              key={course.course_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CourseHeader>
                <div className="level">{course.level} рівень</div>
                <div className="title">{course.title}</div>
                <div className="enrolled-date">
                  <Calendar size={14} />
                  Записано {formatDate(course.enrolled_at)}
                </div>
              </CourseHeader>

              <CourseBody>
                <ProgressSection>
                  <ProgressHeader color={progressColor}>
                    <span className="label">Прогрес курсу</span>
                    <span className="percentage">{course.progress_percentage}%</span>
                  </ProgressHeader>
                  
                  <ProgressBar>
                    <ProgressFill
                      color={progressColor}
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress_percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </ProgressBar>
                </ProgressSection>

                {detailedProgress && (
                  <StatsRow>
                    <StatItem>
                      <div className="icon">
                        <CheckCircle size={16} />
                      </div>
                      <div className="value">{detailedProgress.completed_lessons}</div>
                      <div className="label">Завершено</div>
                    </StatItem>
                    
                    <StatItem>
                      <div className="icon">
                        <PlayCircle size={16} />
                      </div>
                      <div className="value">{detailedProgress.total_lessons}</div>
                      <div className="label">Всього</div>
                    </StatItem>
                    
                    <StatItem>
                      <div className="icon">
                        <Clock size={16} />
                      </div>
                      <div className="value">{progressService.formatLearningTime(detailedProgress.total_time_spent)}</div>
                      <div className="label">Час</div>
                    </StatItem>
                  </StatsRow>
                )}

                <ActionButtons>
                  <Button
                    className="primary"
                    onClick={() => continueCourse(course)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PlayCircle size={16} />
                    Продовжити
                  </Button>
                  
                  <Button
                    className="secondary"
                    onClick={() => viewCourseDetails(course)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowRight size={16} />
                    Деталі
                  </Button>
                </ActionButtons>
              </CourseBody>
            </CourseCard>
          );
        })}
      </CoursesGrid>
    </Container>
  );
};

export default MyCourses;