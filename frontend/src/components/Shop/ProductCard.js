import React, { useState } from 'react';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart, onViewDetails }) => {
  const [isRotating, setIsRotating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleCardClick = () => {
    // Запускаємо анімацію обертання (1 секунда за годинниковою стрілкою)
    setIsRotating(true);
    
    setTimeout(() => {
      setIsRotating(false);
      if (onViewDetails) {
        onViewDetails(product);
      }
    }, 1000);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Запобігаємо спрацьовуванню onClick карточки
    
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getMainImage = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0].url || product.images[0];
    }
    return '/images/placeholder-product.jpg';
  };

  const isAvailable = product.inventory_count > 0 && product.status === 'active';

  return (
    <div 
      className={`product-card ${isRotating ? 'rotating' : ''} ${!isAvailable ? 'unavailable' : ''}`}
      onClick={handleCardClick}
    >
      <div className="product-image-container">
        <img 
          src={getMainImage()}
          alt={product.name}
          className={`product-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = '/images/placeholder-product.jpg';
            setImageLoaded(true);
          }}
        />
        
        {!isAvailable && (
          <div className="product-unavailable-overlay">
            <span>Немає в наявності</span>
          </div>
        )}
        
        <div className="product-category-badge">
          {product.category}
        </div>
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        <p className="product-description">
          {product.description && product.description.length > 100
            ? `${product.description.substring(0, 100)}...`
            : product.description || 'Опис товару буде додано незабаром'
          }
        </p>
        
        <div className="product-footer">
          <div className="product-price">
            <span className="price-amount">{formatPrice(product.price)}</span>
            {product.inventory_count <= 5 && product.inventory_count > 0 && (
              <span className="stock-warning">
                Залишилось: {product.inventory_count}
              </span>
            )}
          </div>
          
          <button 
            className={`add-to-cart-btn ${!isAvailable ? 'disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={!isAvailable || isRotating}
          >
            {isAvailable ? (
              <>
                <span className="btn-icon">🛒</span>
                Купити
              </>
            ) : (
              <>
                <span className="btn-icon">❌</span>
                Недоступно
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="product-magical-effects">
        <div className="magical-particle"></div>
        <div className="magical-particle"></div>
        <div className="magical-particle"></div>
      </div>
    </div>
  );
};

export default ProductCard;