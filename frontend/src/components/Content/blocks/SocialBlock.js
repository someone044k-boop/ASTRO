import React from 'react';
import './SocialBlock.css';

const SocialBlock = ({ data, index }) => {
  const {
    platforms = [],
    title = 'Слідкуйте за нами',
    layout = 'horizontal', // horizontal, vertical, grid
    icon_size = 'medium',
    show_labels = true
  } = data;

  const getSocialIcon = (platform) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      youtube: '📺',
      telegram: '✈️',
      tiktok: '🎵',
      linkedin: '💼',
      whatsapp: '💬'
    };
    return icons[platform.toLowerCase()] || '🔗';
  };

  const getSocialColor = (platform) => {
    const colors = {
      facebook: '#1877f2',
      instagram: '#e4405f',
      twitter: '#1da1f2',
      youtube: '#ff0000',
      telegram: '#0088cc',
      tiktok: '#000000',
      linkedin: '#0077b5',
      whatsapp: '#25d366'
    };
    return colors[platform.toLowerCase()] || '#333333';
  };

  if (!platforms || platforms.length === 0) {
    return (
      <div className="rich-text-block social-block social-block-error">
        <p>Соціальні мережі не вказані</p>
      </div>
    );
  }

  return (
    <div className="rich-text-block social-block">
      {title && <h4 className="social-title">{title}</h4>}
      <div className={`social-links social-layout-${layout} social-size-${icon_size}`}>
        {platforms.map((platform, idx) => (
          <a
            key={idx}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            style={{ '--social-color': getSocialColor(platform.name) }}
            title={platform.name}
          >
            <span className="social-icon">
              {getSocialIcon(platform.name)}
            </span>
            {show_labels && (
              <span className="social-label">{platform.name}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialBlock;