// Утиліти для оптимізації зображень

// Функція для генерації srcSet з різними розмірами
export const generateSrcSet = (imagePath, sizes = [320, 640, 768, 1024, 1280]) => {
  const extension = imagePath.split('.').pop();
  const basePath = imagePath.replace(`.${extension}`, '');
  
  return sizes.map(size => `${basePath}_${size}w.webp ${size}w`).join(', ');
};

// Компонент оптимізованого зображення
export const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  loading = "lazy",
  sizes = "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
  ...props 
}) => {
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const srcSet = generateSrcSet(src);
  
  return (
    <picture>
      {/* WebP формат для сучасних браузерів */}
      <source 
        srcSet={generateSrcSet(webpSrc)} 
        sizes={sizes} 
        type="image/webp" 
      />
      
      {/* Fallback для старих браузерів */}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={loading}
        className={className}
        {...props}
      />
    </picture>
  );
};

// Функція для lazy loading зображень
export const lazyLoadImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imageObserver.observe(img));
  }
};

// Функція для preload критичних зображень
export const preloadCriticalImages = (imagePaths) => {
  imagePaths.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = path;
    document.head.appendChild(link);
  });
};

// Функція для конвертації в WebP (для майбутнього використання з backend)
export const convertToWebP = async (file, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(resolve, 'image/webp', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};