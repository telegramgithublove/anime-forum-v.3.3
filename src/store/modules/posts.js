import { ref as dbRef, push, set, get, onValue, update } from 'firebase/database';
import { getDatabase } from 'firebase/database';

export default {
  namespaced: true,
  state: {
    posts: {},
    loading: false,
    error: null,
    unsubscribe: null,
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
    UPDATE_POST_LIKES(state, { postId, likes, likesCount }) {
      if (state.posts[postId]) {
        state.posts[postId] = {
          ...state.posts[postId],
          likes: { ...likes },
          likesCount,
        };
      }
    },
    UPDATE_POST_VIEWS(state, { postId, views }) {
      if (state.posts[postId]) {
        state.posts[postId] = {
          ...state.posts[postId],
          views,
        };
      }
    },
    SET_UNSUBSCRIBE(state, unsubscribe) {
      state.unsubscribe = unsubscribe;
    },
    UPDATE_POST(state, { postId, updatedData }) {
      if (state.posts[postId]) {
        state.posts[postId] = {
          ...state.posts[postId],
          ...updatedData,
        };
      }
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
          authorName: user.profile.username,
          authorAvatar: user.profile.avatarUrl,
          categoryId,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          views: 0,
          userId: user.uid,
          likes: {},
          comments: {},
        };
    
        // Сохраняем пост в корневой коллекции posts
        await set(newPostRef, postData);
        console.log('posts.js: Пост создан в /posts:', postData);
    
        // Добавляем пост в categories/[categoryId]/posts
        const categoryPostsRef = dbRef(db, `categories/${categoryId}/posts/${postId}`);
        await set(categoryPostsRef, postData);
        console.log('posts.js: Пост добавлен в /categories/[categoryId]/posts:', postData);
    
        // Обновляем postIds
        const categoryRef = dbRef(db, `categories/${categoryId}/postIds/${postId}`);
        await set(categoryRef, true);
    
        // Обновляем postsCount
        const categoryCountRef = dbRef(db, `categories/${categoryId}/postsCount`);
        const snapshot = await get(categoryCountRef);
        const currentCount = snapshot.val() || 0;
        await set(categoryCountRef, currentCount + 1);
    
        // Обновляем lastActivity
        const categoryUpdateRef = dbRef(db, `categories/${categoryId}`);
        await update(categoryUpdateRef, {
          lastActivity: new Date(postData.createdAt).getTime()
        });
        console.log('posts.js: lastActivity обновлен для категории:', categoryId);
    
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
    async fetchPostsByCategory({ commit, state, rootState }, categoryId) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const categoryPostIdsRef = dbRef(db, `categories/${categoryId}/postIds`);
        const snapshot = await get(categoryPostIdsRef);
        const postIds = snapshot.exists() ? Object.keys(snapshot.val()) : [];

        if (state.unsubscribe) {
          state.unsubscribe();
          commit('SET_UNSUBSCRIBE', null);
        }

        const postsRef = dbRef(db, 'posts');
        const unsubscribe = onValue(
          postsRef,
          (snapshot) => {
            const allPosts = snapshot.val() || {};
            const filteredPosts = {};
            const currentUserId = rootState.auth.user?.uid;

            for (const postId of postIds) {
              if (allPosts[postId]) {
                const post = allPosts[postId];
                filteredPosts[postId] = {
                  ...post,
                  isLiked: post.likes && currentUserId ? !!post.likes[currentUserId] : false,
                  views: post.views || 0,
                };
              }
            }

            commit('SET_POSTS', filteredPosts);
            console.log('posts.js: Посты обновлены для категории:', categoryId, filteredPosts);
          },
          (error) => {
            console.error('posts.js: Ошибка в подписке onValue:', error);
            commit('SET_ERROR', error.message);
          }
        );

        commit('SET_UNSUBSCRIBE', unsubscribe);
      } catch (error) {
        console.error('posts.js: Ошибка при загрузке постов:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async fetchPostById({ commit, rootState }, postId) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const postRef = dbRef(db, `posts/${postId}`);
        const snapshot = await get(postRef);
        if (snapshot.exists()) {
          const postData = snapshot.val();
          const currentUserId = rootState.auth.user?.uid;
          const updatedPostData = {
            ...postData,
            isLiked: postData.likes && currentUserId ? !!postData.likes[currentUserId] : false,
            views: postData.views || 0,
          };
          console.log('posts.js: Пост загружен:', updatedPostData);
          commit('SET_POSTS', { [postId]: updatedPostData });
          return updatedPostData;
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

        const snapshot = await get(postRef);
        if (!snapshot.exists()) {
          throw new Error('Пост не найден');
        }

        const postData = snapshot.val();
        const likes = postData.likes || {};
        const currentLikesCount = postData.likesCount || 0;
        const userId = user.uid;

        const isLiked = !!likes[userId];
        const newLikesCount = isLiked ? currentLikesCount - 1 : currentLikesCount + 1;
        const updatedLikes = { ...likes, [userId]: isLiked ? null : true };

        const updates = {
          likesCount: newLikesCount,
          likes: updatedLikes,
        };

        await update(postRef, updates);

        commit('UPDATE_POST_LIKES', {
          postId,
          likes: updatedLikes,
          likesCount: newLikesCount,
        });

        console.log('posts.js: Лайк обновлен для поста:', postId, updates);
        return { ...postData, ...updates, isLiked: !isLiked };
      } catch (error) {
        console.error('posts.js: Ошибка при переключении лайка:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async incrementViews({ commit }, postId) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const postRef = dbRef(db, `posts/${postId}`);
        const snapshot = await get(postRef);
        if (!snapshot.exists()) {
          throw new Error('Пост не найден');
        }

        const postData = snapshot.val();
        const currentViews = postData.views || 0;
        const newViews = currentViews + 1;

        await update(postRef, { views: newViews });
        commit('UPDATE_POST_VIEWS', { postId, views: newViews });

        console.log('posts.js: Просмотры обновлены для поста:', postId, newViews);
        return { ...postData, views: newViews };
      } catch (error) {
        console.error('posts.js: Ошибка при обновлении просмотров:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async listenPostViews({ commit }, { postId, categoryId }) {
      try {
        const db = getDatabase();
        const postRef = dbRef(db, `categories/${categoryId}/posts/${postId}`);
        onValue(postRef, (snapshot) => {
          if (snapshot.exists()) {
            const postData = snapshot.val();
            commit('UPDATE_POST', {
              postId,
              updatedData: {
                views: postData.views || 0,
              },
            });
          }
        });
      } catch (error) {
        console.error('posts.js: Ошибка при подписке на обновления просмотров:', error);
      }
    },

    async fetchAllPosts({ commit }) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const postsRef = dbRef(db, 'posts');
        const snapshot = await get(postsRef);
        
        if (snapshot.exists()) {
          const allPosts = snapshot.val();
          commit('SET_POSTS', allPosts);
          console.log('posts.js: Все посты загружены:', allPosts);
          return allPosts;
        } else {
          console.warn('posts.js: Посты не найдены');
          return {};
        }
      } catch (error) {
        console.error('posts.js: Ошибка при загрузке всех постов:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
  },
  getters: {
    getPostsByCategory: (state, getters, rootState) => (categoryId) => {
      const currentUserId = rootState.auth.user?.uid;
      return Object.values(state.posts)
        .filter((post) => post.categoryId === categoryId)
        .map((post) => ({
          ...post,
          isLiked: post.likes && currentUserId ? !!post.likes[currentUserId] : false,
          views: post.views || 0,
        }));
    },
    getPostById: (state, getters, rootState) => (postId) => {
      const currentUserId = rootState.auth.user?.uid;
      const post = state.posts[postId];
      if (!post) return null;
      return {
        ...post,
        isLiked: post.likes && currentUserId ? !!post.likes[currentUserId] : false,
        views: post.views || 0,
      };
    },
    getPopularPosts: (state) => {
      return Object.values(state.posts)
        .filter(post => post.views !== undefined)
        .sort((a, b) => (b.views || 0) - (a.views || 0));
    },
  },
};