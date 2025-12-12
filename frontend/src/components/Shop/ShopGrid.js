import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import './ShopGrid.css';

const ShopGrid = ({ products, loading, onAddToCart, onViewDetails }) => {
  const [animatedProducts, setAnimatedProducts] = useState([]);

  useEffect(() => {
    if (products && products.length > 0) {
      // Анімація появи товарів з затримкою
      setAnimatedProducts([]);
      products.forEach((product, index) => {
        setTimeout(() => {
          setAnimatedProducts(prev => [...prev, product.id]);
        }, index * 100);
      });
    }
  }, [products]);

  if (loading) {
    return (
      <div className="shop-grid-loading">
        <div className="loading-container">
          <div className="magical-loader">
            <div className="loader-orb"></div>
            <div className="loader-orb"></div>
            <div className="loader-orb"></div>
          </div>
          <p className="loading-text">Завантаження магічних артефактів...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="shop-grid-empty">
        <div className="empty-container">
          <div className="empty-icon">🔮</div>
          <h3>Артефакти не знайдено</h3>
          <p>У цій категорії поки що немає доступних товарів.</p>
          <p>Спробуйте вибрати іншу категорію або поверніться пізніше.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-grid">
      <div className="shop-grid-header">
        <h2>Магічні Артефакти</h2>
        <p className="products-count">
          Знайдено {products.length} {products.length === 1 ? 'артефакт' : 'артефактів'}
        </p>
      </div>
      
      <div className="products-grid">
        {products.map((product, index) => (
          <div 
            key={product.id}
            className={`product-grid-item ${
              animatedProducts.includes(product.id) ? 'animated' : ''
            }`}
            style={{ 
              animationDelay: `${index * 0.1}s` 
            }}
          >
            <ProductCard
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
            />
          </div>
        ))}
      </div>
      
      <div className="grid-magical-background">
        <div className="magical-grid-particle"></div>
        <div className="magical-grid-particle"></div>
        <div className="magical-grid-particle"></div>
        <div className="magical-grid-particle"></div>
        <div className="magical-grid-particle"></div>
      </div>
    </div>
  );
};

export default ShopGrid;