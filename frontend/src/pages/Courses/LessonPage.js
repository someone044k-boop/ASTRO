import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import LessonPlayer from '../../components/Lesson/LessonPlayer';
import courseService from '../../services/courseService';
import progressService from '../../services/progressService';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
`;

const BackButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const LessonInfo = styled.div`
  flex: 1;
  margin: 0 2rem;
  
  @media (max-width: 768px) {
    margin: 0;
    width: 100%;
  }
  
  h1 {
    margin: 0;
    color: #333;
    font-size: 1.5rem;
    
    @media (max-width: 768px) {
      font-size: 1.25rem;
    }
  }
  
  p {
    margin: 0.5rem 0 0 0;
    color: #666;
    font-size: 0.9rem;
  }
`;

const ProgressInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const ProgressBadge = styled.div`
  background: ${props => props.completed ? '#10b981' : '#6366f1'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CompletionModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  
  .icon {
    width: 64px;
    height: 64px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: white;
  }
  
  h2 {
    color: #333;
    margin-bottom: 1rem;
  }
  
  p {
    color: #666;
    margin-bottom: 2rem;
    line-height: 1.6;
  }
  
  .buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    
    @media (max-width: 480px) {
      flex-direction: column;
    }
    
    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      
      &.primary {
        background: #6366f1;
        color: white;
        
        &:hover {
          background: #5558e3;
        }
      }
      
      &.secondary {
        background: #f3f4f6;
        color: #333;
        
        &:hover {
          background: #e5e7eb;
        }
      }
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  
  .spinner {
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

const ErrorContainer = styled.div`
  text-align: center;
  padding: 3rem;
  
  h2 {
    color: #ef4444;
    margin-bottom: 1rem;
  }
  
  p {
    color: #666;
    margin-bottom: 2rem;
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

const LessonPage = () => {
  const { level, lessonId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  const { user } = useSelector(state => state.auth);

  // Демо дані для уроків
  const demoLessons = {
    '1': {
      '1': {
        id: '1',
        title: 'Вступ до езотеричних знань',
        description: 'Перший урок курсу - основи та базові поняття',
        slides: [
          {
            title: 'Добро пожалувати!',
            content: `
              <p>Ласкаво просимо до першого уроку курсу езотеричних знань!</p>
              <p>У цьому уроці ми розглянемо:</p>
              <ul>
                <li>Основні поняття та термінологію</li>
                <li>Історичний контекст</li>
                <li>Базові принципи</li>
                <li>Практичні застосування</li>
              </ul>
            `
          },
          {
            title: 'Історія езотеризму',
            content: `
              <p>Езотеричні знання мають давню історію, що сягає тисячоліть.</p>
              <p>Основні етапи розвитку:</p>
              <ul>
                <li>Стародавні цивілізації</li>
                <li>Середньовічні традиції</li>
                <li>Епоха Відродження</li>
                <li>Сучасні течії</li>
              </ul>
            `
          },
          {
            title: 'Базові принципи',
            content: `
              <p>Фундаментальні принципи езотеричних практик:</p>
              <ul>
                <li><strong>Принцип відповідності:</strong> "Як вгорі, так і внизу"</li>
                <li><strong>Принцип вібрації:</strong> Все рухається і вібрує</li>
                <li><strong>Принцип полярності:</strong> Все має свою протилежність</li>
                <li><strong>Принцип ритму:</strong> Все має свій приплив і відплив</li>
              </ul>
            `
          },
          {
            title: 'Практичне застосування',
            content: `
              <p>Як застосовувати отримані знання в повсякденному житті:</p>
              <ul>
                <li>Медитативні практики</li>
                <li>Робота з енергією</li>
                <li>Розвиток інтуїції</li>
                <li>Гармонізація життя</li>
              </ul>
              <p>Пам'ятайте: теорія без практики - це лише інформація!</p>
            `
          }
        ],
        audioUrl: '/audio/lesson-1-1.mp3', // Демо URL
        duration: 15 // хвилин
      }
    }
  };

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Спробуємо завантажити з API
        const response = await courseService.getLesson(lessonId);
        if (response.success && response.data) {
          setLesson(response.data);
        } else {
          // Використовуємо демо дані
          const demoLesson = demoLessons[level]?.[lessonId];
          if (demoLesson) {
            setLesson(demoLesson);
          } else {
            setError('Урок не знайдено');
          }
        }
      } catch (err) {
        console.error('Помилка завантаження уроку:', err);
        // Використовуємо демо дані при помилці
        const demoLesson = demoLessons[level]?.[lessonId];
        if (demoLesson) {
          setLesson(demoLesson);
        } else {
          setError('Помилка завантаження уроку');
        }
      } finally {
        setLoading(false);
      }
    };

    if (level && lessonId) {
      fetchLesson();
    }
  }, [level, lessonId]);

  const handleProgress = (progressValue) => {
    setProgress(progressValue);
    // Прогрес автоматично зберігається в LessonPlayer через progressService
  };

  const handleComplete = () => {
    setCompleted(true);
    setShowCompletionModal(true);
    
    // Завершення автоматично обробляється в LessonPlayer через progressService
    console.log('Урок завершено:', lesson.title);
  };

  const handleNextLesson = () => {
    setShowCompletionModal(false);
    // Логіка переходу до наступного уроку
    const nextLessonId = parseInt(lessonId) + 1;
    navigate(`/courses/level-${level}/lesson/${nextLessonId}`);
  };

  const handleBackToCourse = () => {
    navigate(`/courses/level-${level}`);
  };

  const goBackToCourse = () => {
    navigate(`/courses/level-${level}`);
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <div className="spinner" />
        </LoadingContainer>
      </Container>
    );
  }

  if (error || !lesson) {
    return (
      <Container>
        <ErrorContainer>
          <h2>{error || 'Урок не знайдено'}</h2>
          <p>Спробуйте оновити сторінку або поверніться до курсу</p>
          <button onClick={goBackToCourse}>Повернутися до курсу</button>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton
          onClick={goBackToCourse}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft size={20} />
          Назад до курсу
        </BackButton>
        
        <LessonInfo>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
        </LessonInfo>
        
        <ProgressInfo>
          <ProgressBadge completed={completed}>
            {completed && <CheckCircle size={16} />}
            {completed ? 'Завершено' : `${Math.round(progress)}%`}
          </ProgressBadge>
        </ProgressInfo>
      </Header>

      <LessonPlayer
        slides={lesson.slides || []}
        audioUrl={lesson.audioUrl}
        onProgress={handleProgress}
        onComplete={handleComplete}
        initialSlide={0}
        lessonId={lessonId}
        courseId={lesson.course_id}
        autoSaveProgress={!!user}
      />

      {showCompletionModal && (
        <CompletionModal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ModalContent
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="icon">
              <CheckCircle size={32} />
            </div>
            
            <h2>Вітаємо!</h2>
            <p>
              Ви успішно завершили урок "{lesson.title}". 
              Ваш прогрес збережено і ви можете переходити до наступного уроку 
              або повернутися до огляду курсу.
            </p>
            
            <div className="buttons">
              <button 
                className="secondary"
                onClick={handleBackToCourse}
              >
                Повернутися до курсу
              </button>
              <button 
                className="primary"
                onClick={handleNextLesson}
              >
                Наступний урок
              </button>
            </div>
          </ModalContent>
        </CompletionModal>
      )}
    </Container>
  );
};

export default LessonPage;