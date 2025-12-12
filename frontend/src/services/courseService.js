const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

class CourseService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/courses`;
  }

  getAuthToken() {
    return localStorage.getItem('accessToken');
  }

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

  // Отримання всіх курсів
  async getAllCourses() {
    return this.request('/');
  }

  // Отримання курсу за рівнем
  async getCourseByLevel(level) {
    return this.request(`/level/${level}`);
  }

  // Отримання курсу за ID
  async getCourseById(id) {
    return this.request(`/${id}`);
  }

  // Отримання вкладок курсу
  async getCourseTabs(courseId) {
    return this.request(`/${courseId}/tabs`);
  }

  // Отримання уроків вкладки
  async getTabLessons(courseId, tabId) {
    return this.request(`/${courseId}/tabs/${tabId}/lessons`);
  }

  // Отримання уроку
  async getLesson(lessonId) {
    return this.request(`/lessons/${lessonId}`);
  }

  // Запис на курс
  async enrollCourse(courseId) {
    return this.request(`/${courseId}/enroll`, {
      method: 'POST'
    });
  }

  // Отримання курсів користувача
  async getMyEnrolledCourses() {
    return this.request('/my/enrolled');
  }

  // Перевірка чи користувач записаний на курс
  async checkEnrollment(courseId) {
    try {
      const response = await this.getCourseById(courseId);
      return response.data?.isEnrolled || false;
    } catch {
      return false;
    }
  }

  // Оновлення прогресу уроку
  async updateProgress(lessonId, progress) {
    return this.request(`/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress })
    });
  }

  // Позначення уроку як завершеного
  async completeLesson(lessonId) {
    return this.request(`/lessons/${lessonId}/complete`, {
      method: 'POST'
    });
  }

  // Отримання прогресу курсу
  async getCourseProgress(courseId) {
    return this.request(`/${courseId}/progress`);
  }

  // Отримання прогресу уроку
  async getLessonProgress(lessonId) {
    return this.request(`/lessons/${lessonId}/progress`);
  }

  // Отримання всіх уроків курсу
  async getCourseLessons(courseId) {
    return this.request(`/${courseId}/lessons`);
  }
}

const courseService = new CourseService();
export default courseService;