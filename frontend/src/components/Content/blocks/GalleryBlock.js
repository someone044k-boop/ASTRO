import React, { useState } from 'react';
import './GalleryBlock.css';

const GalleryBlock = ({ data, index }) => {
  const {
    images = [],
    layout = 'grid', // grid, carousel, masonry
    columns = 3,
    show_captions = true,
    lightbox = true,
    title = ''
  } = data;

  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (image, idx) => {
    if (lightbox) {
      setSelectedImage(image);
      setCurrentIndex(idx);
    }
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const nextIdx = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIdx]);
    setCurrentIndex(nextIdx);
  };

  const prevImage = () => {
    const prevIdx = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setSelectedImage(images[prevIdx]);
    setCurrentIndex(prevIdx);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  };

  if (!images || images.length === 0) {
    return (
      <div className="rich-text-block gallery-block gallery-block-error">
        <p>Зображення для галереї не вказані</p>
      </div>
    );
  }

  return (
    <div className="rich-text-block gallery-block">
      {title && <h3 className="gallery-title">{title}</h3>}
      
      <div className={`gallery-container gallery-layout-${layout}`}>
        <div 
          className="gallery-grid"
          style={{ 
            gridTemplateColumns: layout === 'grid' ? `repeat(${columns}, 1fr)` : 'none'
          }}
        >
          {images.map((image, idx) => (
            <div 
              key={idx} 
              className="gallery-item"
              onClick={() => openLightbox(image, idx)}
            >
              <div className="gallery-image-container">
                <img
                  src={image.src || image.url}
                  alt={image.alt || `Зображення ${idx + 1}`}
                  className="gallery-image"
                  loading="lazy"
                />
                {lightbox && (
                  <div className="gallery-overlay">
                    <span className="gallery-zoom-icon">🔍</span>
                  </div>
                )}
              </div>
              {show_captions && image.caption && (
                <p className="gallery-caption">{image.caption}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="gallery-lightbox"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              ×
            </button>
            
            {images.length > 1 && (
              <>
                <button className="lightbox-prev" onClick={prevImage}>
                  ‹
                </button>
                <button className="lightbox-next" onClick={nextImage}>
                  ›
                </button>
              </>
            )}
            
            <img
              src={selectedImage.src || selectedImage.url}
              alt={selectedImage.alt || 'Зображення'}
              className="lightbox-image"
            />
            
            {selectedImage.caption && (
              <p className="lightbox-caption">{selectedImage.caption}</p>
            )}
            
            <div className="lightbox-counter">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryBlock;