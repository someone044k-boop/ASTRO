const logger = require('../utils/logger');
const { query } = require('../database/connection');

class AstroService {
  constructor() {
    // Астрологічні знаки зодіаку
    this.zodiacSigns = [
      { name: 'Овен', symbol: '♈', element: 'Вогонь', dates: { start: [3, 21], end: [4, 19] } },
      { name: 'Телець', symbol: '♉', element: 'Земля', dates: { start: [4, 20], end: [5, 20] } },
      { name: 'Близнюки', symbol: '♊', element: 'Повітря', dates: { start: [5, 21], end: [6, 20] } },
      { name: 'Рак', symbol: '♋', element: 'Вода', dates: { start: [6, 21], end: [7, 22] } },
      { name: 'Лев', symbol: '♌', element: 'Вогонь', dates: { start: [7, 23], end: [8, 22] } },
      { name: 'Діва', symbol: '♍', element: 'Земля', dates: { start: [8, 23], end: [9, 22] } },
      { name: 'Терези', symbol: '♎', element: 'Повітря', dates: { start: [9, 23], end: [10, 22] } },
      { name: 'Скорпіон', symbol: '♏', element: 'Вода', dates: { start: [10, 23], end: [11, 21] } },
      { name: 'Стрілець', symbol: '♐', element: 'Вогонь', dates: { start: [11, 22], end: [12, 21] } },
      { name: 'Козеріг', symbol: '♑', element: 'Земля', dates: { start: [12, 22], end: [1, 19] } },
      { name: 'Водолій', symbol: '♒', element: 'Повітря', dates: { start: [1, 20], end: [2, 18] } },
      { name: 'Риби', symbol: '♓', element: 'Вода', dates: { start: [2, 19], end: [3, 20] } }
    ];

    // Планети
    this.planets = [
      { name: 'Сонце', symbol: '☉', meaning: 'Особистість, его, життєва сила' },
      { name: 'Місяць', symbol: '☽', meaning: 'Емоції, підсвідомість, інстинкти' },
      { name: 'Меркурій', symbol: '☿', meaning: 'Комунікація, мислення, навчання' },
      { name: 'Венера', symbol: '♀', meaning: 'Любов, краса, гармонія' },
      { name: 'Марс', symbol: '♂', meaning: 'Енергія, дія, агресія' },
      { name: 'Юпітер', symbol: '♃', meaning: 'Розширення, мудрість, удача' },
      { name: 'Сатурн', symbol: '♄', meaning: 'Структура, дисципліна, обмеження' },
      { name: 'Уран', symbol: '♅', meaning: 'Революція, інновації, свобода' },
      { name: 'Нептун', symbol: '♆', meaning: 'Ілюзії, духовність, творчість' },
      { name: 'Плутон', symbol: '♇', meaning: 'Трансформація, влада, відродження' }
    ];

    // Будинки
    this.houses = [
      { number: 1, name: 'Асцендент', meaning: 'Особистість, зовнішність, перше враження' },
      { number: 2, name: 'Матеріальні цінності', meaning: 'Гроші, володіння, самооцінка' },
      { number: 3, name: 'Комунікація', meaning: 'Спілкування, навчання, брати/сестри' },
      { number: 4, name: 'Дім і родина', meaning: 'Сім\'я, коріння, емоційна основа' },
      { number: 5, name: 'Творчість', meaning: 'Діти, творчість, романтика' },
      { number: 6, name: 'Здоров\'я і робота', meaning: 'Щоденна рутина, здоров\'я, служіння' },
      { number: 7, name: 'Партнерство', meaning: 'Шлюб, партнерство, відкриті вороги' },
      { number: 8, name: 'Трансформація', meaning: 'Смерть, відродження, спільні ресурси' },
      { number: 9, name: 'Філософія', meaning: 'Вища освіта, філософія, подорожі' },
      { number: 10, name: 'Кар\'єра', meaning: 'Професія, репутація, соціальний статус' },
      { number: 11, name: 'Друзі і мрії', meaning: 'Друзі, надії, групи' },
      { number: 12, name: 'Підсвідомість', meaning: 'Таємниці, підсвідомість, духовність' }
    ];
  }

