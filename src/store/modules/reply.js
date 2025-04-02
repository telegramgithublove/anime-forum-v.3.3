import { ref as databaseRef, push, onValue, update, off, get } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  replies: {},
  isLoading: false,
  error: null,
  unsubscribers: {},
};

const mutations = {
  SET_REPLIES(state, { commentId, replies }) {
    console.log('reply.js - SET_REPLIES: Установка ответов для commentId:', commentId, 'Ответы:', replies);
    state.replies = { ...state.replies, [commentId]: replies };
  },
  SET_LOADING(state, isLoading) {
    console.log('reply.js - SET_LOADING:', isLoading);
    state.isLoading = isLoading;
  },
  SET_ERROR(state, error) {
    console.log('reply.js - SET_ERROR:', error);
    state.error = error;
  },
  SET_UNSUBSCRIBE(state, { commentId, unsubscribe }) {
    console.log('reply.js - SET_UNSUBSCRIBE: Установка отписки для commentId:', commentId);
    state.unsubscribers[commentId] = unsubscribe;
  },
  CLEAR_UNSUBSCRIBE(state, commentId) {
    console.log('reply.js - CLEAR_UNSUBSCRIBE: Очистка отписки для commentId:', commentId);
    delete state.unsubscribers[commentId];
  },
};

const actions = {
  async addReply({ commit }, { postId, commentId, replyData }) {
    console.log('reply.js - addReply: Добавление ответа для postId:', postId, 'commentId:', commentId, 'Данные:', replyData);
    commit('SET_LOADING', true);
    try {
      const repliesRef = databaseRef(database, `posts/${postId}/comments/${commentId}/replies`);
      const newReplyRef = await push(repliesRef, {
        ...replyData,
        likes: {},
        likesCount: 0,
        createdAt: replyData.createdAt || new Date().toISOString(),
      });
      console.log('reply.js - addReply: Ответ добавлен, replyId:', newReplyRef.key);
      commit('SET_LOADING', false);
      return { success: true, replyId: newReplyRef.key };
    } catch (error) {
      console.error('reply.js - addReply: Ошибка:', error);
      commit('SET_ERROR', error.message);
      commit('SET_LOADING', false);
      throw error;
    }
  },

  async fetchReplies({ commit, state }, { postId, commentId }) {
    console.log('reply.js - fetchReplies: Начало загрузки для postId:', postId, 'commentId:', commentId);
    if (state.unsubscribers[commentId]) {
      console.log('reply.js - fetchReplies: Отписка от предыдущей подписки для commentId:', commentId);
      state.unsubscribers[commentId]();
      commit('CLEAR_UNSUBSCRIBE', commentId);
    }

    commit('SET_LOADING', true);
    try {
      const repliesRef = databaseRef(database, `posts/${postId}/comments/${commentId}/replies`);
      const unsubscribe = onValue(
        repliesRef,
        (snapshot) => {
          const replies = [];
          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const replyData = childSnapshot.val();
              console.log('reply.js - fetchReplies: Данные ответа из Firebase:', childSnapshot.key, replyData);
              replies.push({
                id: childSnapshot.key,
                ...replyData,
                likes: replyData.likes || {},
                likesCount: replyData.likesCount || 0,
              });
            });
          } else {
            console.log('reply.js - fetchReplies: Ответов нет в Firebase для commentId:', commentId);
          }
          commit('SET_REPLIES', { commentId, replies });
          commit('SET_LOADING', false);
        },
        (error) => {
          console.error('reply.js - fetchReplies: Ошибка подписки:', error);
          commit('SET_ERROR', error.message);
          commit('SET_LOADING', false);
        }
      );
      commit('SET_UNSUBSCRIBE', { commentId, unsubscribe });
    } catch (error) {
      console.error('reply.js - fetchReplies: Ошибка:', error);
      commit('SET_ERROR', error.message);
      commit('SET_LOADING', false);
    }
  },

  unsubscribeReplies({ commit, state }, { commentId }) {
    console.log('reply.js - unsubscribeReplies: Отписка для commentId:', commentId);
    if (state.unsubscribers[commentId]) {
      state.unsubscribers[commentId]();
      commit('CLEAR_UNSUBSCRIBE', commentId);
    }
  },

  async toggleReplyLike({ commit, state }, { postId, commentId, replyId, userId }) {
    console.log('reply.js - toggleReplyLike: Для replyId:', replyId, 'commentId:', commentId, 'userId:', userId);
    commit('SET_LOADING', true);
    try {
      const replyRef = databaseRef(database, `posts/${postId}/comments/${commentId}/replies/${replyId}`);
      const snapshot = await get(replyRef);
      if (!snapshot.exists()) throw new Error('Ответ не найден');

      const replyData = snapshot.val();
      const likes = replyData.likes || {};
      const currentLikesCount = replyData.likesCount || 0;

      const isLiked = !!likes[userId];
      const newLikesCount = isLiked ? currentLikesCount - 1 : currentLikesCount + 1;
      const updatedLikes = { ...likes, [userId]: isLiked ? null : true };

      await update(replyRef, {
        likes: updatedLikes,
        likesCount: newLikesCount,
      });
      console.log('reply.js - toggleReplyLike: Лайки обновлены:', { likes: updatedLikes, likesCount: newLikesCount });

      const updatedReplies = (state.replies[commentId] || []).map(reply =>
        reply.id === replyId ? { ...reply, likes: updatedLikes, likesCount: newLikesCount } : reply
      );
      commit('SET_REPLIES', { commentId, replies: updatedReplies });
    } catch (error) {
      console.error('reply.js - toggleReplyLike: Ошибка:', error);
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
};

const getters = {
  isLoading: state => state.isLoading,
  getReplies: state => state.replies,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};