require('dotenv').config();
const { connectDatabase } = require('../src/database/connection');
const Course = require('../src/models/Course');
const CourseTab = require('../src/models/CourseTab');
const Lesson = require('../src/models/Lesson');

async function initializeCourses() {
  try {
    await connectDatabase();
    console.log('Підключено до бази даних');

    // Створюємо 4 курси
    const coursesData = [
      { level: 1, title: '1й Курс - Основи', description: 'Вступний курс для початківців. Основи езотеричних знань та базові практики.', price: 1500 },
      { level: 2, title: '2й Курс - Поглиблення', description: 'Поглиблене вивчення енергетичних практик та розширення свідомості.', price: 2500 },
      { level: 3, title: '3й Курс - Майстерність', description: 'Розвиток майстерності в різних напрямках езотеричних практик.', price: 3500 },
      { level: 4, title: '4й Курс - Експертиза', description: 'Експертний рівень. Підготовка до самостійної практики та навчання інших.', price: 5000 }
    ];

    for (const courseData of coursesData) {
      let course = await Course.findByLevel(courseData.level);
      
      if (!course) {
        course = await Course.create(courseData);
        console.log(`✅ Створено курс: ${course.title}`);
      } else {
        console.log(`⏭️ Курс вже існує: ${course.title}`);
      }

      // Визначаємо вкладки для курсу
      const tabs = courseData.level === 1 
        ? [
            { name: 'Теорія', type: 'theory', order_index: 1 },
            { name: 'Практика', type: 'practice', order_index: 2 },
            { name: 'Екзамен', type: 'exam', order_index: 3 }
          ]
        : [
            { name: 'Теорія', type: 'theory', order_index: 1 },
            { name: 'Практика', type: 'practice', order_index: 2 },
            { name: 'Вплив', type: 'influence', order_index: 3 },
            { name: 'Герої', type: 'heroes', order_index: 4 },
            { name: 'Екзамен', type: 'exam', order_index: 5 }
          ];

      // Створюємо вкладки
      const existingTabs = await CourseTab.findByCourseId(course.id);
      
      if (existingTabs.length === 0) {
        for (const tabData of tabs) {
          const tab = await CourseTab.create({
            course_id: course.id,
            ...tabData,
            content: { description: `Контент вкладки ${tabData.name}` }
          });
          console.log(`  📑 Створено вкладку: ${tab.name}`);

          // Створюємо тестові уроки для кожної вкладки
          const lessonsCount = tabData.type === 'exam' ? 1 : 3;
          for (let i = 1; i <= lessonsCount; i++) {
            await Lesson.create({
              course_id: course.id,
              tab_id: tab.id,
              title: `${tabData.name} - Урок ${i}`,
              content: { text: `Контент уроку ${i} для ${tabData.name}` },
              order_index: i,
              duration_minutes: 30
            });
          }
          console.log(`    📚 Створено ${lessonsCount} уроків`);
        }
      }
    }

    console.log('\n🎉 Ініціалізація курсів завершена!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error);
    process.exit(1);
  }
}

initializeCourses();