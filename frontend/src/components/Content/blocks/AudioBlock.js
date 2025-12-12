import React, { useState } from 'react';
import './AudioBlock.css';

const AudioBlock = ({ data, index }) => {
  const {
    src,
    title = '',
    caption = '',
    controls = true,
    autoplay = false,
    loop = false,
    preload = 'metadata'
  } = data;

  const [audioError, setAudioError] = useState(false);

  const handleAudioError = () => {
    setAudioError(true);
  };

  if (!src) {
    return (
      <div className="rich-text-block audio-block audio-block-error">
        <p>Аудіо не вказано</p>
      </div>
    );
  }

  if (audioError) {
    return (
      <div className="rich-text-block audio-block audio-block-error">
        <p>Помилка завантаження аудіо</p>
        {caption && <p className="audio-caption">{caption}</p>}
      </div>
    );
  }

  return (
    <div className="rich-text-block audio-block">
      {title && <h4 className="audio-title">{title}</h4>}
      <div className="audio-container">
        <audio
          src={src}
          controls={controls}
          autoPlay={autoplay}
          loop={loop}
          preload={preload}
          onError={handleAudioError}
          className="audio-content"
        >
          Ваш браузер не підтримує аудіо.
        </audio>
      </div>
      {caption && (
        <p className="audio-caption">{caption}</p>
      )}
    </div>
  );
};

export default AudioBlock;