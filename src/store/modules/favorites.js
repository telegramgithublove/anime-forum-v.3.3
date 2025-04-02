import { getDatabase, ref, get, set, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default {
  namespaced: true,
  state() {
    return {
      favoritePosts: []
    };
  },
  mutations: {
    SET_FAVORITE_POSTS(state, posts) {
      console.log('favorites.js - Установка избранных постов:', posts);
      state.favoritePosts = posts;
    },
    ADD_TO_FAVORITES(state, post) {
      console.log('favorites.js - Добавление в избранное:', post);
      state.favoritePosts.push(post);
    },
    REMOVE_FROM_FAVORITES(state, postId) {
      console.log('favorites.js - Удаление из избранного, postId:', postId);
      state.favoritePosts = state.favoritePosts.filter(post => post.id !== postId);
    }
  },
  actions: {
    async fetchFavoritePosts({ commit }) {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.error('favorites.js - Пользователь не авторизован');
        throw new Error('User not authenticated');
      }
      const db = getDatabase();
      const favoritesRef = ref(db, `favorites/${user.uid}`);
      console.log('favorites.js - Запрос избранных постов для userId:', user.uid);

      try {
        const snapshot = await get(favoritesRef);
        console.log('favorites.js - Снимок избранных постов:', snapshot.val());
        if (snapshot.exists()) {
          const favoritesData = snapshot.val();
          const favoritePostIds = Object.keys(favoritesData);
          console.log('favorites.js - ID избранных постов:', favoritePostIds);
          const postsPromises = favoritePostIds.map(async (postId) => {
            const categoryId = favoritesData[postId].categoryId || '-OJTCQi2RB-FivSg_Cap'; // Используем сохраненный categoryId
            const postRef = ref(db, `categories/${categoryId}/posts/${postId}`);
            console.log('favorites.js - Запрос поста:', postId, 'categoryId:', categoryId);
            const snap = await get(postRef);
            console.log(`favorites.js - Данные поста ${postId}:`, snap.val());
            return snap.exists() ? { id: postId, ...snap.val() } : null;
          });
          const posts = (await Promise.all(postsPromises)).filter(Boolean);
          commit('SET_FAVORITE_POSTS', posts);
        } else {
          console.log('favorites.js - Нет избранных постов для пользователя');
          commit('SET_FAVORITE_POSTS', []);
        }
      } catch (error) {
        console.error('favorites.js - Ошибка при получении избранных постов:', error);
        throw error;
      }
    },
    async toggleFavorite({ commit, state, dispatch }, { postId, categoryId }) {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.error('favorites.js - Пользователь не авторизован для переключения избранного');
        throw new Error('User not authenticated');
      }
      if (!postId) {
        console.error('favorites.js - postId не передан!');
        throw new Error('Post ID is required');
      }
      const db = getDatabase();
      const favoriteRef = ref(db, `favorites/${user.uid}/${postId}`);
      console.log('favorites.js - Переключение избранного для postId:', postId, 'userId:', user.uid);

      try {
        const isFavorite = state.favoritePosts.some(post => post.id === postId);
        console.log('favorites.js - Пост уже в избранном:', isFavorite);
        if (isFavorite) {
          console.log('favorites.js - Удаление поста из избранного:', postId);
          await remove(favoriteRef);
          commit('REMOVE_FROM_FAVORITES', postId);
        } else {
          const postRef = ref(db, `categories/${categoryId || '-OJTCQi2RB-FivSg_Cap'}/posts/${postId}`);
          console.log('favorites.js - Проверка существования поста:', postId);
          const postSnapshot = await get(postRef);
          console.log('favorites.js - Данные поста из Firebase:', postSnapshot.val());
          if (!postSnapshot.exists()) {
            console.error('favorites.js - Пост не найден в Firebase для postId:', postId);
            throw new Error('Post not found');
          }
          const postData = { id: postId, ...postSnapshot.val() };
          console.log('favorites.js - Добавление поста в избранное:', postData);
          await set(favoriteRef, { isFavorite: true, categoryId: categoryId || '-OJTCQi2RB-FivSg_Cap' }); // Сохраняем categoryId
          commit('ADD_TO_FAVORITES', postData);
        }
        await dispatch('fetchFavoritePosts');
      } catch (error) {
        console.error('favorites.js - Ошибка при переключении избранного:', error);
        throw error;
      }
    }
  },
  getters: {
    getFavoritePosts(state) {
      console.log('favorites.js - Получение избранных постов из состояния:', state.favoritePosts);
      return state.favoritePosts;
    }
  }
};