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
  margin-bottom: 4rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rem 2rem;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="stars" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="white" opacity="0.3"/></pattern></defs><rect width="100" height="100" fill="url(%23stars)"/></svg>') repeat;
    opacity: 0.3;
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.3rem;
  opacity: 0.95;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
  position: relative;
  z-index: 1;
`;

const ContentSection = styled(motion.section)`
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    padding: 2rem;
  }
`;

const SectionTitle = styled.h2`
  color: #333;
  margin-bottom: 2rem;
  font-size: 2.2rem;
  text-align: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 2px;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
`;

const FeatureCard = styled(motion.div)`
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FeatureTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
`;

const FeatureDescription = styled.p`
  color: #666;
  line-height: 1.6;
`;

const ProcessSection = styled.section`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  padding: 3rem;
  margin: 3rem 0;
`;

const ProcessTitle = styled.h2`
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2.2rem;
`;

const ProcessSteps = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

const ProcessStep = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const StepNumber = styled.div`
  width: 50px;
  height: 50px;
  background: white;
  color: #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin: 0 auto 1rem;
`;

const StepTitle = styled.h4`
  margin-bottom: 1rem;
  font-size: 1.2rem;
`;

const StepDescription = styled.p`
  opacity: 0.9;
  line-height: 1.5;
`;

const BenefitsSection = styled.section`
  background: #f8f9fa;
  border-radius: 16px;
  padding: 3rem;
  margin: 3rem 0;
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const BenefitItem = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const BenefitIcon = styled.div`
  font-size: 2rem;
  color: #667eea;
`;

const BenefitText = styled.div`
  color: #333;
  font-weight: 500;
`;

const TestimonialsSection = styled.section`
  margin: 3rem 0;
`;

const TestimonialCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  border-left: 4px solid #667eea;
`;

const TestimonialText = styled.blockquote`
  font-style: italic;
  color: #555;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 1.1rem;
`;

const TestimonialAuthor = styled.div`
  color: #667eea;
  font-weight: 600;
