import React, { useState } from 'react';
import './VideoBlock.css';

const VideoBlock = ({ data, index }) => {
  const {
    src,
    poster = '',
    caption = '',
    width = '100%',
    height = 'auto',
    controls = true,
    autoplay = false,
    muted = false,
    loop = false
  } = data;

  const [videoError, setVideoError] = useState(false);

  const handleVideoError = () => {
    setVideoError(true);
  };

  if (!src) {
    return (
      <div className="rich-text-block video-block video-block-error">
        <p>Відео не вказано</p>
      </div>
    );
  }

  if (videoError) {
    return (
      <div className="rich-text-block video-block video-block-error">
        <p>Помилка завантаження відео</p>
        {caption && <p className="video-caption">{caption}</p>}
      </div>
    );
  }

  return (
    <div className="rich-text-block video-block">
      <div className="video-container">
        <video
          src={src}
          poster={poster}
          width={width}
          height={height}
          controls={controls}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          onError={handleVideoError}
          className="video-content"
        >
          Ваш браузер не підтримує відео.
        </video>
      </div>
      {caption && (
        <p className="video-caption">{caption}</p>
      )}
    </div>
  );
};

export default VideoBlock;