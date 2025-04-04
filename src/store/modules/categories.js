import { ref as dbRef, onValue, get } from 'firebase/database';
import { getDatabase } from 'firebase/database';

export default {
  namespaced: true,

  state: {
    categories: {},
    loading: false,
    error: null,
    unsubscribe: null,
  },

  mutations: {
    SET_CATEGORIES(state, categories) {
      console.log('categories.js: Установка категорий в состояние:', categories);
      state.categories = { ...categories };
    },
    SET_LOADING(state, loading) {
      console.log('categories.js: Установка состояния загрузки:', loading);
      state.loading = loading;
    },
    SET_ERROR(state, error) {
      console.log('categories.js: Установка ошибки:', error);
      state.error = error;
    },
    SET_UNSUBSCRIBE(state, unsubscribe) {
      console.log('categories.js: Установка отписки:', unsubscribe);
      state.unsubscribe = unsubscribe;
    },
  },

  actions: {
    async fetchCategories({ commit, state }) {
      console.log('categories.js: Начало загрузки категорий');
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const categoriesRef = dbRef(db, 'categories');

        if (state.unsubscribe) {
          state.unsubscribe();
          console.log('categories.js: Отписка от предыдущего слушателя выполнена');
        }

        const unsubscribe = onValue(
          categoriesRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              const categoriesData = snapshot.val();
              console.log('categories.js: Данные категорий из Firebase:', categoriesData);

              const updatedCategories = {};
              for (const [id, category] of Object.entries(categoriesData)) {
                const posts = category.posts || {};
                const topicsCount = Object.keys(posts).length;
                console.log(`categories.js: Подсчет тем для категории ${id}:`, topicsCount);

                updatedCategories[id] = {
                  ...category,
                  id,
                  posts, // Сохраняем полные данные постов
                  topicsCount,
                };
              }

              console.log('categories.js: Обновленные категории перед коммитом:', updatedCategories);
              commit('SET_CATEGORIES', updatedCategories);
            } else {
              console.log('categories.js: Категории не найдены в Firebase');
              commit('SET_CATEGORIES', {});
            }
            commit('SET_LOADING', false);
          },
          (error) => {
            console.error('categories.js: Ошибка подписки на категории:', error);
            commit('SET_ERROR', error.message);
            commit('SET_LOADING', false);
          }
        );

        commit('SET_UNSUBSCRIBE', unsubscribe);
        console.log('categories.js: Подписка на категории установлена');
      } catch (error) {
        console.error('categories.js: Ошибка при загрузке категорий:', error);
        commit('SET_ERROR', error.message);
        commit('SET_LOADING', false);
      }
    },

    async fetchCategoryPostIds({ commit }, categoryId) {
      console.log('categories.js: Запрос постов для категории:', categoryId);
      try {
        const db = getDatabase();
        const postsRef = dbRef(db, `categories/${categoryId}/posts`);
        const snapshot = await get(postsRef);
        if (snapshot.exists()) {
          const postIds = Object.keys(snapshot.val());
          console.log('categories.js: Загружены ID постов для категории:', categoryId, postIds);
          return postIds;
        } else {
          console.log('categories.js: Посты не найдены для категории:', categoryId);
          return [];
        }
      } catch (error) {
        console.error('categories.js: Ошибка при загрузке постов:', error);
        commit('SET_ERROR', error.message);
        throw error;
      }
    },

    clearSubscription({ commit, state }) {
      console.log('categories.js: Очистка подписки');
      if (state.unsubscribe) {
        state.unsubscribe();
        commit('SET_UNSUBSCRIBE', null);
        console.log('categories.js: Подписка на категории очищена');
      }
    },
  },

  getters: {
    getAllCategories: (state) => {
      const categoriesArray = Object.entries(state.categories || {}).map(([id, data]) => {
        const posts = data.posts || {};
        const topicsCount = Object.keys(posts).length;
        return {
          id,
          ...data,
          posts, // Возвращаем полные данные постов
          topicsCount,
        };
      });
      console.log('categories.js: Геттер getAllCategories возвращает:', categoriesArray);
      return categoriesArray;
    },
    getCategoryById: (state) => (id) => {
      const category = state.categories[id] || null;
      if (category) {
        const posts = category.posts || {};
        const topicsCount = Object.keys(posts).length;
        console.log('categories.js: Геттер getCategoryById для id:', id, 'возвращает:', { ...category, posts, topicsCount });
        return { ...category, posts, topicsCount };
      }
      console.log('categories.js: Категория с id:', id, 'не найдена');
      return null;
    },
  },
};