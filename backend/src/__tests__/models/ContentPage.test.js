const ContentPage = require('../../models/ContentPage');
const { query } = require('../../database/connection');

describe('ContentPage Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ContentPage.create', () => {
    it('should create a new content page successfully', async () => {
      const mockPageData = {
        slug: 'test-page',
        title: 'Test Page',
        content: { blocks: [{ type: 'text', content: 'Test content' }] },
        status: 'published'
      };

      const mockResult = {
        rows: [{
          id: 'test-id',
          slug: 'test-page',
          title: 'Test Page',
          content: { blocks: [{ type: 'text', content: 'Test content' }] },
          meta_data: null,
          parent_id: null,
          order_index: null,
          status: 'published',
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      // Mock findBySlug to return null (page doesn't exist)
      query.mockResolvedValueOnce({ rows: [] });
      // Mock create query
      query.mockResolvedValueOnce(mockResult);

      const result = await ContentPage.create(mockPageData);

      expect(result).toBeInstanceOf(ContentPage);
      expect(result.slug).toBe('test-page');
      expect(result.title).toBe('Test Page');
      expect(query).toHaveBeenCalledTimes(2);
    });

    it('should throw error if page with same slug exists', async () => {
      const mockPageData = {
        slug: 'existing-page',
        title: 'Existing Page',
        content: { blocks: [] }
      };

      // Mock findBySlug to return existing page
      query.mockResolvedValueOnce({
        rows: [{
          id: 'existing-id',
          slug: 'existing-page',
          title: 'Existing Page'
        }]
      });

      await expect(ContentPage.create(mockPageData)).rejects.toThrow('Сторінка з slug "existing-page" вже існує');
    });
  });

  describe('ContentPage.findBySlug', () => {
    it('should find page by slug successfully', async () => {
      const mockResult = {
        rows: [{
          id: 'test-id',
          slug: 'test-page',
          title: 'Test Page',
          content: { blocks: [] },
          status: 'published'
        }]
      };

      query.mockResolvedValueOnce(mockResult);

      const result = await ContentPage.findBySlug('test-page');

      expect(result).toBeInstanceOf(ContentPage);
      expect(result.slug).toBe('test-page');
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM content_pages WHERE slug = $1 AND status != $2',
        ['test-page', 'archived']
      );
    });

    it('should return null if page not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const result = await ContentPage.findBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('ContentPage.prototype.validateContent', () => {
    it('should validate content successfully', () => {
      const page = new ContentPage({
        id: 'test-id',
        slug: 'test',
        title: 'Test',
        content: {
          blocks: [
            { type: 'text', content: 'Test content' },
            { type: 'image', src: 'test.jpg' }
          ]
        },
        status: 'published'
      });

      expect(() => page.validateContent()).not.toThrow();
    });

    it('should throw error for invalid content structure', () => {
      const page = new ContentPage({
        id: 'test-id',
        slug: 'test',
        title: 'Test',
        content: 'invalid content',
        status: 'published'
      });

      expect(() => page.validateContent()).toThrow('Контент повинен бути валідним JSON об\'єктом');
    });

    it('should throw error for missing blocks array', () => {
      const page = new ContentPage({
        id: 'test-id',
        slug: 'test',
        title: 'Test',
        content: { notBlocks: [] },
        status: 'published'
      });

      expect(() => page.validateContent()).toThrow('Контент повинен містити масив блоків');
    });

    it('should throw error for block without type', () => {
      const page = new ContentPage({
        id: 'test-id',
        slug: 'test',
        title: 'Test',
        content: {
          blocks: [{ content: 'Test content' }]
        },
        status: 'published'
      });

      expect(() => page.validateContent()).toThrow('Кожен блок повинен мати тип');
    });

    it('should throw error for unknown block type', () => {
      const page = new ContentPage({
        id: 'test-id',
        slug: 'test',
        title: 'Test',
        content: {
          blocks: [{ type: 'unknown', content: 'Test content' }]
        },
        status: 'published'
      });

      expect(() => page.validateContent()).toThrow('Невідомий тип блоку: unknown');
    });
  });

  describe('ContentPage.search', () => {
    it('should search pages by term', async () => {
      const mockResult = {
        rows: [{
          id: 'test-id',
          slug: 'test-page',
          title: 'Test Page',
          content: { blocks: [] },
          status: 'published',
          rank: 0.5
        }]
      };

      query.mockResolvedValueOnce(mockResult);

      const result = await ContentPage.search('test');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ContentPage);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('plainto_tsquery'),
        ['test', '%test%', 20, 0]
      );
    });
  });
});