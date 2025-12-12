import React from 'react';
import './HeroBlock.css';

const HeroBlock = ({ data, index }) => {
  const {
    title = '',
    subtitle = '',
    background_image = '',
    background_color = '#f8f9fa',
    text_color = '#333',
    button_text = '',
    button_url = '',
    button_style = 'primary',
    alignment = 'center',
    height = 'medium',
    overlay_opacity = 0.5
  } = data;

  const heroStyle = {
    backgroundColor: background_color,
    color: text_color,
    textAlign: alignment,
    backgroundImage: background_image ? `url(${background_image})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${overlay_opacity})`,
    display: background_image ? 'block' : 'none'
  };

  const getHeightClass = () => {
    const heights = {
      small: 'hero-height-small',
      medium: 'hero-height-medium',
      large: 'hero-height-large',
      full: 'hero-height-full'
    };
    return heights[height] || heights.medium;
  };

  return (
    <div 
      className={`rich-text-block hero-block ${getHeightClass()}`}
      style={heroStyle}
    >
      <div className="hero-overlay" style={overlayStyle}></div>
      
      <div className="hero-content">
        {title && (
          <h1 className="hero-title">{title}</h1>
        )}
        
        {subtitle && (
          <p className="hero-subtitle">{subtitle}</p>
        )}
        
        {button_text && button_url && (
          <div className="hero-actions">
            <a 
              href={button_url}
              className={`hero-button hero-button-${button_style}`}
              target={button_url.startsWith('http') ? '_blank' : '_self'}
              rel={button_url.startsWith('http') ? 'noopener noreferrer' : ''}
            >
              {button_text}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroBlock;