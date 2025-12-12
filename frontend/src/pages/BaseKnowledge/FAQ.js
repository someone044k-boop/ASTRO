import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import RichTextRenderer from '../../components/Content/RichTextRenderer';
import contentService from '../../services/contentService';

const Container = styled.div`
  max-width: 1400px;
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

const ContentWrapper = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const Sidebar = styled.nav`
  background: #f8f9fa;
  border-radius: 16px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  
  /* Стилізація скролбару */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #e9ecef;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #6366f1;
    border-radius: 3px;
  }
  
  @media (max-width: 968px) {
    position: static;
    padding: 1rem;
    max-height: 300px;
  }
`;

const SidebarTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SidebarList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SidebarItem = styled.li`
  margin-bottom: 0.25rem;
`;

const SidebarLink = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'none'};
  border: none;
  color: ${props => props.active ? 'white' : '#666'};
  text-decoration: none;
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
  
  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e9ecef'};
    color: ${props => props.active ? 'white' : '#6366f1'};
  }
`;

const SectionNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: ${props => props.active ? 'rgba(255,255,255,0.2)' : '#e0e0e0'};
  color: ${props => props.active ? 'white' : '#666'};
  border-radius: 50%;
  font-size: 0.75rem;
  margin-right: 0.5rem;
`;

const MainContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
`;

const SectionIcon = styled.span`
  font-size: 2rem;
`;

const SectionTitle = styled.h2`
  color: #333;
  font-size: 1.8rem;
  margin: 0;
`;

