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
      state.categories = { ...categories }; // Гарантируем реактивность
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    SET_UNSUBSCRIBE(state, unsubscribe) {
      state.unsubscribe = unsubscribe;
    },
  },

  actions: {
    async fetchCategories({ commit, state }) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const categoriesRef = dbRef(db, 'categories');

        // Отписываемся от предыдущего слушателя, если он существует
        if (state.unsubscribe) {
          state.unsubscribe();
          console.log('categories.js: Отписка от предыдущего слушателя выполнена');
        }

        const unsubscribe = onValue(
          categoriesRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const categoriesData = snapshot.val();
              console.log('categories.js: Данные категорий из Firebase:', categoriesData);
              commit('SET_CATEGORIES', categoriesData);
            } else {
              console.log('categories.js: Категории не найдены в Firebase');
              commit('SET_CATEGORIES', {});
            }
            commit('SET_LOADING', false); // Завершаем загрузку после получения данных
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
      try {
        const db = getDatabase();
        const postIdsRef = dbRef(db, `categories/${categoryId}/postIds`);
        const snapshot = await get(postIdsRef);
        if (snapshot.exists()) {
          const postIds = Object.keys(snapshot.val());
          console.log('categories.js: Загружены postIds для категории:', categoryId, postIds);
          return postIds;
        } else {
          console.log('categories.js: Посты не найдены для категории:', categoryId);
          return [];
        }
      } catch (error) {
        console.error('categories.js: Ошибка при загрузке postIds:', error);
        commit('SET_ERROR', error.message);
        throw error;
      }
    },

    clearSubscription({ commit, state }) {
      if (state.unsubscribe) {
        state.unsubscribe();
        commit('SET_UNSUBSCRIBE', null);
        console.log('categories.js: Подписка на категории очищена');
      }
    },
  },

  getters: {
    getAllCategories: (state) => {
      const categoriesArray = Object.entries(state.categories || {}).map(([id, data]) => ({
        id,
        ...data,
        postIds: data.postIds ? Object.keys(data.postIds) : [], // Преобразуем postIds в массив
      }));
      console.log('categories.js: Геттер getAllCategories возвращает:', categoriesArray);
      return categoriesArray;
    },
    getCategoryById: (state) => (id) => {
      const category = state.categories[id] || null;
      if (category && category.postIds) {
        category.postIds = Object.keys(category.postIds); // Преобразуем postIds в массив
      }
      console.log('categories.js: Геттер getCategoryById для id:', id, 'возвращает:', category);
      return category;
    },
  },
};