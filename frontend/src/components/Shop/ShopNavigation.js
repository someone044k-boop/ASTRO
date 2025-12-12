import React, { useState, useEffect } from 'react';
import './ShopNavigation.css';

const ShopNavigation = ({ categories, activeCategory, onCategoryChange }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCategoryClick = (category) => {
    if (category !== activeCategory) {
      setIsLoading(true);
      onCategoryChange(category);
      
      // Симуляція завантаження для плавного переходу
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  return (
    <div className="shop-navigation">
      <div className="shop-nav-header">
        <h3>Категорії Артефактів</h3>
      </div>
      
      <nav className="shop-nav-menu">
        <ul className="shop-nav-list">
          <li className={`shop-nav-item ${activeCategory === 'all' ? 'active' : ''}`}>
            <button 
              className="shop-nav-link"
              onClick={() => handleCategoryClick('all')}
              disabled={isLoading}
            >
              <span className="nav-icon">🔮</span>
              Всі Артефакти
            </button>
          </li>
          
          {categories.map((category, index) => (
            <li 
              key={category} 
              className={`shop-nav-item ${activeCategory === category ? 'active' : ''}`}
            >
              <button 
                className="shop-nav-link"
                onClick={() => handleCategoryClick(category)}
                disabled={isLoading}
              >
                <span className="nav-icon">
                  {getCategoryIcon(category)}
                </span>
                {formatCategoryName(category)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {isLoading && (
        <div className="shop-nav-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

// Функція для отримання іконки категорії
const getCategoryIcon = (category) => {
  const icons = {
    'амулети': '🧿',
    'кристали': '💎',
    'свічки': '🕯️',
    'таро': '🃏',
    'рунічні-камені': '🪨',
    'магічні-інструменти': '🔮',
    'книги': '📚',
    'олії': '🫙',
    'трави': '🌿',
    'мінерали': '💠',
    'талісмани': '🪬',
    'ритуальні-предмети': '⚱️'
  };
  
  return icons[category] || '✨';
};

// Функція для форматування назви категорії
const formatCategoryName = (category) => {
  const names = {
    'амулети': 'Амулети',
    'кристали': 'Кристали',
    'свічки': 'Свічки',
    'таро': 'Карти Таро',
    'рунічні-камені': 'Рунічні Камені',
    'магічні-інструменти': 'Магічні Інструменти',
    'книги': 'Книги',
    'олії': 'Ефірні Олії',
    'трави': 'Магічні Трави',
    'мінерали': 'Мінерали',
    'талісмани': 'Талісмани',
    'ритуальні-предмети': 'Ритуальні Предмети'
  };
  
  return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

export default ShopNavigation;