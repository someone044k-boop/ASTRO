const express = require('express');
const router = express.Router();

// Генерація sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Статичні сторінки
    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/base-knowledge/faq', priority: '0.8', changefreq: 'weekly' },
      { path: '/base-knowledge/about-master', priority: '0.9', changefreq: 'monthly' },
      { path: '/base-knowledge/youtube', priority: '0.7', changefreq: 'weekly' },
      { path: '/base-knowledge/navigation', priority: '0.6', changefreq: 'monthly' },
      { path: '/base-knowledge/ask-author', priority: '0.7', changefreq: 'weekly' },
      { path: '/base-knowledge/city-of-gods', priority: '0.8', changefreq: 'monthly' },
      { path: '/courses/level-1', priority: '0.9', changefreq: 'weekly' },
      { path: '/courses/level-2', priority: '0.9', changefreq: 'weekly' },
      { path: '/courses/level-3', priority: '0.9', changefreq: 'weekly' },
      { path: '/consultations', priority: '0.8', changefreq: 'weekly' },
      { path: '/astro', priority: '0.8', changefreq: 'monthly' },
      { path: '/shop', priority: '0.7', changefreq: 'daily' }
    ];

    // Генеруємо XML
    const urlEntries = staticPages.map(page => `
    <url>
      <loc>${baseUrl}${page.path}</loc>
      <lastmod>${currentDate}</lastmod>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlEntries}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Помилка генерації sitemap:', error);
    res.status(500).json({ error: 'Помилка генерації sitemap' });
  }
});

// Генерація robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const robots = `User-agent: *
Allow: /

# Основні сторінки
Allow: /
Allow: /base-knowledge/
Allow: /courses/
Allow: /consultations
Allow: /astro
Allow: /shop

# Заборонені сторінки
Disallow: /admin/
Disallow: /api/
Disallow: /profile/
Disallow: /payment/
Disallow: /*.json$

# Sitemap
Sitemap: ${baseUrl}/api/seo/sitemap.xml

# Час затримки для ботів
Crawl-delay: 1`;

  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

// Мета дані для сторінок
router.get('/meta/:page', async (req, res) => {
  try {
    const { page } = req.params;
    
    const metaData = {
      home: {
        title: 'Онлайн школа навчання - Астрологія та езотерика',
        description: 'Професійна онлайн школа з курсами астрології, езотерики та духовного розвитку. Навчайтеся у досвідченого майстра.',
        keywords: 'астрологія, езотерика, онлайн курси, духовний розвиток, натальна карта'
      },
      faq: {
        title: 'Часті питання - FAQ',
        description: 'Відповіді на найпоширеніші питання про курси астрології та езотерики.',
        keywords: 'FAQ, часті питання, астрологія, курси'
      },
      about: {
        title: 'Про майстра - Досвід та кваліфікація',
        description: 'Дізнайтеся більше про досвідченого майстра астрології та його підхід до навчання.',
        keywords: 'майстер астрології, досвід, кваліфікація, біографія'
      },
      consultations: {
        title: 'Астрологічні консультації - Персональні та експрес',
        description: 'Професійні астрологічні консультації: персональні, експрес та консультації сумісності.',
        keywords: 'астрологічні консультації, натальна карта, сумісність, персональна консультація'
      },
      astro: {
        title: 'Астрологічний калькулятор - Натальна карта онлайн',
        description: 'Безкоштовний астрологічний калькулятор для розрахунку натальної карти та сумісності знаків зодіаку.',
        keywords: 'астрологічний калькулятор, натальна карта, знаки зодіаку, сумісність'
      },
      shop: {
        title: 'Магазин артефактів - Езотеричні товари',
        description: 'Унікальні езотеричні артефакти, амулети та товари для духовного розвитку.',
        keywords: 'езотеричні товари, артефакти, амулети, магазин'
      }
    };

    const meta = metaData[page] || metaData.home;
    res.json(meta);
  } catch (error) {
    console.error('Помилка отримання мета даних:', error);
    res.status(500).json({ error: 'Помилка отримання мета даних' });
  }
});

module.exports = router;