import React from 'react';
import { Helmet } from 'react-helmet-async';

const MetaTags = ({
  title = "Онлайн школа навчання",
  description = "Професійна онлайн школа з курсами астрології, езотерики та духовного розвитку. Навчайтеся у досвідченого майстра.",
  keywords = "астрологія, езотерика, онлайн курси, духовний розвиток, натальна карта, консультації",
  image = "/images/og-image.jpg",
  url = window.location.href,
  type = "website",
  author = "Майстер астрології",
  locale = "uk_UA"
}) => {
  const fullTitle = title === "Онлайн школа навчання" ? title : `${title} | Онлайн школа навчання`;

  return (
    <Helmet>
      {/* Основні мета теги */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Ukrainian" />
      <link rel="canonical" href={url} />

      {/* Open Graph теги для соціальних мереж */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content="Онлайн школа навчання" />

      {/* Twitter Card теги */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Додаткові теги для мобільних пристроїв */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#8B4513" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Структуровані дані JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "Онлайн школа навчання",
          "description": description,
          "url": url,
          "logo": `${window.location.origin}/images/logo.png`,
          "sameAs": [
            "https://www.youtube.com/channel/YOUR_CHANNEL",
            "https://t.me/YOUR_TELEGRAM"
          ],
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "UA"
          },
          "offers": {
            "@type": "Offer",
            "category": "Освіта",
            "availability": "https://schema.org/InStock"
          }
        })}
      </script>
    </Helmet>
  );
};

export default MetaTags;