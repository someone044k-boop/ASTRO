import React from 'react';
import { Helmet } from 'react-helmet-async';

// Компонент для різних типів структурованих даних
const StructuredData = ({ type, data }) => {
  const generateSchema = () => {
    switch (type) {
      case 'course':
        return {
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
            "priceCurrency": "UAH",
            "availability": "https://schema.org/InStock"
          },
          "courseMode": "online",
          "educationalLevel": data.level || "Beginner"
        };

      case 'article':
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": data.title,
          "description": data.description,
          "author": {
            "@type": "Person",
            "name": data.author || "Майстер астрології"
          },
          "datePublished": data.datePublished,
          "dateModified": data.dateModified || data.datePublished,
          "publisher": {
            "@type": "Organization",
            "name": "Онлайн школа навчання"
          }
        };

      case 'service':
        return {
          "@context": "https://schema.org",
          "@type": "Service",
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
          },
          "serviceType": data.serviceType || "Консультація"
        };

      case 'product':
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": data.name,
          "description": data.description,
          "image": data.image,
          "offers": {
            "@type": "Offer",
            "price": data.price,
            "priceCurrency": "UAH",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "Онлайн школа навчання"
            }
          }
        };

      case 'faq':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": data.questions.map(q => ({
            "@type": "Question",
            "name": q.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": q.answer
            }
          }))
        };

      case 'breadcrumb':
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": data.items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
          }))
        };

      default:
        return null;
    }
  };

  const schema = generateSchema();

  if (!schema) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default StructuredData;