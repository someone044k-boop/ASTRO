import React, { useState } from 'react';
import './YouTubeBlock.css';

const YouTubeBlock = ({ data, index }) => {
  const {
    video_id,
    video_url,
    title = '',
    width = '100%',
    height = '315',
    autoplay = false,
    controls = true,
    mute = false,
    start_time = 0,
    show_info = true,
    privacy_enhanced = true
  } = data;

  const [videoError, setVideoError] = useState(false);

  // Витягування video_id з URL якщо не вказано окремо
  const getVideoId = () => {
    if (video_id) return video_id;
    
    if (video_url) {
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = video_url.match(regex);
      return match ? match[1] : null;
    }
    
    return null;
  };

  const videoIdToUse = getVideoId();

  if (!videoIdToUse) {
    return (
      <div className="rich-text-block youtube-block youtube-block-error">
        <p>YouTube відео не вказано або невірний формат URL</p>
      </div>
    );
  }

  // Формування параметрів для embed URL
  const embedParams = new URLSearchParams();
  if (autoplay) embedParams.append('autoplay', '1');
  if (!controls) embedParams.append('controls', '0');
  if (mute) embedParams.append('mute', '1');
  if (start_time > 0) embedParams.append('start', start_time.toString());
  if (!show_info) embedParams.append('showinfo', '0');
  
  const baseUrl = privacy_enhanced 
    ? 'https://www.youtube-nocookie.com/embed/' 
    : 'https://www.youtube.com/embed/';
  
  const embedUrl = `${baseUrl}${videoIdToUse}?${embedParams.toString()}`;

  const handleIframeError = () => {
    setVideoError(true);
  };

  if (videoError) {
    return (
      <div className="rich-text-block youtube-block youtube-block-error">
        <p>Помилка завантаження YouTube відео</p>
        <p>
          <a 
            href={`https://www.youtube.com/watch?v=${videoIdToUse}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Переглянути на YouTube
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="rich-text-block youtube-block">
      {title && <h4 className="youtube-title">{title}</h4>}
      
      <div className="youtube-container">
        <div className="youtube-wrapper">
          <iframe
            width={width}
            height={height}
            src={embedUrl}
            title={title || `YouTube відео ${videoIdToUse}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={handleIframeError}
            className="youtube-iframe"
          ></iframe>
        </div>
      </div>
      
      <div className="youtube-info">
        <a 
          href={`https://www.youtube.com/watch?v=${videoIdToUse}`}
          target="_blank"
          rel="noopener noreferrer"
          className="youtube-link"
        >
          Переглянути на YouTube
        </a>
      </div>
    </div>
  );
};

export default YouTubeBlock;