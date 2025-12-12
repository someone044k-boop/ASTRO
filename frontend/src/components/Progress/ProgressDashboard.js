import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Calendar,
  Target,
  Activity,
  Users
} from 'lucide-react';
import progressService from '../../services/progressService';
import CourseProgress from './CourseProgress';

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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color || '#6366f1'};
  }
  
  .icon {
    width: 64px;
    height: 64px;
    background: ${props => props.color || '#6366f1'};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: white;
  }
  
  .value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .label {
    font-size: 1rem;
    color: #666;
    margin-bottom: 0.5rem;
  }
  
  .description {
    font-size: 0.85rem;
    color: #888;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const RecentActivity = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ActivityList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: background 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ActivityIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.color || '#6366f1'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
  
  .title {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .description {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.25rem;
  }
  
  .time {
    font-size: 0.8rem;
    color: #888;
  }
`;

const ActivityProgress = styled.div`
  text-align: right;
  
  .percentage {
    font-weight: 600;
    color: ${props => props.completed ? '#10b981' : '#6366f1'};
    font-size: 0.9rem;
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
  padding: 3rem;
  color: #666;
  
  .icon {
    width: 64px;
    height: 64px;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: #9ca3af;
  }
  
  h3 {
    margin-bottom: 0.5rem;
    color: #374151;
  }
  
  p {
    margin-bottom: 1.5rem;
  }
  
  button {
    background: #6366f1;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    
    &:hover {
      background: #5558e3;
    }
  }
`;

const ProgressDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await progressService.getProgressDashboard();
      setDashboardData(response.data);
    } catch (err) {
      console.error('Помилка завантаження дашборду:', err);
      setError('Не вдалося завантажити дані прогресу');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <button onClick={fetchDashboardData}>Спробувати знову</button>
        </ErrorMessage>
      </Container>
    );
  }

  if (!dashboardData || dashboardData.enrolled_courses.length === 0) {
    return (
      <Container>
        <Header>
          <h1>Мій прогрес навчання</h1>
          <p>Відстежуйте свій прогрес та досягнення в навчанні</p>
        </Header>
        
        <EmptyState>
          <div className="icon">
            <BookOpen size={32} />
          </div>
          <h3>Ви ще не записані на жоден курс</h3>
          <p>Почніть своє навчання, записавшись на один з наших курсів</p>
          <button onClick={() => window.location.href = '/courses'}>
            Переглянути курси
          </button>
        </EmptyState>
      </Container>
    );
  }

  const { enrolled_courses, learning_stats, recent_activity } = dashboardData;

  return (
    <Container>
      <Header>
        <h1>Мій прогрес навчання</h1>
        <p>Відстежуйте свій прогрес та досягнення в навчанні</p>
      </Header>

      <StatsOverview>
        <StatCard
          color="#6366f1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="icon">
            <BookOpen size={32} />
          </div>
          <div className="value">{learning_stats.enrolled_courses}</div>
          <div className="label">Записаних курсів</div>
          <div className="description">Активні курси навчання</div>
        </StatCard>

        <StatCard
          color="#10b981"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="icon">
            <Award size={32} />
          </div>
          <div className="value">{learning_stats.total_lessons_completed}</div>
          <div className="label">Завершених уроків</div>
          <div className="description">З {learning_stats.total_lessons_started} розпочатих</div>
        </StatCard>

        <StatCard
          color="#f59e0b"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="icon">
            <Clock size={32} />
          </div>
          <div className="value">{progressService.formatLearningTime(learning_stats.total_learning_time)}</div>
          <div className="label">Час навчання</div>
          <div className="description">Загальний час вивчення</div>
        </StatCard>

        <StatCard
          color="#8b5cf6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="icon">
            <TrendingUp size={32} />
          </div>
          <div className="value">{learning_stats.completion_rate}%</div>
          <div className="label">Рівень завершення</div>
          <div className="description">Середній показник</div>
        </StatCard>
      </StatsOverview>

      <SectionTitle>
        <Target size={24} />
        Мої курси
      </SectionTitle>

      <CoursesGrid>
        {enrolled_courses.map((course) => (
          <CourseProgress
            key={course.course_id}
            courseId={course.course_id}
            courseTitle={course.title}
            courseLevel={course.level}
          />
        ))}
      </CoursesGrid>

      {recent_activity && recent_activity.length > 0 && (
        <RecentActivity>
          <SectionTitle>
            <Activity size={24} />
            Остання активність
          </SectionTitle>

          <ActivityList>
            {recent_activity.map((activity, index) => (
              <ActivityItem key={activity.id || index}>
                <ActivityIcon color={activity.is_completed ? '#10b981' : '#6366f1'}>
                  {activity.is_completed ? (
                    <Award size={20} />
                  ) : (
                    <BookOpen size={20} />
                  )}
                </ActivityIcon>

                <ActivityContent>
                  <div className="title">{activity.lesson_title}</div>
                  <div className="description">
                    {activity.course_title} • {activity.course_level} рівень
                  </div>
                  <div className="time">
                    {formatDate(activity.updated_at)}
                  </div>
                </ActivityContent>

                <ActivityProgress completed={activity.is_completed}>
                  <div className="percentage">
                    {activity.progress_percentage}%
                  </div>
                </ActivityProgress>
              </ActivityItem>
            ))}
          </ActivityList>
        </RecentActivity>
      )}
    </Container>
  );
};

export default ProgressDashboard;