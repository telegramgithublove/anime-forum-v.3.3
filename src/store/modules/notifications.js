import { ref as databaseRef, onChildAdded, off } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  notifications: [],
  listeners: {},
};

const mutations = {
  ADD_NOTIFICATION(state, notification) {
    state.notifications.push(notification);
  },
  CLEAR_NOTIFICATIONS(state) {
    state.notifications = [];
  },
  REMOVE_NOTIFICATION(state, id) {
    state.notifications = state.notifications.filter(n => n.id !== id);
  },
  SET_LISTENER(state, { postId, listener }) {
    state.listeners[postId] = listener;
  },
  REMOVE_LISTENER(state, postId) {
    delete state.listeners[postId];
  },
};

const actions = {
  startListeningNotifications({ commit, rootState }, postId) {
    const userId = rootState.auth.user?.uid;
    if (!userId) return;

    const commentsRef = databaseRef(database, `posts/${postId}/comments`);
    
    const listener = onChildAdded(commentsRef, (snapshot) => {
      const comment = snapshot.val();
      const commentId = snapshot.key;

      if (comment.authorId !== userId) {
        commit('ADD_NOTIFICATION', {
          id: commentId,
          type: 'comment',
          postId,
          title: 'Новый комментарий',
          message: `У вас новый комментарий к посту`,
          timestamp: comment.createdAt || Date.now(),
          read: false,
        });
      }

      const repliesRef = databaseRef(database, `posts/${postId}/comments/${commentId}/replies`);
      onChildAdded(repliesRef, (replySnapshot) => {
        const reply = replySnapshot.val();
        if (reply.authorId !== userId && comment.authorId === userId) {
          commit('ADD_NOTIFICATION', {
            id: replySnapshot.key,
            type: 'reply',
            postId,
            commentId,
            title: 'Новый ответ',
            message: `У вас новый ответ на комментарий`,
            timestamp: reply.createdAt || Date.now(),
            read: false,
          });
        }
      });
    });

    commit('SET_LISTENER', { postId, listener });
  },

  stopListeningNotifications({ commit, state }, postId) {
    if (state.listeners[postId]) {
      off(state.listeners[postId]);
      commit('REMOVE_LISTENER', postId);
    }
  },
};

const getters = {
  getNotifications: state => state.notifications,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};