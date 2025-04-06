import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, push } from 'firebase/database';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC-vJAy9Adce0C4ixxZPsuEdJLcmxJMB6k",
  authDomain: "forum-a36e8.firebaseapp.com",
  projectId: "forum-a36e8",
  storageBucket: "forum-a36e8.firebasestorage.app",
  messagingSenderId: "783823450857",
  appId: "1:783823450857:web:0984ea46bb8d195c943678",
  databaseURL: "https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Уникальные категории с их метаинформацией
const uniqueCategories = {
  unique1: {
    name: "Устаревшие ремёсла",
    description: "Исследование исчезнувших профессий в аниме и манге.",
    type: "discussion",
  },
  unique2: {
    name: "Синестезия в аниме",
    description: "Визуальные и звуковые эксперименты в тайтлах.",
    type: "discussion",
  },
  unique3: {
    name: "Вымышленные традиции",
    description: "Уникальные ритуалы выдуманных миров.",
    type: "discussion",
  },
};

// Функция для миграции данных
async function migrateUniqueCategories() {
  try {
    console.log('Начало миграции уникальных категорий...');

    // Получаем текущие данные из ветки categories
    const categoriesRef = ref(db, 'categories');
    const snapshot = await get(categoriesRef);
    const categoriesData = snapshot.val() || {};

    // Обрабатываем каждую уникальную категорию
    for (const [uniqueId, meta] of Object.entries(uniqueCategories)) {
      if (categoriesData[uniqueId]) {
        console.log(`Обработка категории: ${uniqueId}`);

        // Получаем посты из уникальной категории
        const posts = categoriesData[uniqueId].posts || {};
        const topicsCount = Object.keys(posts).length;

        // Создаем новую категорию с сгенерированным ключом
        const newCategoryRef = push(categoriesRef);
        const newCategoryId = newCategoryRef.key;

        // Формируем данные новой категории
        const newCategoryData = {
          createdAt: Date.now(),
          lastActivity: Date.now(),
          name: meta.name,
          description: meta.description,
          type: meta.type,
          topicsCount: topicsCount,
          posts: {},
        };

        // Переносим и корректируем посты
        for (const [postId, post] of Object.entries(posts)) {
          const updatedPost = {
            ...post,
            categoryId: newCategoryId, // Обновляем categoryId на новый ключ
            createdAt: post.createdAt || Date.now(), // Устанавливаем createdAt, если его нет
          };
          newCategoryData.posts[postId] = updatedPost;
        }

        // Сохраняем новую категорию в Firebase
        await set(newCategoryRef, newCategoryData);
        console.log(`Категория ${uniqueId} перенесена в ${newCategoryId}`);

        // Удаляем старую уникальную категорию (раскомментируйте, если нужно)
        // await set(ref(db, `categories/${uniqueId}`), null);
        // console.log(`Старая категория ${uniqueId} удалена`);
      } else {
        console.log(`Категория ${uniqueId} не найдена в базе данных, создание новой...`);
        
        // Если категории нет, создаем новую с пустыми постами
        const newCategoryRef = push(categoriesRef);
        const newCategoryId = newCategoryRef.key;
        const newCategoryData = {
          createdAt: Date.now(),
          lastActivity: Date.now(),
          name: meta.name,
          description: meta.description,
          type: meta.type,
          topicsCount: 0,
          posts: {},
        };
        await set(newCategoryRef, newCategoryData);
        console.log(`Создана новая категория ${newCategoryId} для ${uniqueId}`);
      }
    }

    console.log('Миграция успешно завершена!');
  } catch (error) {
    console.error('Ошибка при миграции:', error);
  }
}

// Запускаем миграцию
migrateUniqueCategories();