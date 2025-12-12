const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

class ContentService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/content`;
  }

  // Отримання токену з localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Базовий метод для HTTP запитів
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Публічні методи (не потребують аутентифікації)

  // Отримання сторінки за slug
  async getPageBySlug(slug) {
    return this.request(`/page/${slug}`);
  }

  // Отримання списку сторінок
  async getPages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/pages${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  // Пошук сторінок
  async searchPages(searchTerm, params = {}) {
    const queryParams = { search: searchTerm, ...params };
    const queryString = new URLSearchParams(queryParams).toString();
    return this.request(`/pages?${queryString}`);
  }

  // Отримання навігаційного меню
  async getNavigation() {
    return this.request('/navigation');
  }

  // Отримання дочірніх сторінок
  async getPageChildren(slug) {
    return this.request(`/page/${slug}/children`);
  }

  // Адміністративні методи (потребують аутентифікації)

  // Створення нової сторінки
  async createPage(pageData) {
    return this.request('/pages', {
      method: 'POST',
      body: JSON.stringify(pageData)
    });
  }

  // Оновлення сторінки
  async updatePage(pageId, pageData) {
    return this.request(`/pages/${pageId}`, {
      method: 'PUT',
      body: JSON.stringify(pageData)
    });
  }

  // Видалення сторінки
  async deletePage(pageId, hardDelete = false) {
    const endpoint = `/pages/${pageId}${hardDelete ? '?hard_delete=true' : ''}`;
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // Отримання сторінки за ID (для адміністрування)
  async getPageById(pageId) {
    return this.request(`/admin/pages/${pageId}`);
  }

  // Отримання всіх сторінок для адміністрування
  async getAllPages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/pages${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  // Валідація контенту
  async validateContent(content) {
    return this.request('/validate', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // Утилітарні методи

  // Створення FAQ сторінки з базовою структурою
  async createFAQPage(title, faqItems) {
    const content = {
      blocks: [
        {
          type: 'faq',
          title: title,
          items: faqItems,
          allow_multiple_open: false
        }
      ]
    };

    return this.createPage({
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      title: title,
      content: content,
      status: 'published'
    });
  }

  // Створення сторінки з героєм
  async createHeroPage(title, heroData, additionalBlocks = []) {
    const content = {
      blocks: [
        {
          type: 'hero',
          ...heroData
        },
        ...additionalBlocks
      ]
    };

    return this.createPage({
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      title: title,
      content: content,
      status: 'published'
    });
  }

  // Створення галереї
  async createGalleryPage(title, images, galleryOptions = {}) {
    const content = {
      blocks: [
        {
          type: 'gallery',
          title: title,
          images: images,
          layout: 'grid',
          columns: 3,
          show_captions: true,
          lightbox: true,
          ...galleryOptions
        }
      ]
    };

    return this.createPage({
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      title: title,
      content: content,
      status: 'published'
    });
  }

  // Додавання соціальних мереж до сторінки
  async addSocialBlockToPage(pageId, socialPlatforms) {
    const page = await this.getPageById(pageId);
    
    const socialBlock = {
      type: 'social',
      title: 'Слідкуйте за нами',
      platforms: socialPlatforms,
      layout: 'horizontal',
      icon_size: 'medium',
      show_labels: true
    };

    page.data.content.blocks.push(socialBlock);

    return this.updatePage(pageId, {
      content: page.data.content
    });
  }

  // Додавання Telegram віджету до сторінки
  async addTelegramBlockToPage(pageId, channelUsername, options = {}) {
    const page = await this.getPageById(pageId);
    
    const telegramBlock = {
      type: 'telegram',
      channel_username: channelUsername,
      widget_height: 400,
      show_header: true,
      show_avatar: true,
      color_scheme: 'light',
      ...options
    };

    page.data.content.blocks.push(telegramBlock);

    return this.updatePage(pageId, {
      content: page.data.content
    });
  }

  // Додавання YouTube відео до сторінки
  async addYouTubeBlockToPage(pageId, videoData) {
    const page = await this.getPageById(pageId);
    
    const youtubeBlock = {
      type: 'youtube',
      ...videoData
    };

    page.data.content.blocks.push(youtubeBlock);

    return this.updatePage(pageId, {
      content: page.data.content
    });
  }

  // Кешування для покращення продуктивності
  cache = new Map();
  cacheTimeout = 5 * 60 * 1000; // 5 хвилин

  async getCachedPage(slug) {
    const cacheKey = `page_${slug}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await this.getPageBySlug(slug);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // Очищення кешу
  clearCache() {
    this.cache.clear();
  }

  // Очищення кешу для конкретної сторінки
  clearPageCache(slug) {
    this.cache.delete(`page_${slug}`);
  }
}

// Експорт singleton instance
const contentService = new ContentService();
export default contentService;