import React, { Suspense } from 'react';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 2rem;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #8B4513;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-left: 1rem;
  color: #666;
  font-size: 1rem;
`;

const LoadingFallback = ({ text = "Завантаження..." }) => (
  <LoadingContainer>
    <LoadingSpinner />
    <LoadingText>{text}</LoadingText>
  </LoadingContainer>
);

const LazyWrapper = ({ children, fallback }) => {
  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      {children}
    </Suspense>
  );
};

export default LazyWrapper;