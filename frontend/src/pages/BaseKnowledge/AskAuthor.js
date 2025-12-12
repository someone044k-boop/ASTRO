import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
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
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const QuestionForm = styled(motion.section)`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: #333;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;

const SubmitButton = styled.button`
  background: #6366f1;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  width: 100%;
  
  &:hover {
    background: #5856eb;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const GuidelinesSection = styled.section`
  background: #f8f9fa;
  border-radius: 16px;
  padding: 2rem;
`;

const GuidelinesTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
`;

const GuidelinesList = styled.ul`
  color: #666;
  line-height: 1.6;
  
  li {
    margin-bottom: 0.5rem;
  }
`;

const QASection = styled.section`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const QATitle = styled.h2`
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  text-align: center;
`;

const QAItem = styled(motion.div)`
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  overflow: hidden;
`;

const Question = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
`;

const QuestionText = styled.h4`
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
`;

const QuestionMeta = styled.div`
  color: #666;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Answer = styled.div`
  padding: 1.5rem;
  background: white;
`;

const AnswerText = styled.div`
  color: #555;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const AnswerMeta = styled.div`
  color: #999;
  font-size: 0.8rem;
  text-align: right;
`;

const SuccessMessage = styled(motion.div)`
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const AskAuthor = () => {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [qaItems, setQaItems] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    question: ''
  });

  useEffect(() => {
    loadAskAuthorContent();
    loadQAItems();
  }, []);

  const loadAskAuthorContent = async () => {
    try {
      setLoading(true);
      const response = await contentService.getPageBySlug('ask-author');
      setPageContent(response.data);
    } catch (err) {
      console.error('Помилка завантаження сторінки "Спитати автора":', err);
      setError('Не вдалося завантажити контент. Показуємо базову інформацію.');
      
      setPageContent({
        title: 'Спитати автора',
        content: getDefaultAskAuthorContent()
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQAItems = () => {
    // Симуляція завантаження Q&A
    const mockQA = [
      {
        id: 1,
        question: 'Як правильно інтерпретувати позицію Місяця в натальній карті?',
        category: 'Астрологія',
        author: 'Марія К.',
        date: '15 грудня 2024',
        answer: 'Місяць у натальній карті показує наші емоційні потреби, підсвідомі реакції та спосіб, яким ми шукаємо комфорт і безпеку. Позиція Місяця в знаку розкриває, що нам потрібно для емоційного благополуччя...',
        answerDate: '16 грудня 2024'
      },
      {
        id: 2,
        question: 'Які медитативні практики найкраще підходять для початківців?',
        category: 'Медитація',
        author: 'Олександр П.',
        date: '10 грудня 2024',
        answer: 'Для початківців рекомендую почати з простих дихальних практик. Сядьте зручно, закрийте очі і зосередьтеся на своєму диханні. Починайте з 5-10 хвилин щодня...',
        answerDate: '11 грудня 2024'
      }
    ];
    setQaItems(mockQA);
  };

  const getDefaultAskAuthorContent = () => {
    return {
      blocks: [
        {
          type: 'text',
          content: '<h3>Маєте питання?</h3><p>Я завжди радий відповісти на ваші питання про астрологію, езотерику, духовний розвиток та інші теми, які вас цікавлять. Заповніть форму нижче, і я обов\'язково дам вам детальну відповідь.</p>',
          alignment: 'left'
        }
      ]
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Симуляція відправки питання
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Додаємо нове питання до списку
      const newQuestion = {
        id: Date.now(),
        question: formData.question,
        category: formData.category,
        author: formData.name,
        date: new Date().toLocaleDateString('uk-UA'),
        answer: null,
        answerDate: null
      };
      
      setQaItems([newQuestion, ...qaItems]);
      setShowSuccess(true);
      setFormData({ name: '', email: '', category: 'general', question: '' });
      
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error('Помилка відправки питання:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Завантаження сторінки...</p>
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
        <Title>Спитати автора</Title>
        <Subtitle>
          Маєте питання про астрологію, езотерику або духовний розвиток? 
          Задайте їх прямо зараз і отримайте персональну відповідь від майстра
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

      <ContentGrid>
        <QuestionForm
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <FormTitle>Задати питання</FormTitle>
          
          <RichTextRenderer 
            content={pageContent?.content || getDefaultAskAuthorContent()} 
            className="ask-author-content"
          />

          <AnimatePresence>
            {showSuccess && (
              <SuccessMessage
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                ✅ Ваше питання успішно надіслано! Відповідь з'явиться нижче найближчим часом.
              </SuccessMessage>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="name">Ваше ім'я *</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email *</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="category">Категорія питання</Label>
              <Select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="general">Загальні питання</option>
                <option value="astrology">Астрологія</option>
                <option value="tarot">Таро</option>
                <option value="meditation">Медитація</option>
                <option value="numerology">Нумерологія</option>
                <option value="crystals">Кристали</option>
                <option value="courses">Курси навчання</option>
                <option value="consultations">Консультації</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="question">Ваше питання *</Label>
              <TextArea
                id="question"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                placeholder="Опишіть ваше питання детально..."
                required
              />
            </FormGroup>

            <SubmitButton type="submit" disabled={submitting}>
              {submitting ? 'Надсилання...' : 'Надіслати питання'}
            </SubmitButton>
          </form>
        </QuestionForm>

        <GuidelinesSection>
          <GuidelinesTitle>Рекомендації для питань</GuidelinesTitle>
          <GuidelinesList>
            <li>Формулюйте питання чітко та конкретно</li>
            <li>Вказуйте контекст, якщо це необхідно</li>
            <li>Одне питання - одна форма</li>
            <li>Відповідь надійде протягом 2-3 робочих днів</li>
            <li>Персональні консультації доступні окремо</li>
            <li>Питання можуть бути опубліковані анонімно</li>
          </GuidelinesList>
        </GuidelinesSection>
      </ContentGrid>

      <QASection>
        <QATitle>Попередні питання та відповіді</QATitle>
        
        {qaItems.map(item => (
          <QAItem
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Question>
              <QuestionText>{item.question}</QuestionText>
              <QuestionMeta>
                <span>Категорія: {item.category}</span>
                <span>{item.date}</span>
              </QuestionMeta>
            </Question>
            
            {item.answer ? (
              <Answer>
                <AnswerText>{item.answer}</AnswerText>
                <AnswerMeta>Відповідь від майстра • {item.answerDate}</AnswerMeta>
              </Answer>
            ) : (
              <Answer>
                <AnswerText style={{ fontStyle: 'italic', color: '#999' }}>
                  Очікує відповіді від майстра...
                </AnswerText>
              </Answer>
            )}
          </QAItem>
        ))}
      </QASection>
    </Container>
  );
};

export default AskAuthor;