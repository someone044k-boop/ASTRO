# Використовуємо офіційний Node.js образ для збірки
FROM node:18-alpine as build

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci --silent

# Копіюємо весь код
COPY . ./

# Збираємо додаток
RUN npm run build

# Використовуємо nginx для сервування статичних файлів
FROM nginx:stable-alpine

# Копіюємо зібрані файли
COPY --from=build /app/build /usr/share/nginx/html

# Копіюємо конфігурацію nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Відкриваємо порт
EXPOSE 3000

# Запускаємо nginx
CMD ["nginx", "-g", "daemon off;"]