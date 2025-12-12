import React, { useEffect, useState } from 'react';
import './TelegramBlock.css';

const TelegramBlock = ({ data, index }) => {
  const {
    channel_username,
    widget_height = 400,
    show_header = true,
    show_avatar = true,
    show_cover = true,
    color_scheme = 'light' // light, dark
  } = data;

  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [widgetError, setWidgetError] = useState(false);

  useEffect(() => {
    if (!channel_username) {
      setWidgetError(true);
      return;
    }

    // Завантаження Telegram Widget скрипту
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.onload = () => {
      setWidgetLoaded(true);
    };
    script.onerror = () => {
      setWidgetError(true);
    };

    document.head.appendChild(script);

    return () => {
      // Очищення скрипту при демонтажі компонента
      const existingScript = document.querySelector('script[src*="telegram-widget"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [channel_username]);

  if (!channel_username) {
    return (
      <div className="rich-text-block telegram-block telegram-block-error">
        <p>Telegram канал не вказано</p>
      </div>
    );
  }

  if (widgetError) {
    return (
      <div className="rich-text-block telegram-block telegram-block-error">
        <p>Помилка завантаження Telegram віджету</p>
        <p>Канал: @{channel_username}</p>
      </div>
    );
  }

  return (
    <div className="rich-text-block telegram-block">
      <div className="telegram-widget-container">
        {!widgetLoaded && (
          <div className="telegram-loading">
            <div className="loading-spinner"></div>
            <p>Завантаження Telegram каналу...</p>
          </div>
        )}
        
        <script
          async
          src="https://telegram.org/js/telegram-widget.js?22"
          data-telegram-post={`${channel_username}/1`}
          data-width="100%"
          data-userpic={show_avatar ? 'true' : 'false'}
          data-color={color_scheme === 'dark' ? '343638' : 'ffffff'}
          data-dark={color_scheme === 'dark' ? '1' : '0'}
        ></script>

        {/* Альтернативний віджет для каналу */}
        <div 
          className="telegram-channel-widget"
          style={{ 
            height: `${widget_height}px`,
            display: widgetLoaded ? 'block' : 'none'
          }}
        >
          <iframe
            src={`https://t.me/${channel_username}?embed=1&userpic=${show_avatar}&color=${color_scheme}`}
            width="100%"
            height={widget_height}
            frameBorder="0"
            scrolling="no"
            style={{ 
              border: 'none',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
            title={`Telegram канал @${channel_username}`}
          ></iframe>
        </div>
      </div>
      
      <div className="telegram-info">
        <p>
          <strong>Telegram канал:</strong> 
          <a 
            href={`https://t.me/${channel_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="telegram-link"
          >
            @{channel_username}
          </a>
        </p>
      </div>
    </div>
  );
};

export default TelegramBlock;