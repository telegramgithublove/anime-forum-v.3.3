import { ref as dbRef, push, set, get, onValue, update } from 'firebase/database'; // Добавляем update
import { getDatabase } from 'firebase/database';

export default {
  namespaced: true,
  state: {
    posts: {},
    loading: false,
    error: null,
  },
  mutations: {
    SET_POSTS(state, posts) {
      state.posts = { ...state.posts, ...posts };
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
  },
  actions: {
    async createPost({ commit, rootState }, { title, content, categoryId }) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const postsRef = dbRef(db, 'posts');
        const newPostRef = push(postsRef);
        const postId = newPostRef.key;

        const user = rootState.auth.user;
        if (!user) throw new Error('Требуется авторизация');

        const postData = {
          id: postId,
          title,
          content,
          authorId: user.uid,
          categoryId,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          views: 0,
          userId: user.uid,
          likes: {}, // Добавляем объект для хранения лайков
        };

        await set(newPostRef, postData);
        console.log('posts.js: Пост создан:', postData);

        const categoryRef = dbRef(db, `categories/${categoryId}/postIds/${postId}`);
        await set(categoryRef, true);
        console.log('posts.js: Ссылка на пост добавлена в категорию:', categoryId);

        const categoryCountRef = dbRef(db, `categories/${categoryId}/postsCount`);
        const snapshot = await get(categoryCountRef);
        const currentCount = snapshot.val() || 0;
        await set(categoryCountRef, currentCount + 1);

        commit('SET_POSTS', { [postId]: postData });
        return postId;
      } catch (error) {
        console.error('posts.js: Ошибка при создании поста:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async fetchPostsByCategory({ commit }, categoryId) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const categoryPostIdsRef = dbRef(db, `categories/${categoryId}/postIds`);
        const snapshot = await get(categoryPostIdsRef);
        const postIds = snapshot.exists() ? Object.keys(snapshot.val()) : [];

        const posts = {};
        for (const postId of postIds) {
          const postRef = dbRef(db, `posts/${postId}`);
          const postSnapshot = await get(postRef);
          if (postSnapshot.exists()) {
            posts[postId] = postSnapshot.val();
          }
        }

        console.log('posts.js: Посты загружены для категории:', categoryId, posts);
        commit('SET_POSTS', posts);
      } catch (error) {
        console.error('posts.js: Ошибка при загрузке постов:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async fetchPostById({ commit }, postId) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const postRef = dbRef(db, `posts/${postId}`);
        const snapshot = await get(postRef);
        if (snapshot.exists()) {
          const postData = snapshot.val();
          console.log('posts.js: Пост загружен:', postData);
          commit('SET_POSTS', { [postId]: postData });
          return postData;
        } else {
          console.warn('posts.js: Пост не найден для postId:', postId);
          return null;
        }
      } catch (error) {
        console.error('posts.js: Ошибка при загрузке поста:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async toggleLike({ commit, rootState }, postId) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const postRef = dbRef(db, `posts/${postId}`);
        const user = rootState.auth.user;

        if (!user) throw new Error('Требуется авторизация для лайка');

        // Получаем текущие данные поста
        const snapshot = await get(postRef);
        if (!snapshot.exists()) {
          throw new Error('Пост не найден');
        }

        const postData = snapshot.val();
        const likes = postData.likes || {};
        const currentLikesCount = postData.likesCount || 0;
        const userId = user.uid;

        // Проверяем, лайкнул ли пользователь уже этот пост
        const isLiked = !!likes[userId];
        const newLikesCount = isLiked ? currentLikesCount - 1 : currentLikesCount + 1;
        const updatedLikes = { ...likes, [userId]: isLiked ? null : true }; // null удаляет ключ из Firebase

        // Обновляем пост в базе данных
        const updates = {
          likesCount: newLikesCount,
          likes: updatedLikes,
        };
        await update(postRef, updates);

        // Обновляем локальное состояние
        const updatedPostData = {
          ...postData,
          likesCount: newLikesCount,
          likes: updatedLikes,
        };
        commit('SET_POSTS', { [postId]: updatedPostData });
        console.log('posts.js: Лайк обновлен для поста:', updatedPostData);

        return updatedPostData; // Возвращаем обновленные данные поста
      } catch (error) {
        console.error('posts.js: Ошибка при переключении лайка:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
  },
  getters: {
    getPostsByCategory: (state) => (categoryId) => {
      return Object.values(state.posts).filter(post => post.categoryId === categoryId);
    },
    getPostById: (state) => (postId) => state.posts[postId] || null,
  },
};