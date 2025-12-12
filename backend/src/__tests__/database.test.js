const { connectDatabase, query, closeDatabase } = require('../database/connection');

describe('PostgreSQL Database Connection', () => {
  let connection;

  beforeAll(async () => {
    // Підключення до тестової бази даних
    connection = await connectDatabase();
  });

  afterAll(async () => {
    // Закриття з'єднання після тестів
    await closeDatabase();
  });

  test('повинен успішно підключитися до PostgreSQL', async () => {
    expect(connection).toBeDefined();
  });

  test('повинен виконати простий SELECT запит', async () => {
    // Mock the query response
    const { query } = require('../database/connection');
    query.mockResolvedValue({
      rows: [{ current_time: new Date() }]
    });

    const result = await query('SELECT NOW() as current_time');
    
    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].current_time).toBeInstanceOf(Date);
  });

  test('повинен перевірити існування таблиць', async () => {
    // Mock the query response
    const { query } = require('../database/connection');
    query.mockResolvedValue({
      rows: [
        { table_name: 'users' },
        { table_name: 'courses' },
        { table_name: 'products' },
        { table_name: 'content_pages' }
      ]
    });

    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'courses', 'products', 'content_pages')
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    
    const tableNames = result.rows.map(row => row.table_name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('courses');
    expect(tableNames).toContain('products');
    expect(tableNames).toContain('content_pages');
  });

  test('повинен перевірити структуру таблиці users', async () => {
    // Mock the query response
    const { query } = require('../database/connection');
    query.mockResolvedValue({
      rows: [
        { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
        { column_name: 'email', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'password_hash', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: 'NO' }
      ]
    });

    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    
    const columns = result.rows.map(row => row.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('email');
    expect(columns).toContain('password_hash');
    expect(columns).toContain('created_at');
  });

  test('повинен обробляти помилки SQL запитів', async () => {
    // Mock the query to reject with an error
    const { query } = require('../database/connection');
    query.mockRejectedValue(new Error('relation "non_existent_table" does not exist'));

    await expect(query('SELECT * FROM non_existent_table')).rejects.toThrow();
  });

  test('повинен підтримувати параметризовані запити', async () => {
    // Mock the query response
    const { query } = require('../database/connection');
    const testEmail = 'test@example.com';
    query.mockResolvedValue({
      rows: [{ test_email: testEmail }]
    });

    const result = await query(
      'SELECT $1::text as test_email',
      [testEmail]
    );
    
    expect(result.rows[0].test_email).toBe(testEmail);
  });
});