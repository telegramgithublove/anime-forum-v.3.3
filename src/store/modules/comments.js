import { ref as databaseRef, set, get, onValue, push, update } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  comments: [],
  isLoading: false,
  error: null,
  unsubscribe: null,
  baseUrl: 'http://95.164.90.115:3000',
};

const mutations = {
  SET_COMMENTS(state, comments) {
    state.comments = comments;
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_UNSUBSCRIBE(state, unsubscribe) {
    state.unsubscribe = unsubscribe;
  },
  CLEAR_COMMENTS(state) {
    state.comments = [];
    if (state.unsubscribe) {
      state.unsubscribe();
      state.unsubscribe = null;
    }
  },
};

const actions = {
  async fetchComments({ commit, state }, postId) {
    if (!postId) {
      console.error('comments.js: postId не указан для fetchComments');
      commit('SET_ERROR', 'ID поста не указан');
      commit('SET_LOADING', false);
      return;
    }

    if (state.unsubscribe) {
      state.unsubscribe();
    }
    commit('SET_LOADING', true);
    try {
      const commentsRef = databaseRef(database, `posts/${postId}/comments`);
      const unsubscribe = onValue(
        commentsRef,
        (snapshot) => {
          const comments = snapshot.exists()
            ? Object.entries(snapshot.val()).map(([key, value]) => ({
                id: key,
                ...value,
                authorId: value.authorId || 'unknown',
                author: {
                  username: value.author?.username || 'Гость',
                  avatarUrl: value.author?.avatarUrl || '/image/empty_avatar.png',
                  signature: value.author?.signature || 'Участник форума',
                },
              }))
            : [];
          console.log('comments.js: Загружены комментарии:', comments);
          commit('SET_COMMENTS', comments);
          commit('SET_LOADING', false);
        },
        (error) => {
          console.error('comments.js: Ошибка в подписке на комментарии:', error);
          commit('SET_ERROR', error.message);
          commit('SET_LOADING', false);
        }
      );
      commit('SET_UNSUBSCRIBE', unsubscribe);
    } catch (error) {
      console.error('comments.js: Ошибка при загрузке комментариев:', error);
      commit('SET_ERROR', error.message);
      commit('SET_LOADING', false);
    }
  },

  async addComment({ commit, rootState, dispatch }, commentData) {
    try {
      const userId = rootState.auth.user?.uid || localStorage.getItem('userId') || 'default';
      if (!userId) throw new Error('Пользователь не авторизован');

      const userRef = databaseRef(database, `users/${userId}`);
      const userSnapshot = await get(userRef);
      const userProfile = userSnapshot.exists() ? userSnapshot.val().profile : {};

      const commentsRef = databaseRef(database, `posts/${commentData.postId}/comments`);
      const newCommentRef = push(commentsRef);

      const comment = {
        authorId: userId,
        author: {
          username: userProfile.username || 'Гость',
          avatarUrl: userProfile.avatarUrl || '/image/empty_avatar.png',
          signature: userProfile.signature || 'Участник форума',
        },
        content: commentData.content,
        image: commentData.image || null,
        video: commentData.video || null,
        audio: commentData.audio || null,
        createdAt: Date.now(),
        likes: {},
        likesCount: 0,
      };

      await set(newCommentRef, comment);
      console.log('comments.js: Комментарий успешно добавлен:', comment);

      // Создаем уведомление для автора поста
      const postRef = databaseRef(database, `posts/${commentData.postId}`);
      const postSnapshot = await get(postRef);
      if (postSnapshot.exists()) {
        const post = postSnapshot.val();
        if (post.authorId && post.authorId !== userId) {
          const notificationData = {
            userId: post.authorId,
            postId: commentData.postId,
            title: 'Новый комментарий',
            message: `${userProfile.username || 'Гость'} оставил комментарий к вашему посту: "${commentData.content.substring(0, 50)}..."`,
            type: 'comment',
            timestamp: Date.now(),
          };
          await dispatch('notifications/addNotification', notificationData, { root: true });
        }
      }
    } catch (error) {
      console.error('comments.js: Ошибка при добавлении комментария:', error);
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async toggleCommentLike({ commit }, { postId, commentId, userId, liked }) {
    try {
      const commentRef = databaseRef(database, `posts/${postId}/comments/${commentId}`);
      const snapshot = await get(commentRef);
      if (!snapshot.exists()) throw new Error('Комментарий не найден');

      const commentData = snapshot.val();
      const likes = commentData.likes || {};
      let likesCount = commentData.likesCount || 0;

      if (liked) {
        likes[userId] = true;
        likesCount += 1;
      } else {
        delete likes[userId];
        likesCount = Math.max(likesCount - 1, 0);
      }

      await update(commentRef, { likes, likesCount });
      console.log(`comments.js: Лайк для комментария ${commentId} обновлен:`, { liked, likesCount });
    } catch (error) {
      console.error('comments.js: Ошибка при обновлении лайка:', error);
      throw error;
    }
  },

  clearComments({ commit }) {
    commit('CLEAR_COMMENTS');
  },
};

const getters = {
  getComments: (state) => state.comments,
  isLoading: (state) => state.isLoading,
  getError: (state) => state.error,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};