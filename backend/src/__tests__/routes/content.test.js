const request = require('supertest');
const express = require('express');
const contentRoutes = require('../../routes/content');
const ContentPage = require('../../models/ContentPage');
const jwt = require('jsonwebtoken');

// Mock the ContentPage model
jest.mock('../../models/ContentPage');

// Mock the User model for authentication
jest.mock('../../models/User', () => ({
  findById: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'admin@test.com',
    role: 'admin'
  })
}));

// Generate test token
const testToken = jwt.sign(
  { userId: 'test-user-id', email: 'admin@test.com' },
  'test-secret-key-for-testing',
  { expiresIn: '1h' }
);

const app = express();
app.use(express.json());
app.use('/api/content', contentRoutes);

describe('Content Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/content/page/:slug', () => {
    it('should return page by slug successfully', async () => {
      const mockPage = {
        id: 'test-id',
        slug: 'test-page',
        title: 'Test Page',
        content: { blocks: [{ type: 'text', content: 'Test content' }] },
        status: 'published',
        toPublicJSON: jest.fn().mockReturnValue({
          id: 'test-id',
          slug: 'test-page',
          title: 'Test Page',
          content: { blocks: [{ type: 'text', content: 'Test content' }] }
        }),
        getMetaData: jest.fn().mockReturnValue({
          description: 'Test Page',
          keywords: []
        })
      };

      ContentPage.findBySlug.mockResolvedValue(mockPage);

      const response = await request(app)
        .get('/api/content/page/test-page')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('test-page');
      expect(ContentPage.findBySlug).toHaveBeenCalledWith('test-page');
    });

    it('should return 404 if page not found', async () => {
      ContentPage.findBySlug.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/content/page/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Сторінку не знайдено');
    });

    it('should return 404 if page is not published', async () => {
      const mockPage = {
        status: 'draft',
        toPublicJSON: jest.fn(),
        getMetaData: jest.fn()
      };

      ContentPage.findBySlug.mockResolvedValue(mockPage);

      const response = await request(app)
        .get('/api/content/page/draft-page')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Сторінка недоступна');
    });
  });

  describe('GET /api/content/pages', () => {
    it('should return list of pages', async () => {
      const mockPages = [
        {
          toPublicJSON: jest.fn().mockReturnValue({
            id: 'page1',
            slug: 'page-1',
            title: 'Page 1'
          })
        },
        {
          toPublicJSON: jest.fn().mockReturnValue({
            id: 'page2',
            slug: 'page-2',
            title: 'Page 2'
          })
        }
      ];

      ContentPage.findAll.mockResolvedValue(mockPages);

      const response = await request(app)
        .get('/api/content/pages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(ContentPage.findAll).toHaveBeenCalledWith({
        status: 'published',
        parent_id: undefined,
        limit: 50,
        offset: 0
      });
    });

    it('should handle search queries', async () => {
      const mockPages = [{
        toPublicJSON: jest.fn().mockReturnValue({
          id: 'search-result',
          slug: 'search-result',
          title: 'Search Result'
        })
      }];

      ContentPage.search.mockResolvedValue(mockPages);

      const response = await request(app)
        .get('/api/content/pages?search=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(ContentPage.search).toHaveBeenCalledWith('test', { limit: 50, offset: 0 });
    });
  });

  describe('GET /api/content/navigation', () => {
    it('should return navigation menu', async () => {
      const mockMenuItems = [
        {
          id: 'nav1',
          slug: 'home',
          title: 'Home',
          parent_id: null,
          order_index: 1,
          level: 0
        }
      ];

      ContentPage.getNavigationMenu.mockResolvedValue(mockMenuItems);

      const response = await request(app)
        .get('/api/content/navigation')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].slug).toBe('home');
    });
  });

  describe('POST /api/content/validate', () => {
    it.skip('should validate content successfully', async () => {
      const validContent = {
        blocks: [
          { type: 'text', content: 'Valid content' }
        ]
      };

      const response = await request(app)
        .post('/api/content/validate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ content: validContent })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Контент валідний');
      expect(response.body.data.blocks_count).toBe(1);
    });

    it.skip('should return validation error for invalid content', async () => {
      const invalidContent = {
        blocks: [
          { type: 'invalid-type', content: 'Invalid content' }
        ]
      };

      const response = await request(app)
        .post('/api/content/validate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ content: invalidContent })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Помилка валідації контенту');
    });

    it.skip('should return error if content is missing', async () => {
      const response = await request(app)
        .post('/api/content/validate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Контент є обов\'язковим для валідації');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/content/validate')
        .send({ content: { blocks: [] } })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});