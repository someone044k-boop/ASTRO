const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

class ShopService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/shop`;
  }

  // Отримання токену з localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Створення заголовків для запитів
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Обробка відповіді від сервера
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Помилка сервера');
    }
    
    return data;
  }

  // === ТОВАРИ ===

  // Отримання всіх товарів з фільтрацією
  async getProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.category) queryParams.append('category', params.category);
      if (params.status) queryParams.append('status', params.status);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);

      const url = `${this.baseURL}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка отримання товарів:', error);
      throw error;
    }
  }

  // Отримання товару за ID
  async getProduct(id) {
    try {
      const response = await fetch(`${this.baseURL}/products/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка отримання товару:', error);
      throw error;
    }
  }

  // Отримання категорій товарів
  async getCategories() {
    try {
      const response = await fetch(`${this.baseURL}/categories`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка отримання категорій:', error);
      throw error;
    }
  }

  // Отримання товарів за категорією
  async getProductsByCategory(category) {
    try {
      const response = await fetch(`${this.baseURL}/categories/${category}/products`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка отримання товарів за категорією:', error);
      throw error;
    }
  }

  // Створення товару (тільки для адміністраторів)
  async createProduct(productData) {
    try {
      const response = await fetch(`${this.baseURL}/products`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(productData),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка створення товару:', error);
      throw error;
    }
  }

  // Оновлення товару (тільки для адміністраторів)
  async updateProduct(id, productData) {
    try {
      const response = await fetch(`${this.baseURL}/products/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: JSON.stringify(productData),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка оновлення товару:', error);
      throw error;
    }
  }

  // Видалення товару (тільки для адміністраторів)
  async deleteProduct(id) {
    try {
      const response = await fetch(`${this.baseURL}/products/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(true),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка видалення товару:', error);
      throw error;
    }
  }

  // === ЗАМОВЛЕННЯ ===

  // Створення замовлення
  async createOrder(orderData) {
    try {
      const response = await fetch(`${this.baseURL}/orders`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(orderData),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка створення замовлення:', error);
      throw error;
    }
  }

  // Отримання замовлень користувача
  async getUserOrders(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);

      const url = `${this.baseURL}/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка отримання замовлень користувача:', error);
      throw error;
    }
  }

  // Отримання замовлення за ID
  async getOrder(id) {
    try {
      const response = await fetch(`${this.baseURL}/orders/${id}`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка отримання замовлення:', error);
      throw error;
    }
  }

  // Скасування замовлення
  async cancelOrder(id) {
    try {
      const response = await fetch(`${this.baseURL}/orders/${id}/cancel`, {
        method: 'POST',
        headers: this.getHeaders(true),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка скасування замовлення:', error);
      throw error;
    }
  }

  // === АДМІНІСТРАТИВНІ ФУНКЦІЇ ===

  // Отримання всіх замовлень (тільки для адміністраторів)
  async getAllOrders(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);

      const url = `${this.baseURL}/admin/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка отримання всіх замовлень:', error);
      throw error;
    }
  }

  // Оновлення статусу замовлення (тільки для адміністраторів)
  async updateOrderStatus(id, status, paymentId = null) {
    try {
      const response = await fetch(`${this.baseURL}/orders/${id}/status`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: JSON.stringify({ 
          status,
          payment_id: paymentId 
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Помилка оновлення статусу замовлення:', error);
      throw error;
    }
  }

  // === УТИЛІТАРНІ ФУНКЦІЇ ===

  // Форматування ціни
  formatPrice(price, currency = 'UAH') {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  }

  // Перевірка доступності товару
  isProductAvailable(product, quantity = 1) {
    return product.status === 'active' && product.inventory_count >= quantity;
  }

  // Розрахунок загальної суми кошика
  calculateCartTotal(cartItems) {
    return cartItems.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  }

  // Валідація даних замовлення
  validateOrderData(orderData) {
    const errors = [];

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('Замовлення повинно містити хоча б один товар');
    }

    orderData.items?.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`Товар ${index + 1}: відсутній ID товару`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Товар ${index + 1}: невірна кількість`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Створюємо та експортуємо екземпляр сервісу
export const shopService = new ShopService();
export default shopService;