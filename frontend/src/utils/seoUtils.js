// Утиліти для SEO оптимізації

// Генерація sitemap
export const generateSitemap = (routes) => {
  const baseUrl = window.location.origin;
  const currentDate = new Date().toISOString().split('T')[0];
  
  const urlEntries = routes.map(route => `
    <url>
      <loc>${baseUrl}${route.path}</loc>
      <lastmod>${route.lastmod || currentDate}</lastmod>
      <changefreq>${route.changefreq || 'weekly'}</changefreq>
      <priority>${route.priority || '0.5'}</priority>
    </url>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlEntries}
</urlset>`;
};

// Основні маршрути для sitemap
export const sitemapRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/base-knowledge/faq', priority: '0.8', changefreq: 'weekly' },
  { path: '/base-knowledge/about-master', priority: '0.9', changefreq: 'monthly' },
  { path: '/base-knowledge/youtube', priority: '0.7', changefreq: 'weekly' },
  { path: '/courses/level-1', priority: '0.9', changefreq: 'weekly' },
  { path: '/courses/level-2', priority: '0.9', changefreq: 'weekly' },
  { path: '/courses/level-3', priority: '0.9', changefreq: 'weekly' },
  { path: '/consultations', priority: '0.8', changefreq: 'weekly' },
  { path: '/astro', priority: '0.8', changefreq: 'monthly' },
  { path: '/shop', priority: '0.7', changefreq: 'daily' }
];

// Функція для оновлення meta тегів динамічно
export const updateMetaTags = (tags) => {
  Object.entries(tags).forEach(([name, content]) => {
    let meta = document.querySelector(`meta[name="${name}"]`) || 
               document.querySelector(`meta[property="${name}"]`);
    
    if (!meta) {
      meta = document.createElement('meta');
      if (name.startsWith('og:') || name.startsWith('twitter:')) {
        meta.setAttribute('property', name);
      } else {
        meta.setAttribute('name', name);
      }
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  });
};

// Функція для генерації JSON-LD структурованих даних
export const generateJSONLD = (type, data) => {
  const schemas = {
    organization: {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": data.name,
      "url": data.url,
      "logo": data.logo,
      "description": data.description,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "UA"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": "Ukrainian"
      }
    },
    
    breadcrumb: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": data.items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    },
    
    course: {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": data.name,
      "description": data.description,
      "provider": {
        "@type": "Organization",
        "name": "Онлайн школа навчання"
      },
      "offers": {
        "@type": "Offer",
        "price": data.price,
        "priceCurrency": "UAH"
      }
    }
  };

  return schemas[type] || null;
};

// Функція для відстеження SEO метрик
export const trackSEOMetrics = () => {
  const metrics = {
    pageLoadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0
  };

  // Performance Observer для Core Web Vitals
  if ('PerformanceObserver' in window) {
    // LCP
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.largestContentfulPaint = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        metrics.firstInputDelay = entry.processingStart - entry.startTime;
      });
    }).observe({ entryTypes: ['first-input'] });

    // CLS
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          metrics.cumulativeLayoutShift += entry.value;
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Navigation Timing
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    
    // FCP
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      metrics.firstContentfulPaint = fcpEntry.startTime;
    }

    // Відправляємо метрики (можна інтегрувати з Google Analytics)
    console.log('SEO Metrics:', metrics);
  });

  return metrics;
};

// Функція для оптимізації зображень для SEO
export const optimizeImageForSEO = (src, alt, title) => {
  return {
    src,
    alt: alt || title || 'Зображення',
    title: title || alt || 'Зображення',
    loading: 'lazy',
    decoding: 'async'
  };
};

// Функція для генерації канонічних URL
export const generateCanonicalUrl = (path) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}${path}`;
};

// Функція для перевірки SEO факторів
export const checkSEOFactors = () => {
  const factors = {
    hasTitle: !!document.title,
    hasDescription: !!document.querySelector('meta[name="description"]'),
    hasCanonical: !!document.querySelector('link[rel="canonical"]'),
    hasOGTags: !!document.querySelector('meta[property^="og:"]'),
    hasStructuredData: !!document.querySelector('script[type="application/ld+json"]'),
    hasH1: !!document.querySelector('h1'),
    imageAltTags: Array.from(document.querySelectorAll('img')).every(img => img.alt)
  };

  const score = Object.values(factors).filter(Boolean).length;
  const total = Object.keys(factors).length;
  
  console.log(`SEO Score: ${score}/${total}`, factors);
  
  return { score, total, factors };
};