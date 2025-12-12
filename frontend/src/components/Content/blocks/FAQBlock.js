import React, { useState } from 'react';
import './FAQBlock.css';

const FAQBlock = ({ data, index }) => {
  const {
    items = [],
    title = 'Часті питання',
    allow_multiple_open = false,
    default_open = null
  } = data;

  const [openItems, setOpenItems] = useState(() => {
    if (default_open !== null && items[default_open]) {
      return new Set([default_open]);
    }
    return new Set();
  });

  const toggleItem = (itemIndex) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(itemIndex)) {
        newSet.delete(itemIndex);
      } else {
        if (!allow_multiple_open) {
          newSet.clear();
        }
        newSet.add(itemIndex);
      }
      
      return newSet;
    });
  };

  if (!items || items.length === 0) {
    return (
      <div className="rich-text-block faq-block faq-block-error">
        <p>FAQ елементи не вказані</p>
      </div>
    );
  }

  return (
    <div className="rich-text-block faq-block">
      {title && <h3 className="faq-title">{title}</h3>}
      
      <div className="faq-items">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className={`faq-item ${openItems.has(idx) ? 'open' : ''}`}
          >
            <button
              className="faq-question"
              onClick={() => toggleItem(idx)}
              aria-expanded={openItems.has(idx)}
              aria-controls={`faq-answer-${index}-${idx}`}
            >
              <span className="faq-question-text">{item.question}</span>
              <span className="faq-toggle-icon">
                {openItems.has(idx) ? '−' : '+'}
              </span>
            </button>
            
            <div 
              id={`faq-answer-${index}-${idx}`}
              className="faq-answer"
              style={{
                maxHeight: openItems.has(idx) ? '1000px' : '0',
                opacity: openItems.has(idx) ? '1' : '0'
              }}
            >
              <div className="faq-answer-content">
                {typeof item.answer === 'string' ? (
                  <p>{item.answer}</p>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQBlock;