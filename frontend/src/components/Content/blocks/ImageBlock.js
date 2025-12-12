import React, { useState } from 'react';
import './ImageBlock.css';

const ImageBlock = ({ data, index }) => {
  const {
    src,
    alt = '',
    caption = '',
    width = 'auto',
    height = 'auto',
    alignment = 'center',
    border_radius = '8px',
    shadow = false,
    lazy_loading = true
  } = data;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageStyle = {
    width: width === 'auto' ? 'auto' : width,
    height: height === 'auto' ? 'auto' : height,
    borderRadius: border_radius,
    boxShadow: shadow ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'
  };

  const containerStyle = {
    textAlign: alignment
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (!src) {
    return (
      <div className="rich-text-block image-block image-block-error">
        <p>Зображення не вказано</p>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="rich-text-block image-block image-block-error">
        <p>Помилка завантаження зображення</p>
        {caption && <p className="image-caption">{caption}</p>}
      </div>
    );
  }

  return (
    <div className="rich-text-block image-block" style={containerStyle}>
      <div className="image-container">
        {!imageLoaded && (
          <div className="image-placeholder">
            <div className="image-loading">Завантаження...</div>
          </div>
        )}
        <img
          src={src}
          alt={alt}
          style={imageStyle}
          className={`image-content ${imageLoaded ? 'loaded' : 'loading'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={lazy_loading ? 'lazy' : 'eager'}
        />
      </div>
      {caption && (
        <p className="image-caption">{caption}</p>
      )}
    </div>
  );
};

export default ImageBlock;