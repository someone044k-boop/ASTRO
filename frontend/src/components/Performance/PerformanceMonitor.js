import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const MonitorContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 12px;
  z-index: 10000;
  min-width: 200px;
  display: ${props => props.show ? 'block' : 'none'};
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
  
  .label {
    color: #ccc;
  }
  
  .value {
    color: ${props => {
      if (props.status === 'good') return '#4CAF50';
      if (props.status === 'warning') return '#FF9800';
      if (props.status === 'error') return '#F44336';
      return '#fff';
    }};
    font-weight: bold;
  }
`;

const ToggleButton = styled.button`
  position: fixed;
  top: 10px;
  right: 220px;
  background: #8B4513;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  z-index: 10001;
`;

const PerformanceMonitor = () => {
  const [show, setShow] = useState(false);
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: { used: 0, total: 0 },
    loadTime: 0,
    networkStatus: 'online',
    cacheHits: 0,
    bundleSize: 0
  });

  useEffect(() => {
    // Показуємо тільки в development режимі
    if (process.env.NODE_ENV !== 'development') return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;

    // Вимірювання FPS
    const measureFPS = (currentTime) => {
      frameCount++;
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        setMetrics(prev => ({
          ...prev,
          fps
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    // Вимірювання пам'яті
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = performance.memory;
        setMetrics(prev => ({
          ...prev,
          memory: {
            used: Math.round(memory.usedJSHeapSize / 1048576),
            total: Math.round(memory.totalJSHeapSize / 1048576)
          }
        }));
      }
    };

    // Вимірювання часу завантаження
    const measureLoadTime = () => {
      if ('navigation' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0];
        const loadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
        
        setMetrics(prev => ({
          ...prev,
          loadTime
        }));
      }
    };

    // Моніторинг мережі
    const monitorNetwork = () => {
      const updateNetworkStatus = () => {
        setMetrics(prev => ({
          ...prev,
          networkStatus: navigator.onLine ? 'online' : 'offline'
        }));
      };

      window.addEventListener('online', updateNetworkStatus);
      window.addEventListener('offline', updateNetworkStatus);
      
      return () => {
        window.removeEventListener('online', updateNetworkStatus);
        window.removeEventListener('offline', updateNetworkStatus);
      };
    };

    // Запуск моніторингу
    animationId = requestAnimationFrame(measureFPS);
    measureLoadTime();
    const networkCleanup = monitorNetwork();
    
    const memoryInterval = setInterval(measureMemory, 2000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
      networkCleanup && networkCleanup();
    };
  }, []);

  const getFPSStatus = (fps) => {
    if (fps >= 50) return 'good';
    if (fps >= 30) return 'warning';
    return 'error';
  };

  const getMemoryStatus = (used, total) => {
    const percentage = (used / total) * 100;
    if (percentage < 70) return 'good';
    if (percentage < 85) return 'warning';
    return 'error';
  };

  const getLoadTimeStatus = (time) => {
    if (time < 2000) return 'good';
    if (time < 4000) return 'warning';
    return 'error';
  };

  // Показуємо тільки в development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <ToggleButton onClick={() => setShow(!show)}>
        {show ? 'Сховати' : 'Показати'} метрики
      </ToggleButton>
      
      <MonitorContainer show={show}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
          Метрики продуктивності
        </div>
        
        <MetricRow status={getFPSStatus(metrics.fps)}>
          <span className="label">FPS:</span>
          <span className="value">{metrics.fps}</span>
        </MetricRow>
        
        <MetricRow status={getMemoryStatus(metrics.memory.used, metrics.memory.total)}>
          <span className="label">Пам'ять:</span>
          <span className="value">
            {metrics.memory.used}MB / {metrics.memory.total}MB
          </span>
        </MetricRow>
        
        <MetricRow status={getLoadTimeStatus(metrics.loadTime)}>
          <span className="label">Завантаження:</span>
          <span className="value">{metrics.loadTime}ms</span>
        </MetricRow>
        
        <MetricRow status={metrics.networkStatus === 'online' ? 'good' : 'error'}>
          <span className="label">Мережа:</span>
          <span className="value">{metrics.networkStatus}</span>
        </MetricRow>
        
        <MetricRow>
          <span className="label">SW:</span>
          <span className="value">
            {'serviceWorker' in navigator ? 'Активний' : 'Неактивний'}
          </span>
        </MetricRow>
      </MonitorContainer>
    </>
  );
};

export default PerformanceMonitor;