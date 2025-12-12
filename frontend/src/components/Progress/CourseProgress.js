import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  Award,
  TrendingUp 
} from 'lucide-react';
import progressService from '../../services/progressService';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const CourseInfo = styled.div`
  h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.25rem;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
`;

const ProgressBadge = styled.div`
  background: ${props => props.color || '#6366f1'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressBarContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const ProgressBarLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  span {
    font-size: 0.9rem;
    color: #666;
  }
  
  .percentage {
    font-weight: 600;
    color: #333;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, ${props => props.color || '#6366f1'}, ${props => props.color || '#8b5cf6'});
  border-radius: 4px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  
  .icon {
    color: #6366f1;
    margin-bottom: 0.5rem;
  }
  
  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .label {
    font-size: 0.8rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const LessonsProgress = styled.div`
  h4 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const LessonItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: ${props => props.completed ? '#f0fdf4' : '#f8f9fa'};
  border: 1px solid ${props => props.completed ? '#bbf7d0' : '#e5e7eb'};
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.completed ? '#ecfdf5' : '#f3f4f6'};
  }
`;

const LessonIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.completed ? '#10b981' : '#6366f1'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
`;

const LessonInfo = styled.div`
  flex: 1;
  
  .title {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .progress {
    font-size: 0.8rem;
    color: #666;
  }
`;

const LessonProgress = styled.div`
  text-align: right;
  
  .percentage {
    font-weight: 600;
    color: ${props => props.completed ? '#10b981' : '#6366f1'};
    font-size: 0.9rem;
  }
  
  .time {
    font-size: 0.75rem;
    color: #666;
    margin-top: 0.25rem;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  &::after {
    content: '';
    width: 32px;
    height: 32px;
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
  padding: 2rem;
  color: #ef4444;
  
  button {
    background: #6366f1;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 1rem;
    
    &:hover {
      background: #5558e3;
    }
  }
`;

const CourseProgress = ({ courseId, courseTitle, courseLevel }) => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (courseId) {
      fetchProgressData();
    }
  }, [courseId]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await progressService.getCourseProgress(courseId);
      setProgressData(response.data);
    } catch (err) {
      console.error('Помилка завантаження прогресу курсу:', err);
      setError('Не вдалося завантажити прогрес курсу');
    } finally {
      setLoading(false);
    }
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
          <p>{error}</p>
          <button onClick={fetchProgressData}>Спробувати знову</button>
        </ErrorMessage>
      </Container>
    );
  }

  if (!progressData) {
    return null;
  }

  const { course_progress, lessons_progress } = progressData;
  const progressColor = progressService.getProgressColor(course_progress.completion_percentage);
  const statusText = progressService.getProgressStatusText(course_progress.completion_percentage);

  return (
    <Container>
      <Header>
        <CourseInfo>
          <h3>{courseTitle || `Курс ${courseLevel} рівня`}</h3>
          <p>Загальний прогрес навчання</p>
        </CourseInfo>
        
        <ProgressBadge color={progressColor}>
          {course_progress.completion_percentage >= 100 ? (
            <Award size={16} />
          ) : (
            <TrendingUp size={16} />
          )}
          {statusText}
        </ProgressBadge>
      </Header>

      <ProgressBarContainer>
        <ProgressBarLabel>
          <span>Прогрес курсу</span>
          <span className="percentage">{course_progress.completion_percentage}%</span>
        </ProgressBarLabel>
        
        <ProgressBar>
          <ProgressFill
            color={progressColor}
            initial={{ width: 0 }}
            animate={{ width: `${course_progress.completion_percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </ProgressBar>
      </ProgressBarContainer>

      <StatsGrid>
        <StatCard>
          <div className="icon">
            <BookOpen size={24} />
          </div>
          <div className="value">{course_progress.completed_lessons}</div>
          <div className="label">Завершено уроків</div>
        </StatCard>
        
        <StatCard>
          <div className="icon">
            <PlayCircle size={24} />
          </div>
          <div className="value">{course_progress.total_lessons}</div>
          <div className="label">Всього уроків</div>
        </StatCard>
        
        <StatCard>
          <div className="icon">
            <Clock size={24} />
          </div>
          <div className="value">{progressService.formatLearningTime(course_progress.total_time_spent)}</div>
          <div className="label">Час навчання</div>
        </StatCard>
        
        <StatCard>
          <div className="icon">
            <TrendingUp size={24} />
          </div>
          <div className="value">{course_progress.average_progress}%</div>
          <div className="label">Середній прогрес</div>
        </StatCard>
      </StatsGrid>

      {lessons_progress && lessons_progress.length > 0 && (
        <LessonsProgress>
          <h4>
            <BookOpen size={18} />
            Прогрес по урокам
          </h4>
          
          {lessons_progress.map((lesson) => (
            <LessonItem key={lesson.id} completed={lesson.is_completed}>
              <LessonIcon completed={lesson.is_completed}>
                {lesson.is_completed ? (
                  <CheckCircle size={18} />
                ) : (
                  <PlayCircle size={18} />
                )}
              </LessonIcon>
              
              <LessonInfo>
                <div className="title">{lesson.lesson_title || `Урок ${lesson.lesson_id}`}</div>
                <div className="progress">
                  {lesson.is_completed ? 'Завершено' : `Прогрес: ${lesson.progress_percentage}%`}
                </div>
              </LessonInfo>
              
              <LessonProgress completed={lesson.is_completed}>
                <div className="percentage">
                  {lesson.progress_percentage}%
                </div>
                {lesson.time_spent_minutes > 0 && (
                  <div className="time">
                    {lesson.formatted_time_spent}
                  </div>
                )}
              </LessonProgress>
            </LessonItem>
          ))}
        </LessonsProgress>
      )}
    </Container>
  );
};

export default CourseProgress;