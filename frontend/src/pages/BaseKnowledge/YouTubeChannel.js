import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import RichTextRenderer from '../../components/Content/RichTextRenderer';
import contentService from '../../services/contentService';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Hero = styled(motion.section)`
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #ff0000, #cc0000);
  color: white;
  padding: 3rem 2rem;
  border-radius: 16px;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const YouTubeSection = styled.section`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  text-align: center;
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const VideoCard = styled(motion.div)`
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const VideoThumbnail = styled.div`
  width: 100%;
  height: 200px;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1.1rem;
`;

const VideoInfo = styled.div`
  padding: 1rem;
`;

const VideoTitle = styled.h3`
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
`;

const VideoDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ChannelStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const SubscribeButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #ff0000;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s ease;
  
  &:hover {
    background: #cc0000;
  }
`;

const CommentsSection = styled.section`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const CommentForm = styled.form`
  margin-bottom: 2rem;
`;

const CommentInput = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;

const CommentButton = styled.button`
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  
  &:hover {
    background: #5856eb;
  }
`;

const Comment = styled.div`
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const CommentAuthor = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const CommentText = styled.div`
  color: #666;
  line-height: 1.5;
`;

const CommentDate = styled.div`
  color: #999;
  font-size: 0.8rem;
  margin-top: 0.5rem;
`;

const YouTubeChannel = () => {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    loadYouTubeContent();
    loadComments();
  }, []);

  const loadYouTubeContent = async () => {
    try {
      setLoading(true);
      const response = await contentService.getPageBySlug('youtube-channel');
      setPageContent(response.data);
    } catch (err) {
      console.error('Помилка завантаження YouTube каналу:', err);
      setError('Не вдалося завантажити контент каналу. Показуємо базову інформацію.');
      
      // Використовуємо дефолтний контент при помилці
      setPageContent({
        title: 'YouTube Канал',
        content: getDefaultYouTubeContent()
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComments = () => {
    // Симуляція завантаження коментарів
    const mockComments = [
      {
        id: 1,
        author: 'Марія К.',
        text: 'Дуже корисні відео! Дякую за цінні знання.',
        date: '2 дні тому'
      },
      {
        id: 2,
        author: 'Олександр П.',
        text: 'Чекаю на нові випуски про астрологію.',
        date: '1 тиждень тому'
      }
    ];
    setComments(mockComments);
  };

  const getDefaultYouTubeContent = () => {
    return {
      blocks: [
        {
          type: 'youtube',
          video_id: 'dQw4w9WgXcQ', // Приклад YouTube відео
          title: 'Останнє відео каналу',
          width: '100%',
          height: '400'
        },
        {
          type: 'text',
          content: '<h3>Про наш канал</h3><p>Ласкаво просимо на наш YouTube канал! Тут ви знайдете:</p><ul><li>Уроки з астрології та езотерики</li><li>Медитації та практики</li><li>Відповіді на питання глядачів</li><li>Прямі ефіри з майстром</li></ul>',
          alignment: 'left'
        }
      ]
    };
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      const newComment = {
        id: Date.now(),
        author: 'Ви',
        text: comment,
        date: 'щойно'
      };
      setComments([newComment, ...comments]);
      setComment('');
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Завантаження YouTube каналу...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Hero
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Title>YouTube Канал</Title>
        <Subtitle>
          Приєднуйтесь до нашої спільноти та отримуйте найновіші знання 
          з астрології, езотерики та духовного розвитку
        </Subtitle>
        <div style={{ marginTop: '2rem' }}>
          <SubscribeButton 
            href="https://youtube.com/@your-channel" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            📺 Підписатися на канал
          </SubscribeButton>
        </div>
      </Hero>

      {error && (
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          color: '#856404',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <ChannelStats>
        <StatCard>
          <StatNumber>1.2K</StatNumber>
          <StatLabel>Підписників</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>45</StatNumber>
          <StatLabel>Відео</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>25K</StatNumber>
          <StatLabel>Переглядів</StatLabel>
        </StatCard>
      </ChannelStats>

      <YouTubeSection>
        <SectionTitle>Контент каналу</SectionTitle>
        <RichTextRenderer 
          content={pageContent?.content || getDefaultYouTubeContent()} 
          className="youtube-content"
        />
      </YouTubeSection>

      <YouTubeSection>
        <SectionTitle>Популярні відео</SectionTitle>
        <VideoGrid>
          <VideoCard
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <VideoThumbnail>
              🎥 Відео 1
            </VideoThumbnail>
            <VideoInfo>
              <VideoTitle>Основи натальної астрології</VideoTitle>
              <VideoDescription>
                Вивчаємо базові принципи читання натальної карти
              </VideoDescription>
            </VideoInfo>
          </VideoCard>

          <VideoCard
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <VideoThumbnail>
              🎥 Відео 2
            </VideoThumbnail>
            <VideoInfo>
              <VideoTitle>Медитація для початківців</VideoTitle>
              <VideoDescription>
                Практична медитація для розвитку внутрішнього спокою
              </VideoDescription>
            </VideoInfo>
          </VideoCard>

          <VideoCard
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <VideoThumbnail>
              🎥 Відео 3
            </VideoThumbnail>
            <VideoInfo>
              <VideoTitle>Таро для самопізнання</VideoTitle>
              <VideoDescription>
                Як використовувати карти Таро для особистого розвитку
              </VideoDescription>
            </VideoInfo>
          </VideoCard>
        </VideoGrid>
      </YouTubeSection>

      <CommentsSection>
        <SectionTitle>Коментарі та обговорення</SectionTitle>
        
        <CommentForm onSubmit={handleCommentSubmit}>
          <CommentInput
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Залиште свій коментар або питання..."
          />
          <CommentButton type="submit">
            Додати коментар
          </CommentButton>
        </CommentForm>

        {comments.map(comment => (
          <Comment key={comment.id}>
            <CommentAuthor>{comment.author}</CommentAuthor>
            <CommentText>{comment.text}</CommentText>
            <CommentDate>{comment.date}</CommentDate>
          </Comment>
        ))}
      </CommentsSection>
    </Container>
  );
};

export default YouTubeChannel;