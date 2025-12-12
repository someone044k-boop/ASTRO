import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import RichTextRenderer from '../../components/Content/RichTextRenderer';
import contentService from '../../services/contentService';

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Hero = styled(motion.section)`
  text-align: center;
  margin-bottom: 4rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  color: #333;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const ContentSection = styled(motion.section)`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ContentCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const CardTitle = styled.h3`
  color: #6366f1;
  margin-bottom: 1rem;
  font-size: 1.3rem;
`;

const CardContent = styled.div`
  color: #666;
  line-height: 1.6;
  
  p {
    margin-bottom: 1rem;
  }
  
  ul {
    padding-left: 1.5rem;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
`;

const ImagePlaceholder = styled.div`
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  margin: 2rem auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  
  @media (max-width: 768px) {
    width: 200px;
    height: 200px;
    font-size: 1rem;
  }
`;

const Quote = styled(motion.blockquote)`
  background: #f8f9fa;
  border-left: 4px solid #6366f1;
  padding: 2rem;
  margin: 2rem 0;
  font-style: italic;
  font-size: 1.1rem;
  color: #555;
  border-radius: 0 8px 8px 0;
`;

const ContactInfo = styled.div`
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  margin-top: 3rem;
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const SocialLink = styled.a`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
`;

const AboutMaster = () => {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAboutContent();
  }, []);

  const loadAboutContent = async () => {
    try {
      setLoading(true);
      const response = await contentService.getPageBySlug('about');
      setPageContent(response.data);
    } catch (err) {
      console.error('Помилка завантаження сторінки "Про майстра":', err);
      setError('Не вдалося завантажити контент. Показуємо базову інформацію.');
      
      // Використовуємо дефолтний контент при помилці
      setPageContent({
        title: 'Про Майстра',
        content: getDefaultAboutContent()
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAboutContent = () => {
    return {
      blocks: [
        {
          type: 'hero',
          title: 'Про Майстра',
          subtitle: 'Досвідчений наставник у світі езотеричних знань та духовних практик',
          background_color: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          text_color: 'white',
          alignment: 'center',
          height: 'medium'
        },
        {
          type: 'text',
          content: '<h2>Шлях до Знань</h2><p>Понад 15 років досвіду в галузі езотеричних практик та духовного розвитку. Вивчав древні традиції та сучасні методики в різних школах світу.</p>',
          alignment: 'center'
        },
        {
          type: 'text',
          content: '<h3>Спеціалізації:</h3><ul><li>Натальна астрологія</li><li>Таро та оракули</li><li>Енергетичне цілительство</li><li>Медитація та візуалізація</li><li>Чакральна система</li><li>Кристалотерапія</li><li>Нумерологія</li><li>Руни та символіка</li></ul>'
        },
        {
          type: 'text',
          content: '<blockquote>"Справжня мудрість приходить не з накопичення знань, а з розуміння того, як ці знання можуть трансформувати наше життя та допомогти іншим на їхньому шляху."</blockquote>',
          background_color: '#f8f9fa',
          font_style: 'italic'
        },
        {
          type: 'social',
          title: 'Зв\'язок з Майстром',
          platforms: [
            { name: 'Консультації', url: '/consultations' },
            { name: 'YouTube', url: '/base-knowledge/youtube' },
            { name: 'Telegram', url: '#' }
          ],
          layout: 'horizontal',
          show_labels: true
        }
      ]
    };
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Завантаження інформації про майстра...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
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
      
      <RichTextRenderer 
        content={pageContent?.content || getDefaultAboutContent()} 
        className="about-master-content"
      />
    </Container>
  );
};

export default AboutMaster;