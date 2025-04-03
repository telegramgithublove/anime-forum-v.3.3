import { ref as databaseRef, set, get, onValue, push, update, off } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  notifications: [], // Изменено с comments на notifications
  isLoading: false,
  error: null,
  unsubscribe: null,
  baseUrl: 'http://95.164.90.115:3000',
};

const mutations = {
  SET_NOTIFICATIONS(state, notifications) { // Изменено с SET_COMMENTS
    state.notifications = notifications;
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
  CLEAR_NOTIFICATIONS(state) { // Изменено с CLEAR_COMMENTS
    state.notifications = [];
    if (state.unsubscribe) {
      state.unsubscribe();
      state.unsubscribe = null;
    }
  },
};

const actions = {
  async fetchNotifications({ commit, state }, userId) { // Изменено с fetchComments
    if (!userId) {
      console.error('notifications.js: userId не указан для fetchNotifications');
      commit('SET_ERROR', 'ID пользователя не указан');
      commit('SET_LOADING', false);
      return;
    }

    if (state.unsubscribe) {
      state.unsubscribe();
    }
    commit('SET_LOADING', true);
    try {
      const notificationsRef = databaseRef(database, `notifications/${userId}`);
      const unsubscribe = onValue(
        notificationsRef,
        (snapshot) => {
          const notifications = snapshot.exists()
            ? Object.entries(snapshot.val()).map(([key, value]) => ({
                id: key,
                ...value,
                userId: value.userId || 'unknown',
              }))
            : [];
          console.log('notifications.js: Загружены уведомления:', notifications);
          commit('SET_NOTIFICATIONS', notifications);
          commit('SET_LOADING', false);
        },
        (error) => {
          console.error('notifications.js: Ошибка в подписке на уведомления:', error);
          commit('SET_ERROR', error.message);
          commit('SET_LOADING', false);
        }
      );
      commit('SET_UNSUBSCRIBE', unsubscribe);
    } catch (error) {
      console.error('notifications.js: Ошибка при загрузке уведомлений:', error);
      commit('SET_ERROR', error.message);
      commit('SET_LOADING', false);
    }
  },

  async addNotification({ commit, rootState }, notificationData) { // Изменено с addComment
    try {
      const userId = rootState.auth.user?.uid || localStorage.getItem('userId') || 'default';
      if (!userId) throw new Error('Пользователь не авторизован');

      const notificationsRef = databaseRef(database, `notifications/${notificationData.userId}`);
      const newNotificationRef = push(notificationsRef);

      const notification = {
        userId: notificationData.userId,
        postId: notificationData.postId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        timestamp: notificationData.timestamp || Date.now(),
      };

      await set(newNotificationRef, notification);
      console.log('notifications.js: Уведомление успешно добавлено:', notification);
      commit('ADD_NOTIFICATION', notification); // Добавляем мутацию для локального обновления
    } catch (error) {
      console.error('notifications.js: Ошибка при добавлении уведомления:', error);
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async toggleCommentLike({ commit }, { postId, commentId, userId, liked }) { // Оставлено как есть, но не используется для уведомлений
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
      console.log(`notifications.js: Лайк для комментария ${commentId} обновлен:`, { liked, likesCount });
    } catch (error) {
      console.error('notifications.js: Ошибка при обновлении лайка:', error);
      throw error;
    }
  },

  clearNotifications({ commit }) { // Изменено с clearComments
    commit('CLEAR_NOTIFICATIONS');
  },

  // Добавлены новые действия для Notifications.vue
  startListeningNotifications({ commit, state, rootState }, postId) {
    if (state.unsubscribe) {
      console.log(`notifications.js: Уже подписаны на уведомления для postId ${postId}`);
      return;
    }

    const userId = rootState.auth.user?.uid;
    if (!userId) {
      console.error('notifications.js: Пользователь не авторизован');
      return;
    }

    const notificationsRef = databaseRef(database, `notifications/${userId}`);
    const unsubscribe = onValue(
      notificationsRef,
      (snapshot) => {
        const notifications = snapshot.exists()
          ? Object.entries(snapshot.val()).map(([key, value]) => ({
              id: key,
              ...value,
            })).filter((n) => n.postId === postId)
          : [];
        console.log(`notifications.js: Уведомления для postId ${postId} обновлены:`, notifications);
        commit('SET_NOTIFICATIONS', notifications);
      },
      (error) => {
        console.error(`notifications.js: Ошибка подписки на уведомления для postId ${postId}:`, error);
        commit('SET_ERROR', error.message);
      }
    );
    commit('SET_UNSUBSCRIBE', unsubscribe);
  },

  stopListeningNotifications({ commit, state }) {
    if (state.unsubscribe) {
      state.unsubscribe();
      commit('SET_UNSUBSCRIBE', null);
      console.log('notifications.js: Отписка от уведомлений выполнена');
    }
  },
};

const getters = {
  getNotifications: (state) => state.notifications, // Изменено с getComments
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