const FAQItem = styled(motion.div)`
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const FAQQuestion = styled.button`
  width: 100%;
  background: ${props => props.isOpen ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f8f9fa'};
  border: none;
  padding: 1.25rem;
  text-align: left;
  font-weight: 600;
  color: ${props => props.isOpen ? 'white' : '#333'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  
  &:hover {
    background: ${props => props.isOpen ? 'linear-gradient(135deg, #5856eb, #7c3aed)' : '#e9ecef'};
  }
`;

const FAQAnswer = styled(motion.div)`
  padding: 1.25rem;
  background: white;
  color: #555;
  line-height: 1.7;
  font-size: 0.95rem;
`;

const ChevronIcon = styled.span`
  transition: transform 0.3s ease;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  font-size: 1.2rem;
`;

const SearchBox = styled.div`
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

// Іконки для розділів FAQ
const sectionIcons = {
  'faq-general': '❓',
  'faq-registration': '📝',
  'faq-courses': '📚',
  'faq-payment': '💳',
  'faq-astrology': '⭐',
  'faq-tarot': '🃏',
  'faq-meditation': '🧘',
  'faq-numerology': '🔢',
  'faq-crystals': '💎',
  'faq-chakras': '🌈',
  'faq-runes': '᛭',
  'faq-energy': '⚡',
  'faq-consultations': '💬',
  'faq-shop': '🛍️',
  'faq-technical': '🔧',
  'faq-privacy': '🔒',
  'faq-community': '👥',
  'faq-certificates': '📜',
  'faq-refund': '💰',
  'faq-support': '🆘'
};

const FAQ = () => {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('faq-general');
  const [sections, setSections] = useState([]);
  const [openItems, setOpenItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFAQContent();
  }, []);

  const loadFAQContent = async () => {
    try {
      setLoading(true);
      
      // Спробуємо завантажити основну FAQ сторінку
      const response = await contentService.getPageBySlug('faq');
      setPageContent(response.data);
      
      // Завантажуємо дочірні сторінки (розділи FAQ)
      const childrenResponse = await contentService.getPageChildren('faq');
      if (childrenResponse.data && childrenResponse.data.length > 0) {
        setSections(childrenResponse.data.map(child => ({
          id: child.slug,
          title: child.title,
          content: child.content,
          icon: sectionIcons[child.slug] || '📋'
        })));
        setActiveSection(childrenResponse.data[0].slug);
      } else {
        // Якщо немає дочірніх сторінок, використовуємо дефолтні 20 розділів
        setSections(getDefault20Sections());
      }
    } catch (err) {
      console.error('Помилка завантаження FAQ:', err);
      setError('Не вдалося завантажити FAQ. Показуємо базовий контент.');
      
      // Використовуємо дефолтні 20 розділів при помилці
      setSections(getDefault20Sections());
    } finally {
      setLoading(false);
    }
  };

  // 20 дефолтних розділів FAQ
  const getDefault20Sections = () => [
    { id: 'faq-general', title: 'Загальні питання', icon: '❓', items: [
      { question: 'Що таке онлайн школа навчання?', answer: 'Це комплексна платформа для вивчення містичних та езотеричних практик з використанням сучасних технологій.' },
      { question: 'Хто може навчатися в школі?', answer: 'Школа відкрита для всіх, хто цікавиться духовним розвитком та езотеричними знаннями.' },
      { question: 'Чи потрібен попередній досвід?', answer: 'Ні, ми маємо курси для початківців та просунутих практиків.' }
    ]},
    { id: 'faq-registration', title: 'Реєстрація та вхід', icon: '📝', items: [
      { question: 'Як зареєструватися на сайті?', answer: 'Натисніть кнопку "Реєстрація" у верхньому меню та заповніть форму з вашими даними.' },
      { question: 'Забув пароль, що робити?', answer: 'Скористайтеся функцією "Забули пароль?" на сторінці входу для відновлення доступу.' },
      { question: 'Чи можна змінити email?', answer: 'Так, ви можете змінити email у налаштуваннях профілю.' }
    ]},
    { id: 'faq-courses', title: 'Курси навчання', icon: '📚', items: [
      { question: 'Скільки курсів доступно?', answer: 'Наразі доступно 4 рівні курсів, кожен з яких містить теоретичну частину, практичні завдання та екзамени.' },
      { question: 'Як довго триває один курс?', answer: 'Тривалість курсу залежить від вашого темпу навчання. В середньому один рівень займає 2-3 місяці.' },
      { question: 'Чи є сертифікат після завершення?', answer: 'Так, після успішного завершення курсу ви отримаєте електронний сертифікат.' }
    ]},
    { id: 'faq-payment', title: 'Оплата та доступ', icon: '💳', items: [
      { question: 'Які способи оплати доступні?', answer: 'Ми приймаємо оплату через Stripe (міжнародні картки) та LiqPay (українські картки).' },
      { question: 'Чи можна оплатити частинами?', answer: 'Так, для деяких курсів доступна оплата частинами.' },
      { question: 'Як довго діє доступ до курсу?', answer: 'Доступ до курсу безстроковий після оплати.' }
    ]},
    { id: 'faq-astrology', title: 'Астрологія', icon: '⭐', items: [
      { question: 'Що таке натальна карта?', answer: 'Натальна карта - це астрологічна карта, побудована на момент вашого народження, яка показує розташування планет.' },
      { question: 'Як розрахувати натальну карту?', answer: 'Скористайтеся нашим астрологічним калькулятором у розділі "АСТРО".' },
      { question: 'Чи потрібен точний час народження?', answer: 'Так, для точного розрахунку потрібен час народження з точністю до хвилини.' }
    ]},
    { id: 'faq-tarot', title: 'Таро', icon: '🃏', items: [
      { question: 'Що таке карти Таро?', answer: 'Таро - це система символів, яка використовується для самопізнання, медитації та отримання інсайтів.' },
      { question: 'Чи можна навчитися Таро самостійно?', answer: 'Так, наші курси допоможуть вам освоїти Таро крок за кроком.' },
      { question: 'Яку колоду Таро обрати початківцю?', answer: 'Рекомендуємо почати з класичної колоди Райдера-Уейта.' }
    ]},
    { id: 'faq-meditation', title: 'Медитація', icon: '🧘', items: [
      { question: 'Як почати медитувати?', answer: 'Почніть з простих дихальних практик по 5-10 хвилин щодня.' },
      { question: 'Скільки часу потрібно медитувати?', answer: 'Для початківців достатньо 10-15 хвилин на день.' },
      { question: 'Чи є аудіо-медитації?', answer: 'Так, в наших курсах є аудіо-супровід для медитацій.' }
    ]},
    { id: 'faq-numerology', title: 'Нумерологія', icon: '🔢', items: [
      { question: 'Що таке нумерологія?', answer: 'Нумерологія - це система знань про вплив чисел на життя людини.' },
      { question: 'Як розрахувати число долі?', answer: 'Число долі розраховується шляхом додавання всіх цифр дати народження.' },
      { question: 'Чи впливають числа на характер?', answer: 'Згідно з нумерологією, числа відображають певні якості та тенденції.' }
    ]},
    { id: 'faq-crystals', title: 'Кристали', icon: '💎', items: [
      { question: 'Як обрати кристал?', answer: 'Обирайте кристал інтуїтивно або за його властивостями відповідно до ваших потреб.' },
      { question: 'Як очистити кристал?', answer: 'Кристали можна очищати водою, сіллю, димом шавлії або місячним світлом.' },
      { question: 'Де купити справжні кристали?', answer: 'В нашому магазині артефактів представлені сертифіковані натуральні кристали.' }
    ]},
    { id: 'faq-chakras', title: 'Чакри', icon: '🌈', items: [
      { question: 'Що таке чакри?', answer: 'Чакри - це енергетичні центри в тілі людини, кожен з яких відповідає за певні аспекти життя.' },
      { question: 'Скільки основних чакр?', answer: 'Існує 7 основних чакр, розташованих вздовж хребта.' },
      { question: 'Як відкрити чакри?', answer: 'Чакри можна активувати через медитацію, йогу, звукотерапію та інші практики.' }
    ]},
    { id: 'faq-runes', title: 'Руни', icon: '᛭', items: [
      { question: 'Що таке руни?', answer: 'Руни - це древні символи германських народів, які використовуються для гадання та магічних практик.' },
      { question: 'Скільки рун у Футарку?', answer: 'Старший Футарк містить 24 руни, кожна з яких має своє значення.' },
      { question: 'Як навчитися читати руни?', answer: 'Наші курси включають детальне вивчення рунічної системи.' }
    ]},
    { id: 'faq-energy', title: 'Енергетичні практики', icon: '⚡', items: [
      { question: 'Що таке енергетичне цілительство?', answer: 'Це практики роботи з тонкими енергіями для відновлення балансу та здоров\'я.' },
      { question: 'Чи безпечні енергетичні практики?', answer: 'Так, при правильному підході та під керівництвом досвідченого наставника.' },
      { question: 'Як відчути енергію?', answer: 'Починайте з простих вправ на відчуття енергії між долонями.' }
    ]},
    { id: 'faq-consultations', title: 'Консультації', icon: '💬', items: [
      { question: 'Які види консультацій доступні?', answer: 'Ми пропонуємо астрологічні, таро та комплексні консультації.' },
      { question: 'Як записатися на консультацію?', answer: 'Оберіть тип консультації в розділі "Консультації" та оплатіть сесію.' },
      { question: 'Скільки триває консультація?', answer: 'Стандартна консультація триває 60 хвилин.' }
    ]},
    { id: 'faq-shop', title: 'Магазин артефактів', icon: '🛍️', items: [
      { question: 'Що продається в магазині?', answer: 'Кристали, карти Таро, руни, свічки, аромамасла та інші езотеричні товари.' },
      { question: 'Як здійснюється доставка?', answer: 'Доставка здійснюється Новою Поштою або Укрпоштою по всій Україні.' },
      { question: 'Чи можна повернути товар?', answer: 'Так, протягом 14 днів за умови збереження товарного вигляду.' }
    ]},
    { id: 'faq-technical', title: 'Технічні питання', icon: '🔧', items: [
      { question: 'Які браузери підтримуються?', answer: 'Рекомендуємо Chrome, Firefox, Safari або Edge останніх версій.' },
      { question: 'Чи працює сайт на мобільних?', answer: 'Так, сайт повністю адаптований для мобільних пристроїв.' },
      { question: 'Що робити, якщо відео не завантажується?', answer: 'Перевірте інтернет-з\'єднання та спробуйте оновити сторінку.' }
    ]},
    { id: 'faq-privacy', title: 'Конфіденційність', icon: '🔒', items: [
      { question: 'Як захищені мої дані?', answer: 'Ми використовуємо шифрування та сучасні методи захисту даних.' },
      { question: 'Чи передаються дані третім особам?', answer: 'Ні, ваші персональні дані не передаються третім особам.' },
      { question: 'Як видалити свій акаунт?', answer: 'Зверніться до служби підтримки для видалення акаунту.' }
    ]},
    { id: 'faq-community', title: 'Спільнота', icon: '👥', items: [
      { question: 'Чи є спільнота учнів?', answer: 'Так, ми маємо Telegram-канал та групу для спілкування учнів.' },
      { question: 'Чи проводяться живі зустрічі?', answer: 'Періодично проводяться онлайн-зустрічі та вебінари.' },
      { question: 'Як приєднатися до спільноти?', answer: 'Посилання на спільноту доступне після реєстрації на курс.' }
    ]},
    { id: 'faq-certificates', title: 'Сертифікати', icon: '📜', items: [
      { question: 'Чи видаються сертифікати?', answer: 'Так, після успішного завершення курсу ви отримаєте електронний сертифікат.' },
      { question: 'Чи визнаються сертифікати?', answer: 'Наші сертифікати підтверджують проходження навчання в нашій школі.' },
      { question: 'Як отримати сертифікат?', answer: 'Сертифікат автоматично генерується після складання фінального екзамену.' }
    ]},
    { id: 'faq-refund', title: 'Повернення коштів', icon: '💰', items: [
      { question: 'Чи можна повернути кошти за курс?', answer: 'Так, протягом 14 днів після покупки, якщо ви пройшли менше 20% курсу.' },
      { question: 'Як оформити повернення?', answer: 'Зверніться до служби підтримки з вашим запитом.' },
      { question: 'Скільки часу займає повернення?', answer: 'Повернення коштів здійснюється протягом 5-7 робочих днів.' }
    ]},
    { id: 'faq-support', title: 'Підтримка', icon: '🆘', items: [
      { question: 'Як зв\'язатися з підтримкою?', answer: 'Напишіть на email support@school.com або через форму "Спитати автора".' },
      { question: 'Який час роботи підтримки?', answer: 'Підтримка працює з 9:00 до 18:00 за київським часом.' },
      { question: 'Скільки чекати на відповідь?', answer: 'Зазвичай відповідь надходить протягом 24 годин.' }
    ]}
  ];

  const getCurrentSectionContent = () => {
    const currentSection = sections.find(s => s.id === activeSection);
    if (!currentSection) return [];
    
    // Якщо є content з blocks, використовуємо його
    if (currentSection.content?.blocks?.[0]?.items) {
      return currentSection.content.blocks[0].items;
    }
    // Інакше використовуємо items напряму
    return currentSection.items || [];
  };

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const filteredItems = () => {
    const items = getCurrentSectionContent();
    if (!searchTerm) return items;
    
    return items.filter(item => 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '2rem', display: 'inline-block' }}
          >
            ⏳
          </motion.div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Завантаження FAQ...</p>
        </div>
      </Container>
    );
  }

  const currentSection = sections.find(s => s.id === activeSection);
  const items = filteredItems();

  return (
    <Container>
      <Hero
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Title>Часті питання</Title>
        <Subtitle>
          Знайдіть відповіді на найпоширеніші питання про нашу школу, курси та послуги. 
          Оберіть розділ з меню або скористайтеся пошуком.
        </Subtitle>
      </Hero>
      
      <ContentWrapper>
        <Sidebar>
          <SidebarTitle>📋 Розділи ({sections.length})</SidebarTitle>
          <SidebarList>
            {sections.map((section, index) => (
              <SidebarItem key={section.id}>
                <SidebarLink
                  active={activeSection === section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setOpenItems({});
                    setSearchTerm('');
                  }}
                >
                  <SectionNumber active={activeSection === section.id}>
                    {index + 1}
                  </SectionNumber>
                  {section.icon || sectionIcons[section.id] || '📋'} {section.title}
                </SidebarLink>
              </SidebarItem>
            ))}
          </SidebarList>
        </Sidebar>
        
        <MainContent>
          {error && (
            <div style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              color: '#856404'
            }}>
              {error}
            </div>
          )}
          
          <SectionHeader>
            <SectionIcon>
              {currentSection?.icon || sectionIcons[activeSection] || '📋'}
            </SectionIcon>
            <SectionTitle>
              {currentSection?.title || 'FAQ'}
            </SectionTitle>
          </SectionHeader>
          
          <SearchBox>
            <SearchInput
              type="text"
              placeholder="🔍 Пошук у цьому розділі..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBox>
          
          {items.length === 0 ? (
            <NoResults>
              <p>😕 Нічого не знайдено за запитом "{searchTerm}"</p>
              <button 
                onClick={() => setSearchTerm('')}
                style={{ 
                  marginTop: '1rem', 
                  padding: '0.5rem 1rem', 
                  background: '#6366f1', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Очистити пошук
              </button>
            </NoResults>
          ) : (
            <AnimatePresence>
              {items.map((item, index) => (
                <FAQItem
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <FAQQuestion
                    isOpen={openItems[index]}
                    onClick={() => toggleItem(index)}
                  >
                    <span>{item.question}</span>
                    <ChevronIcon isOpen={openItems[index]}>▼</ChevronIcon>
                  </FAQQuestion>
                  
                  <AnimatePresence>
                    {openItems[index] && (
                      <FAQAnswer
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {item.answer}
                      </FAQAnswer>
                    )}
                  </AnimatePresence>
                </FAQItem>
              ))}
            </AnimatePresence>
          )}
        </MainContent>
      </ContentWrapper>
    </Container>
  );
};

export default FAQ;