  // Визначення знаку зодіаку за датою народження
  getZodiacSign(birthDate) {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    for (const sign of this.zodiacSigns) {
      const { start, end } = sign.dates;
      
      // Особливий випадок для Козерога (перетинає рік)
      if (sign.name === 'Козеріг') {
        if ((month === 12 && day >= start[1]) || (month === 1 && day <= end[1])) {
          return sign;
        }
      } else {
        if ((month === start[0] && day >= start[1]) || 
            (month === end[0] && day <= end[1]) ||
            (month > start[0] && month < end[0])) {
          return sign;
        }
      }
    }
    
    return this.zodiacSigns[0]; // За замовчуванням Овен
  }

  // Розрахунок асценденту (спрощений)
  calculateAscendant(birthDate, birthTime, latitude, longitude) {
    // Спрощений розрахунок асценденту
    // В реальному додатку тут би використовувалася Swiss Ephemeris
    const date = new Date(`${birthDate}T${birthTime}`);
    const hours = date.getHours() + date.getMinutes() / 60;
    
    // Спрощена формула на основі часу та координат
    const siderealTime = (hours + longitude / 15) % 24;
    const ascendantDegree = (siderealTime * 15 + latitude) % 360;
    
    const signIndex = Math.floor(ascendantDegree / 30);
    return this.zodiacSigns[signIndex];
  }

  // Генерація базової натальної карти
  async generateNatalChart({ birthDate, birthTime, birthLocation, userId = null }) {
    try {
      const { latitude, longitude, city, country } = birthLocation;
      
      // Основний знак зодіаку (Сонце)
      const sunSign = this.getZodiacSign(birthDate);
      
      // Асцендент
      const ascendant = this.calculateAscendant(birthDate, birthTime, latitude, longitude);
      
      // Спрощені позиції планет (в реальності використовувалася б Swiss Ephemeris)
      const planetPositions = this.calculatePlanetPositions(birthDate, birthTime);
      
      // Будинки (спрощено)
      const houses = this.calculateHouses(ascendant);
      
      const chartData = {
        sunSign,
        ascendant,
        planetPositions,
        houses,
        aspects: this.calculateAspects(planetPositions),
        interpretation: this.generateInterpretation(sunSign, ascendant, planetPositions)
      };

      // Зберігаємо в базу даних
      const result = await query(
        `INSERT INTO natal_charts (user_id, birth_date, birth_time, birth_location, chart_data) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [userId, birthDate, birthTime, JSON.stringify(birthLocation), JSON.stringify(chartData)]
      );

      logger.info(`Створено натальну карту для ${city}, ${country}`);
      
      return {
        id: result.rows[0].id,
        ...chartData,
        birthDate,
        birthTime,
        birthLocation
      };
    } catch (error) {
      logger.error('Помилка генерації натальної карти:', error.message);
      throw error;
    }
  }

  // Спрощений розрахунок позицій планет
  calculatePlanetPositions(birthDate, birthTime) {
    const date = new Date(`${birthDate}T${birthTime}`);
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    
    return this.planets.map((planet, index) => {
      // Спрощена формула для демонстрації
      const basePosition = (dayOfYear * (index + 1) * 0.98) % 360;
      const signIndex = Math.floor(basePosition / 30);
      const degree = Math.floor(basePosition % 30);
      
      return {
        planet: planet.name,
        symbol: planet.symbol,
        sign: this.zodiacSigns[signIndex].name,
        signSymbol: this.zodiacSigns[signIndex].symbol,
        degree: degree,
        meaning: planet.meaning
      };
    });
  }

  // Розрахунок будинків
  calculateHouses(ascendant) {
    const ascendantIndex = this.zodiacSigns.findIndex(sign => sign.name === ascendant.name);
    
    return this.houses.map((house, index) => {
      const signIndex = (ascendantIndex + index) % 12;
      return {
        ...house,
        sign: this.zodiacSigns[signIndex].name,
        signSymbol: this.zodiacSigns[signIndex].symbol
      };
    });
  }

  // Спрощений розрахунок аспектів
  calculateAspects(planetPositions) {
    const aspects = [];
    const majorAspects = [
      { name: 'Кон\'юнкція', angle: 0, orb: 8, symbol: '☌' },
      { name: 'Секстиль', angle: 60, orb: 6, symbol: '⚹' },
      { name: 'Квадрат', angle: 90, orb: 8, symbol: '□' },
      { name: 'Тригон', angle: 120, orb: 8, symbol: '△' },
      { name: 'Опозиція', angle: 180, orb: 8, symbol: '☍' }
    ];

    for (let i = 0; i < planetPositions.length; i++) {
      for (let j = i + 1; j < planetPositions.length; j++) {
        const planet1 = planetPositions[i];
        const planet2 = planetPositions[j];
        
        const angle1 = this.zodiacSigns.findIndex(s => s.name === planet1.sign) * 30 + planet1.degree;
        const angle2 = this.zodiacSigns.findIndex(s => s.name === planet2.sign) * 30 + planet2.degree;
        
        let difference = Math.abs(angle1 - angle2);
        if (difference > 180) difference = 360 - difference;
        
        for (const aspect of majorAspects) {
          if (Math.abs(difference - aspect.angle) <= aspect.orb) {
            aspects.push({
              planet1: planet1.planet,
              planet2: planet2.planet,
              aspect: aspect.name,
              symbol: aspect.symbol,
              orb: Math.abs(difference - aspect.angle)
            });
          }
        }
      }
    }
    
    return aspects;
  }

  // Генерація базової інтерпретації
  generateInterpretation(sunSign, ascendant, planetPositions) {
    const interpretations = {
      personality: `Ваш знак Сонця ${sunSign.name} (${sunSign.symbol}) надає вам характеристики елементу ${sunSign.element}. `,
      ascendant: `Асцендент у ${ascendant.name} (${ascendant.symbol}) впливає на те, як вас сприймають інші люди. `,
      planets: planetPositions.slice(0, 3).map(p => 
        `${p.planet} у ${p.sign} - ${p.meaning.toLowerCase()}`
      ).join('. ')
    };

    return {
      summary: interpretations.personality + interpretations.ascendant,
      detailed: interpretations,
      recommendations: this.getRecommendations(sunSign, ascendant)
    };
  }

  // Рекомендації на основі знаків
  getRecommendations(sunSign, ascendant) {
    const recommendations = {
      'Овен': ['Займайтеся спортом', 'Розвивайте лідерські якості', 'Контролюйте імпульсивність'],
      'Телець': ['Насолоджуйтесь природою', 'Розвивайте творчі здібності', 'Будьте більш гнучкими'],
      'Близнюки': ['Читайте багато', 'Спілкуйтеся з різними людьми', 'Фокусуйтеся на одній справі'],
      'Рак': ['Турбуйтеся про сім\'ю', 'Розвивайте інтуїцію', 'Не замикайтеся в собі'],
      'Лев': ['Творіть і самовиражайтеся', 'Будьте щедрими', 'Уникайте егоїзму'],
      'Діва': ['Організовуйте своє життя', 'Допомагайте іншим', 'Не будьте надто критичними'],
      'Терези': ['Шукайте гармонію', 'Розвивайте дипломатичні навички', 'Приймайте рішення швидше'],
      'Скорпіон': ['Досліджуйте глибини', 'Трансформуйтеся', 'Контролюйте ревнощі'],
      'Стрілець': ['Подорожуйте', 'Вивчайте філософію', 'Будьте більш тактовними'],
      'Козеріг': ['Ставте цілі', 'Будьте наполегливими', 'Не забувайте про відпочинок'],
      'Водолій': ['Будьте унікальними', 'Допомагайте суспільству', 'Розвивайте емпатію'],
      'Риби': ['Медитуйте', 'Розвивайте творчість', 'Будьте більш практичними']
    };

    return recommendations[sunSign.name] || ['Розвивайтеся гармонійно', 'Слухайте свою інтуїцію'];
  }

  // Отримання збережених натальних карт користувача
  async getUserCharts(userId) {
    try {
      const result = await query(
        'SELECT * FROM natal_charts WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        birthDate: row.birth_date,
        birthTime: row.birth_time,
        birthLocation: row.birth_location,
        chartData: row.chart_data,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error('Помилка отримання натальних карт:', error.message);
      throw error;
    }
  }

  // Отримання натальної карти за ID
  async getChartById(chartId, userId = null) {
    try {
      let queryText = 'SELECT * FROM natal_charts WHERE id = $1';
      let params = [chartId];
      
      if (userId) {
        queryText += ' AND user_id = $2';
        params.push(userId);
      }
      
      const result = await query(queryText, params);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        birthDate: row.birth_date,
        birthTime: row.birth_time,
        birthLocation: row.birth_location,
        chartData: row.chart_data,
        createdAt: row.created_at
      };
    } catch (error) {
      logger.error('Помилка отримання натальної карти:', error.message);
      throw error;
    }
  }

  // Сумісність знаків зодіаку
  getCompatibility(sign1, sign2) {
    const compatibility = {
      'Овен': { 'Лев': 9, 'Стрілець': 9, 'Близнюки': 7, 'Водолій': 7, 'Рак': 4, 'Козеріг': 4 },
      'Телець': { 'Діва': 9, 'Козеріг': 9, 'Рак': 7, 'Риби': 7, 'Лев': 4, 'Водолій': 4 },
      'Близнюки': { 'Терези': 9, 'Водолій': 9, 'Овен': 7, 'Лев': 7, 'Діва': 4, 'Риби': 4 },
      'Рак': { 'Скорпіон': 9, 'Риби': 9, 'Телець': 7, 'Діва': 7, 'Овен': 4, 'Терези': 4 },
      'Лев': { 'Овен': 9, 'Стрілець': 9, 'Близнюки': 7, 'Терези': 7, 'Телець': 4, 'Скорпіон': 4 },
      'Діва': { 'Телець': 9, 'Козеріг': 9, 'Рак': 7, 'Скорпіон': 7, 'Близнюки': 4, 'Стрілець': 4 },
      'Терези': { 'Близнюки': 9, 'Водолій': 9, 'Лев': 7, 'Стрілець': 7, 'Рак': 4, 'Козеріг': 4 },
      'Скорпіон': { 'Рак': 9, 'Риби': 9, 'Діва': 7, 'Козеріг': 7, 'Лев': 4, 'Водолій': 4 },
      'Стрілець': { 'Овен': 9, 'Лев': 9, 'Терези': 7, 'Водолій': 7, 'Діва': 4, 'Риби': 4 },
      'Козеріг': { 'Телець': 9, 'Діва': 9, 'Скорпіон': 7, 'Риби': 7, 'Овен': 4, 'Терези': 4 },
      'Водолій': { 'Близнюки': 9, 'Терези': 9, 'Овен': 7, 'Стрілець': 7, 'Телець': 4, 'Скорпіон': 4 },
      'Риби': { 'Рак': 9, 'Скорпіон': 9, 'Телець': 7, 'Козеріг': 7, 'Близнюки': 4, 'Стрілець': 4 }
    };

    return compatibility[sign1]?.[sign2] || 5; // За замовчуванням середня сумісність
  }
}

module.exports = new AstroService();