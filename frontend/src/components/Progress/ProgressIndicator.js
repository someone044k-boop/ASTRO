import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, PlayCircle } from 'lucide-react';

const Container = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: ${props => props.background || '#f3f4f6'};
  color: ${props => props.color || '#374151'};
  font-size: 0.85rem;
  font-weight: 600;
`;

const ProgressBar = styled.div`
  width: ${props => props.width || '100px'};
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 0.5rem;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: currentColor;
  border-radius: 2px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * Компонент індикатора прогресу
 * @param {number} progress - Прогрес від 0 до 100
 * @param {string} size - Розмір: 'small', 'medium', 'large'
 * @param {boolean} showIcon - Показувати іконку
 * @param {boolean} showBar - Показувати прогрес-бар
 * @param {boolean} showPercentage - Показувати відсоток
 * @param {string} status - Статус: 'not-started', 'in-progress', 'completed'
 */
const ProgressIndicator = ({ 
  progress = 0, 
  size = 'medium',
  showIcon = true,
  showBar = false,
  showPercentage = true,
  status = null
}) => {
  // Автоматичне визначення статусу на основі прогресу
  const getStatus = () => {
    if (status) return status;
    if (progress >= 100) return 'completed';
    if (progress > 0) return 'in-progress';
    return 'not-started';
  };

  const currentStatus = getStatus();

  // Кольори та стилі для різних статусів
  const statusConfig = {
    'not-started': {
      background: '#f3f4f6',
      color: '#6b7280',
      icon: Clock,
      text: 'Не розпочато'
    },
    'in-progress': {
      background: '#dbeafe',
      color: '#2563eb',
      icon: PlayCircle,
      text: `${Math.round(progress)}%`
    },
    'completed': {
      background: '#dcfce7',
      color: '#16a34a',
      icon: CheckCircle,
      text: 'Завершено'
    }
  };

  const config = statusConfig[currentStatus];
  const IconComponent = config.icon;

  // Розміри для різних варіантів
  const sizeConfig = {
    small: {
      fontSize: '0.75rem',
      padding: '0.25rem 0.75rem',
      iconSize: 14,
      barWidth: '60px'
    },
    medium: {
      fontSize: '0.85rem',
      padding: '0.5rem 1rem',
      iconSize: 16,
      barWidth: '80px'
    },
    large: {
      fontSize: '1rem',
      padding: '0.75rem 1.25rem',
      iconSize: 20,
      barWidth: '120px'
    }
  };

  const currentSize = sizeConfig[size];

  return (
    <Container
      background={config.background}
      color={config.color}
      style={{
        fontSize: currentSize.fontSize,
        padding: currentSize.padding
      }}
    >
      {showIcon && (
        <IconWrapper>
          <IconComponent size={currentSize.iconSize} />
        </IconWrapper>
      )}
      
      {showBar && (
        <ProgressBar width={currentSize.barWidth}>
          <ProgressFill
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </ProgressBar>
      )}
      
      {showPercentage && (
        <span>{config.text}</span>
      )}
    </Container>
  );
};

export default ProgressIndicator;