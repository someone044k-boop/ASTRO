import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ShopNavigation from '../../components/Shop/ShopNavigation';
import ShopGrid from '../../components/Shop/ShopGrid';
import ShoppingCart from '../../components/Shop/ShoppingCart';
import { shopService } from '../../services/shopService';
import './ShopPage.css';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  
  const { user } = useSelector(state => state.auth);

  // Завантаження категорій при ініціалізації
  useEffect(() => {
    loadCategories();
  }, []);

  // Завантаження товарів при зміні категорії
  useEffect(() => {
    loadProducts();
  }, [activeCategory]);

  const loadCategories = async () => {
    try {
      const response = await shopService.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Помилка завантаження категорій:', error);
      setError('Не вдалося завантажити категорії');
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = activeCategory === 'all' ? {} : { category: activeCategory };
      const response = await shopService.getProducts(params);
      
      if (response.success) {
        setProducts(response.data);
      } else {
        setError('Не вдалося завантажити товари');
      }
    } catch (error) {
      console.error('Помилка завантаження товарів:', error);
      setError('Помилка при завантаженні товарів');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      // Перенаправляємо на сторінку входу
      alert('Для покупки товарів необхідно увійти в систему');
      return;
    }

    try {
      // Додаємо товар до локального кошика
      const existingItem = cart.find(item => item.product_id === product.id);
      
      if (existingItem) {
        setCart(cart.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setCart([...cart, {
          product_id: product.id,
          product: product,
          quantity: 1,
          unit_price: product.price
        }]);
      }

      // Показуємо повідомлення про успішне додавання
      showNotification(`${product.name} додано до кошика`, 'success');
    } catch (error) {
      console.error('Помилка додавання до кошика:', error);
      showNotification('Помилка при додаванні товару до кошика', 'error');
    }
  };

  const handleViewDetails = (product) => {
    // Тут можна відкрити модальне вікно з деталями товару
    // або перейти на окрему сторінку товару
    console.log('Переглянути деталі товару:', product);
  };

  const handleUpdateCart = (productId, newQuantity) => {
    setCart(cart.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const handleCheckout = (orderData) => {
    showNotification(`Замовлення #${orderData.id} успішно створено!`, 'success');
    console.log('Створено замовлення:', orderData);
  };

  const showNotification = (message, type = 'info') => {
    // Простий спосіб показати повідомлення
    // В реальному проекті краще використовувати toast бібліотеку
    const notification = document.createElement('div');
    notification.className = `shop-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  return (
    <div className="shop-page">
      <div className="shop-container">
        <header className="shop-header">
          <div className="shop-title-section">
            <h1 className="shop-title">Магазин Містичних Артефактів</h1>
            <p className="shop-subtitle">
              Відкрийте для себе унікальні магічні предмети та артефакти, 
              які допоможуть вам у духовному розвитку та практиках
            </p>
          </div>
          
          {user && cart.length > 0 && (
            <div className="shop-cart-info">
              <div className="cart-summary">
                <span className="cart-icon">🛒</span>
                <span className="cart-count">{getCartItemsCount()}</span>
                <span className="cart-total">
                  {new Intl.NumberFormat('uk-UA', {
                    style: 'currency',
                    currency: 'UAH',
                    minimumFractionDigits: 0
                  }).format(getCartTotal())}
                </span>
              </div>
            </div>
          )}
        </header>

        <div className="shop-content">
          <aside className="shop-sidebar">
            <ShopNavigation
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
            
            {user && (
              <div className="cart-sidebar">
                <ShoppingCart
                  cartItems={cart}
                  onUpdateCart={handleUpdateCart}
                  onRemoveItem={handleRemoveFromCart}
                  onCheckout={handleCheckout}
                />
              </div>
            )}
          </aside>

          <main className="shop-main">
            {error ? (
              <div className="shop-error">
                <div className="error-container">
                  <div className="error-icon">⚠️</div>
                  <h3>Помилка завантаження</h3>
                  <p>{error}</p>
                  <button 
                    className="retry-button"
                    onClick={loadProducts}
                  >
                    Спробувати знову
                  </button>
                </div>
              </div>
            ) : (
              <ShopGrid
                products={products}
                loading={loading}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
              />
            )}
          </main>
        </div>
      </div>

      <div className="shop-background-effects">
        <div className="bg-particle"></div>
        <div className="bg-particle"></div>
        <div className="bg-particle"></div>
        <div className="bg-particle"></div>
        <div className="bg-particle"></div>
        <div className="bg-particle"></div>
      </div>
    </div>
  );
};

export default ShopPage;