`;

const CityOfGods = () => {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCityOfGodsContent();
  }, []);

  const loadCityOfGodsContent = async () => {
    try {
      setLoading(true);
      const response = await contentService.getPageBySlug('city-of-gods');
      setPageContent(response.data);
    } catch (err) {
      console.error('Помилка завантаження сторінки "Технологія місто Богів":', err);
      setError('Не вдалося завантажити контент. Показуємо базову інформацію.');
      
      setPageContent({
        title: 'Технологія "Місто Богів"',
        content: getDefaultCityOfGodsContent()
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCityOfGodsContent = () => {
    return {
      blocks: [
        {
          type: 'text',
          content: '<h3>Що таке технологія "Місто Богів"?</h3><p>Це унікальна методика духовного розвитку, яка поєднує древні знання з сучасними підходами до самопізнання та трансформації свідомості. Технологія допомагає створити внутрішній простір гармонії та мудрості.</p>',
          alignment: 'left'
        }
      ]
    };
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Завантаження технології "Місто Богів"...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Hero
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Title>Технологія "Місто Богів"</Title>
        <Subtitle>
          Унікальна методика духовного розвитку та трансформації свідомості, 
          що поєднує древні знання з сучасними практиками самопізнання
        </Subtitle>
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

      <ContentSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <SectionTitle>Основи технології</SectionTitle>
        <RichTextRenderer 
          content={pageContent?.content || getDefaultCityOfGodsContent()} 
          className="city-of-gods-content"
        />
      </ContentSection>

      <ContentSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <SectionTitle>Ключові особливості</SectionTitle>
        <FeatureGrid>
          <FeatureCard
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <FeatureIcon>🏛️</FeatureIcon>
            <FeatureTitle>Архітектура свідомості</FeatureTitle>
            <FeatureDescription>
              Створення внутрішнього простору, структурованого за принципами 
              священної геометрії та древніх храмових комплексів
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <FeatureIcon>⚡</FeatureIcon>
            <FeatureTitle>Енергетичні потоки</FeatureTitle>
            <FeatureDescription>
              Робота з тонкими енергіями та їх гармонізація для досягнення 
              стану внутрішньої рівноваги та сили
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <FeatureIcon>🧘</FeatureIcon>
            <FeatureTitle>Медитативні практики</FeatureTitle>
            <FeatureDescription>
              Спеціальні техніки медитації, що дозволяють увійти в стан 
              "божественної свідомості" та отримати доступ до вищих знань
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <FeatureIcon>🔮</FeatureIcon>
            <FeatureTitle>Символічна мова</FeatureTitle>
            <FeatureDescription>
              Використання архетипних символів та образів для програмування 
              підсвідомості на позитивні зміни
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>
      </ContentSection>

      <ProcessSection>
        <ProcessTitle>Етапи освоєння технології</ProcessTitle>
        <ProcessSteps>
          <ProcessStep
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <StepNumber>1</StepNumber>
            <StepTitle>Підготовка</StepTitle>
            <StepDescription>
              Очищення свідомості від негативних програм та створення 
              базового енергетичного фундаменту
            </StepDescription>
          </ProcessStep>

          <ProcessStep
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <StepNumber>2</StepNumber>
            <StepTitle>Побудова</StepTitle>
            <StepDescription>
              Створення внутрішнього "міста" - структурованого простору 
              свідомості з різними "районами" та функціями
            </StepDescription>
          </ProcessStep>

          <ProcessStep
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <StepNumber>3</StepNumber>
            <StepTitle>Активація</StepTitle>
            <StepDescription>
              Запуск енергетичних процесів та налаштування зв'язку з 
              вищими планами свідомості
            </StepDescription>
          </ProcessStep>

          <ProcessStep
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <StepNumber>4</StepNumber>
            <StepTitle>Інтеграція</StepTitle>
            <StepDescription>
              Впровадження отриманих знань та здібностей у повсякденне 
              життя для постійного духовного зростання
            </StepDescription>
          </ProcessStep>
        </ProcessSteps>
      </ProcessSection>

      <BenefitsSection>
        <SectionTitle>Переваги практики</SectionTitle>
        <BenefitsList>
          <BenefitItem
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.4 }}
          >
            <BenefitIcon>🌟</BenefitIcon>
            <BenefitText>Розширення свідомості та інтуїції</BenefitText>
          </BenefitItem>

          <BenefitItem
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.5 }}
          >
            <BenefitIcon>💎</BenefitIcon>
            <BenefitText>Підвищення рівня енергії та життєвої сили</BenefitText>
          </BenefitItem>

          <BenefitItem
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.6 }}
          >
            <BenefitIcon>🎯</BenefitIcon>
            <BenefitText>Чіткість цілей та шляхів їх досягнення</BenefitText>
          </BenefitItem>

          <BenefitItem
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.7 }}
          >
            <BenefitIcon>🕊️</BenefitIcon>
            <BenefitText>Внутрішній спокій та гармонія</BenefitText>
          </BenefitItem>

          <BenefitItem
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.8 }}
          >
            <BenefitIcon>🔗</BenefitIcon>
            <BenefitText>Зміцнення зв'язку з вищим "Я"</BenefitText>
          </BenefitItem>

          <BenefitItem
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.9 }}
          >
            <BenefitIcon>🌈</BenefitIcon>
            <BenefitText>Трансформація негативних програм</BenefitText>
          </BenefitItem>
        </BenefitsList>
      </BenefitsSection>

      <TestimonialsSection>
        <SectionTitle>Відгуки практикуючих</SectionTitle>
        
        <TestimonialCard
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 2.0 }}
        >
          <TestimonialText>
            "Технологія 'Місто Богів' кардинально змінила моє життя. Я навчилася 
            керувати своїми енергіями та створювати реальність, яку хочу. Це не просто 
            практика - це справжня трансформація свідомості."
          </TestimonialText>
          <TestimonialAuthor>— Олена М., практикуюча 2 роки</TestimonialAuthor>
        </TestimonialCard>

        <TestimonialCard
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 2.2 }}
        >
          <TestimonialText>
            "Після освоєння цієї технології я відчув неймовірний приплив сил та ясності. 
            Мої медитації стали глибшими, а інтуїція - точнішою. Рекомендую всім, 
            хто серйозно займається духовним розвитком."
          </TestimonialText>
          <TestimonialAuthor>— Андрій К., практикуючий 3 роки</TestimonialAuthor>
        </TestimonialCard>
      </TestimonialsSection>
    </Container>
  );
};

export default CityOfGods;