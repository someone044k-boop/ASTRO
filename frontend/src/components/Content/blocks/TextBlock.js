import React from 'react';
import './TextBlock.css';

const TextBlock = ({ data, index }) => {
  const {
    content = '',
    style = {},
    alignment = 'left',
    background_color,
    text_color,
    font_size = 'medium',
    font_weight = 'normal'
  } = data;

  const blockStyle = {
    textAlign: alignment,
    backgroundColor: background_color,
    color: text_color,
    fontSize: getFontSize(font_size),
    fontWeight: font_weight,
    ...style
  };

  function getFontSize(size) {
    const sizes = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'xl': '24px',
      'xxl': '32px'
    };
    return sizes[size] || sizes.medium;
  }

  // Обробка HTML контенту (безпечно)
  const createMarkup = () => {
    // Базова санітизація HTML
    const sanitizedContent = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
    
    return { __html: sanitizedContent };
  };

  return (
    <div 
      className={`rich-text-block text-block text-block-${font_size}`}
      style={blockStyle}
    >
      {content.includes('<') ? (
        <div dangerouslySetInnerHTML={createMarkup()} />
      ) : (
        <p>{content}</p>
      )}
    </div>
  );
};

export default TextBlock;