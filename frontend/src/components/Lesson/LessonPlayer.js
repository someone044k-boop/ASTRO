import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import progressService from '../../services/progressService';
import { useProgress } from '../../hooks/useProgress';

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: #f8f9fa;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => !['$isOpen', 'initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'isOpen', 'show'].includes(prop)
})`
  width: 300px;
  background: white;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    width: 100%;
    height: ${props => props.$isOpen ? '300px' : '0'};
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    overflow: hidden;
  }
`;

const SidebarHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    color: #333;
    font-size: 1.1rem;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 1rem;
  }
`;

const SlideList = styled.div`
  padding: 1rem;
`;

const SlideItem = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => !['$active', 'whileHover', 'whileTap', 'initial', 'animate', 'exit', 'transition'].includes(prop)
})`
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  background: ${props => props.$active ? '#6366f1' : '#f8f9fa'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: 1px solid ${props => props.$active ? '#6366f1' : '#e5e7eb'};
  
  &:hover {
    background: ${props => props.$active ? '#5558e3' : '#e5e7eb'};
  }
  
  .slide-number {
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .slide-title {
    font-size: 0.85rem;
    margin-top: 0.25rem;
    opacity: 0.9;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const SlideContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Slide = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => !['initial', 'animate', 'exit', 'transition', 'key'].includes(prop)
})`
  width: 100%;
  max-width: 800px;
  aspect-ratio: 4/3;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 1rem;
    aspect-ratio: auto;
    min-height: 400px;
  }
`;

const SlideContent = styled.div`
  h1, h2, h3 {
    color: #333;
    margin-bottom: 1rem;
  }
  
  p {
    color: #666;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  ul, ol {
    padding-left: 1.5rem;
    color: #666;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
`;

const NavigationControls = styled.div`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 1rem;
  pointer-events: none;
`;

const NavButton = styled(motion.button).withConfig({
  shouldForwardProp: (prop) => !['whileHover', 'whileTap', 'initial', 'animate', 'exit', 'transition'].includes(prop)
})`
  background: rgba(99, 102, 241, 0.9);
  color: white;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: all;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const AudioPlayerContainer = styled.div`
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const AudioControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

const PlayButton = styled(motion.button).withConfig({
  shouldForwardProp: (prop) => !['whileHover', 'whileTap', 'initial', 'animate', 'exit', 'transition'].includes(prop)
})`
  background: #6366f1;
  color: white;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  button {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0.5rem;
  }
`;

const VolumeSlider = styled.input`
  width: 80px;
  
  @media (max-width: 768px) {
    width: 60px;
  }
`;

const SpeedControl = styled.select`
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  position: relative;
  cursor: pointer;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 3px;
    transition: width 0.1s ease;
  }
  
  .progress-handle {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    background: #6366f1;
    border-radius: 50%;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover .progress-handle {
    opacity: 1;
  }
`;

const TimeDisplay = styled.div`
  font-size: 0.9rem;
  color: #666;
  min-width: 100px;
  text-align: center;
  
  @media (max-width: 768px) {
    min-width: auto;
  }
`;

const SlideInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    justify-content: center;
    margin-bottom: 1rem;
  }
`;

const FullscreenButton = styled(motion.button).withConfig({
  shouldForwardProp: (prop) => !['whileHover', 'whileTap', 'initial', 'animate', 'exit', 'transition'].includes(prop)
})`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const FullscreenOverlay = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => !['initial', 'animate', 'exit', 'transition'].includes(prop)
})`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const FullscreenSlide = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  .slide-content {
    width: 100%;
    max-width: 1200px;
    background: white;
    border-radius: 12px;
    padding: 3rem;
    max-height: 80vh;
    overflow-y: auto;
    
    @media (max-width: 768px) {
      padding: 1.5rem;
      max-height: 70vh;
    }
  }
`;

const FullscreenControls = styled.div`
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
`;

const LessonProgressBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  .progress {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    transition: width 0.3s ease;
  }
`;

const SyncStatus = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isOnline', '$pendingChanges', '$show'].includes(prop)
})`
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: ${props => {
    if (!props.$isOnline) return '#ef4444';
    if (props.$pendingChanges) return '#f59e0b';
    return '#10b981';
  }};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: ${props => props.$show ? 1 : 0};
  transition: opacity 0.3s ease;
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    animation: ${props => props.$pendingChanges ? 'pulse 1.5s infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const CompletionModal = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => !['initial', 'animate', 'exit', 'transition'].includes(prop)
})`
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

const ModalContent = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => !['initial', 'animate', 'exit', 'transition'].includes(prop)
})`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  
  h3 {
    color: #333;
    margin-bottom: 1rem;
  }
  
  p {
    color: #666;
    margin-bottom: 2rem;
  }
  
  .buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    
    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      
      &.primary {
        background: #6366f1;
        color: white;
      }
      
      &.secondary {
        background: #f3f4f6;
        color: #333;
      }
    }
  }
`;

const LessonPlayer = ({ 
  slides = [], 
  audioUrl = null, 
  onProgress = () => {}, 
  onComplete = () => {},
  initialSlide = 0,
  lessonId = null,
  courseId = null,
  autoSaveProgress = true
}) => {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [audioCompleted, setAudioCompleted] = useState(false);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Використовуємо новий hook для прогресу
  const {
    progress: lessonProgress,
    lastPosition,
    isCompleted,
    loading: progressLoading,
    error: progressError,
    isOnline,
    pendingChanges,
    updateProgress,
    completeLesson,
    saveNow
  } = useProgress(lessonId, courseId, {
    autoSave: autoSaveProgress,
    saveInterval: 30000,
    syncOnMount: true,
    trackTime: true
  });

  // Функція збереження прогресу (тепер використовує hook)
  const saveProgress = useCallback(async (progressPercentage) => {
    if (!autoSaveProgress || !lessonId) return;

    const lastPositionData = {
      slide: currentSlide,
      audioTime: currentTime,
      timestamp: Date.now()
    };

    await updateProgress(progressPercentage, lastPositionData);
  }, [autoSaveProgress, lessonId, currentSlide, currentTime, updateProgress]);

  // Обчислення прогресу уроку
  useEffect(() => {
    const audioProgressRatio = audioUrl && duration > 0 ? currentTime / duration : 1;
    const totalProgress = progressService.calculateLessonProgress(
      currentSlide, 
      slides.length, 
      audioProgressRatio, 
      !!audioUrl
    );
    
    onProgress(totalProgress);

    // Автоматичне збереження прогресу
    if (autoSaveProgress && lessonId) {
      saveProgress(totalProgress);
    }
  }, [currentSlide, currentTime, duration, slides.length, audioUrl, onProgress, saveProgress, autoSaveProgress, lessonId]);

  // Обробка завершення аудіо
  useEffect(() => {
    if (audioUrl && duration > 0 && currentTime >= duration - 1) {
      setAudioCompleted(true);
    }
  }, [currentTime, duration, audioUrl]);

  // Перевірка завершення уроку
  useEffect(() => {
    const isLastSlide = currentSlide === slides.length - 1;
    const audioFinished = !audioUrl || audioCompleted;
    
    if (isLastSlide && audioFinished && lessonProgress >= 95 && !isCompleted) {
      // Позначаємо урок як завершений
      if (autoSaveProgress && lessonId) {
        completeLesson()
          .then((success) => {
            if (success) {
              console.log('Урок позначено як завершений');
              onComplete();
            }
          })
          .catch(error => {
            console.error('Помилка позначення уроку як завершеного:', error);
          });
      } else {
        onComplete();
      }
    }
  }, [currentSlide, slides.length, audioUrl, audioCompleted, lessonProgress, isCompleted, onComplete, autoSaveProgress, lessonId, completeLesson]);

  // Відновлення позиції з збереженого прогресу
  useEffect(() => {
    if (lastPosition && !progressLoading) {
      const { slide, audioTime } = lastPosition;
      
      // Відновлюємо позицію слайду
      if (slide !== undefined && slide < slides.length && slide !== currentSlide) {
        setCurrentSlide(slide);
      }
      
      // Відновлюємо позицію аудіо
      if (audioTime && audioRef.current && Math.abs(audioRef.current.currentTime - audioTime) > 5) {
        audioRef.current.currentTime = audioTime;
        setCurrentTime(audioTime);
      }
    }
  }, [lastPosition, progressLoading, slides.length, currentSlide]);

  // Збереження прогресу при демонтажі компонента
  useEffect(() => {
    return () => {
      if (pendingChanges && autoSaveProgress) {
        saveNow();
      }
    };
  }, [pendingChanges, autoSaveProgress, saveNow]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleSpeedChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, slides.length]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setSidebarOpen(false);
  };

  const handleSlideNavigation = (direction) => {
    // Перевірка чи аудіо прослухано до кінця перед переходом
    if (audioUrl && !audioCompleted && direction === 'next') {
      setShowCompletionModal(true);
      return;
    }
    
    if (direction === 'next') {
      nextSlide();
    } else {
      prevSlide();
    }
  };

  const confirmSlideChange = () => {
    setShowCompletionModal(false);
    nextSlide();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Клавіатурна навігація
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        handleSlideNavigation('next');
      } else if (e.key === ' ') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [prevSlide, handleSlideNavigation]);

  const currentSlideData = slides[currentSlide] || {};

  const getSyncStatusText = () => {
    if (!isOnline) return 'Офлайн режим';
    if (pendingChanges) return 'Збереження...';
    return 'Синхронізовано';
  };

  return (
    <>
      <LessonProgressBar>
        <div className="progress" style={{ width: `${lessonProgress}%` }} />
      </LessonProgressBar>

      <SyncStatus 
        $isOnline={isOnline}
        $pendingChanges={pendingChanges}
        $show={!isOnline || pendingChanges || progressError}
      >
        <div className="dot" />
        {getSyncStatusText()}
        {progressError && ' (Помилка)'}
      </SyncStatus>

      <Container>
        <MobileMenuButton onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          Слайди
        </MobileMenuButton>

        <Sidebar
          $isOpen={sidebarOpen}
        >
          <SidebarHeader>
            <h3>Навігація слайдів</h3>
            <span>{currentSlide + 1} / {slides.length}</span>
          </SidebarHeader>
          
          <SlideList>
            {slides.map((slide, index) => (
              <SlideItem
                key={index}
                $active={index === currentSlide}
                onClick={() => goToSlide(index)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="slide-number">Слайд {index + 1}</div>
                <div className="slide-title">{slide.title || `Слайд ${index + 1}`}</div>
              </SlideItem>
            ))}
          </SlideList>
        </Sidebar>

        <MainContent>
          <SlideContainer>
            <NavigationControls>
              <NavButton
                onClick={prevSlide}
                disabled={currentSlide === 0}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft size={24} />
              </NavButton>
              
              <NavButton
                onClick={() => handleSlideNavigation('next')}
                disabled={currentSlide === slides.length - 1}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight size={24} />
              </NavButton>
            </NavigationControls>

            <Slide
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <SlideContent>
                <h2>{currentSlideData.title || `Слайд ${currentSlide + 1}`}</h2>
                {currentSlideData.content && (
                  <div dangerouslySetInnerHTML={{ __html: currentSlideData.content }} />
                )}
                {currentSlideData.image && (
                  <img src={currentSlideData.image} alt={currentSlideData.title} />
                )}
              </SlideContent>
            </Slide>
          </SlideContainer>

          {audioUrl && (
            <AudioPlayerContainer>
              <AudioControls>
                <PlayButton
                  onClick={handlePlayPause}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </PlayButton>

                <VolumeControl>
                  <button onClick={toggleMute}>
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <VolumeSlider
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                  />
                </VolumeControl>

                <SpeedControl value={playbackRate} onChange={handleSpeedChange}>
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </SpeedControl>

                <SlideInfo>
                  <span>Слайд {currentSlide + 1} з {slides.length}</span>
                </SlideInfo>

                <FullscreenButton
                  onClick={toggleFullscreen}
                  whileHover={{ scale: 1.05 }}
                >
                  <Maximize size={20} />
                </FullscreenButton>
              </AudioControls>

              <ProgressContainer>
                <ProgressBar
                  ref={progressRef}
                  onClick={handleProgressClick}
                >
                  <div 
                    className="progress-fill" 
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  <div 
                    className="progress-handle"
                    style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </ProgressBar>
                
                <TimeDisplay>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </TimeDisplay>
              </ProgressContainer>

              <audio
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration);
                  }
                }}
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime);
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setAudioCompleted(true);
                }}
              />
            </AudioPlayerContainer>
          )}
        </MainContent>
      </Container>

      <AnimatePresence>
        {isFullscreen && (
          <FullscreenOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FullscreenSlide>
              <div className="slide-content">
                <SlideContent>
                  <h2>{currentSlideData.title || `Слайд ${currentSlide + 1}`}</h2>
                  {currentSlideData.content && (
                    <div dangerouslySetInnerHTML={{ __html: currentSlideData.content }} />
                  )}
                  {currentSlideData.image && (
                    <img src={currentSlideData.image} alt={currentSlideData.title} />
                  )}
                </SlideContent>
              </div>
            </FullscreenSlide>

            <FullscreenControls>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <NavButton
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  whileHover={{ scale: 1.1 }}
                >
                  <ChevronLeft size={20} />
                </NavButton>
                
                <span style={{ color: 'white' }}>
                  {currentSlide + 1} / {slides.length}
                </span>
                
                <NavButton
                  onClick={() => handleSlideNavigation('next')}
                  disabled={currentSlide === slides.length - 1}
                  whileHover={{ scale: 1.1 }}
                >
                  <ChevronRight size={20} />
                </NavButton>
              </div>

              {audioUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <PlayButton
                    onClick={handlePlayPause}
                    whileHover={{ scale: 1.05 }}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </PlayButton>
                  
                  <TimeDisplay style={{ color: 'white' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </TimeDisplay>
                </div>
              )}

              <FullscreenButton
                onClick={toggleFullscreen}
                style={{ color: 'white' }}
                whileHover={{ scale: 1.05 }}
              >
                <Minimize size={20} />
              </FullscreenButton>
            </FullscreenControls>
          </FullscreenOverlay>
        )}
      </AnimatePresence>

      <AnimatePresence>
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
              <h3>Підтвердження переходу</h3>
              <p>Аудіо ще не прослухано до кінця. Ви впевнені, що хочете перейти до наступного слайду?</p>
              
              <div className="buttons">
                <button 
                  className="secondary"
                  onClick={() => setShowCompletionModal(false)}
                >
                  Залишитися
                </button>
                <button 
                  className="primary"
                  onClick={confirmSlideChange}
                >
                  Перейти далі
                </button>
              </div>
            </ModalContent>
          </CompletionModal>
        )}
      </AnimatePresence>
    </>
  );
};

export default LessonPlayer;