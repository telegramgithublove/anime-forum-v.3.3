// notifications.js
import { ref as databaseRef, set, get, onValue, push, update, off } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  notifications: [],
  isLoading: false,
  error: null,
  unsubscribe: null,
  baseUrl: 'http://95.164.90.115:3000',
};

const mutations = {
  SET_NOTIFICATIONS(state, notifications) {
    console.log('notifications.js: Установка уведомлений:', notifications);
    state.notifications = notifications;
  },
  ADD_NOTIFICATION(state, notification) {
    console.log('notifications.js: Добавление уведомления в состояние:', notification);
    state.notifications.unshift(notification);
  },
  REMOVE_NOTIFICATION(state, notificationId) {
    console.log('notifications.js: Удаление уведомления с ID:', notificationId);
    state.notifications = state.notifications.filter(n => n.id !== notificationId);
  },
  SET_LOADING(state, isLoading) {
    console.log('notifications.js: Установка состояния загрузки:', isLoading);
    state.isLoading = isLoading;
  },
  SET_ERROR(state, error) {
    console.log('notifications.js: Установка ошибки:', error);
    state.error = error;
  },
  SET_UNSUBSCRIBE(state, unsubscribe) {
    console.log('notifications.js: Установка отписки:', unsubscribe);
    state.unsubscribe = unsubscribe;
  },
  CLEAR_NOTIFICATIONS(state) {
    console.log('notifications.js: Очистка уведомлений');
    state.notifications = [];
    if (state.unsubscribe) {
      state.unsubscribe();
      state.unsubscribe = null;
    }
  },
};

const actions = {
  async fetchNotifications({ commit, state }, userId) {
    console.log('notifications.js: Запрос уведомлений для userId:', userId);
    if (!userId) {
      console.error('notifications.js: userId не указан');
      commit('SET_ERROR', 'ID пользователя не указан');
      commit('SET_LOADING', false);
      return;
    }

    if (state.unsubscribe) {
      console.log('notifications.js: Отписка от предыдущего слушателя');
      state.unsubscribe();
    }
    commit('SET_LOADING', true);
    try {
      const notificationsRef = databaseRef(database, `notifications/${userId}`);
      console.log('notifications.js: Установка слушателя для:', `notifications/${userId}`);
      const unsubscribe = onValue(
        notificationsRef,
        (snapshot) => {
          const notifications = snapshot.exists()
            ? Object.entries(snapshot.val()).map(([key, value]) => ({
                id: key,
                ...value,
                userId: value.userId || 'unknown',
              })).sort((a, b) => b.timestamp - a.timestamp)
            : [];
          console.log('notifications.js: Получены уведомления из Firebase:', notifications);
          commit('SET_NOTIFICATIONS', notifications);
          commit('SET_LOADING', false);
        },
        (error) => {
          console.error('notifications.js: Ошибка в подписке:', error);
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

  async addNotification({ commit, rootState }, notificationData) {
    console.log('notifications.js: Добавление уведомления:', notificationData);
    try {
      const userId = rootState.auth.user?.uid || localStorage.getItem('userId') || 'default';
      console.log('notifications.js: Текущий userId:', userId);
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

      console.log('notifications.js: Сохранение уведомления в Firebase:', notification);
      await set(newNotificationRef, notification);
      console.log('notifications.js: Уведомление успешно сохранено с ID:', newNotificationRef.key);
      commit('ADD_NOTIFICATION', { id: newNotificationRef.key, ...notification });
    } catch (error) {
      console.error('notifications.js: Ошибка при добавлении уведомления:', error);
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async toggleCommentLike({ commit }, { postId, commentId, userId, liked }) {
    console.log('notifications.js: Переключение лайка для комментария:', { postId, commentId, userId, liked });
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

      console.log('notifications.js: Обновление лайков:', { likes, likesCount });
      await update(commentRef, { likes, likesCount });
      console.log('notifications.js: Лайк обновлен');
    } catch (error) {
      console.error('notifications.js: Ошибка при обновлении лайка:', error);
      throw error;
    }
  },

  clearNotifications({ commit }) {
    console.log('notifications.js: Очистка уведомлений');
    commit('CLEAR_NOTIFICATIONS');
  },

  startListeningNotifications({ commit, state, rootState }, postId) {
    console.log('notifications.js: Начало прослушивания уведомлений для postId:', postId);
    if (state.unsubscribe) {
      console.log('notifications.js: Уже подписаны на уведомления');
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
        console.log('notifications.js: Обновлены уведомления для postId:', notifications);
        commit('SET_NOTIFICATIONS', notifications);
      },
      (error) => {
        console.error('notifications.js: Ошибка в подписке:', error);
        commit('SET_ERROR', error.message);
      }
    );
    commit('SET_UNSUBSCRIBE', unsubscribe);
  },

  stopListeningNotifications({ commit, state }) {
    console.log('notifications.js: Остановка прослушивания уведомлений');
    if (state.unsubscribe) {
      state.unsubscribe();
      commit('SET_UNSUBSCRIBE', null);
      console.log('notifications.js: Отписка выполнена');
    }
  },
};

const getters = {
  getNotifications: (state) => {
    console.log('notifications.js: Получение всех уведомлений:', state.notifications);
    return state.notifications;
  },
  isLoading: (state) => state.isLoading,
  getError: (state) => state.error,
  getPagedNotifications: (state) => (page, itemsPerPage) => {
    console.log('notifications.js: Получение страниц уведомлений:', { page, itemsPerPage });
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paged = state.notifications.slice(start, end);
    console.log('notifications.js: Страница уведомлений:', paged);
    return paged;
  },
  getTotalNotifications: (state) => {
    const total = state.notifications.length;
    console.log('notifications.js: Общее количество уведомлений:', total);
    return total;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};