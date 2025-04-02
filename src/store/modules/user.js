import axios from 'axios';
import { auth, database } from '@/plugins/firebase';
import { ref as databaseRef, set, update, onValue } from 'firebase/database';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  onAuthStateChanged,
  getIdToken
} from 'firebase/auth';

const state = {
  user: null,
  users: {},
  loading: false,
  error: null,
  authInitialized: false,
  isVerified: false,
  unsubscribeUsers: {}
};

const mutations = {
  setUser(state, user) {
    state.user = user;
    state.isVerified = user ? user.emailVerified : false;
  },
  setUsers(state, { uid, data }) {
    console.log('user.js - Установка данных пользователя:', { uid, data });
    state.users[uid] = data;
  },
  setLoading(state, loading) {
    state.loading = loading;
  },
  setError(state, error) {
    state.error = error;
  },
  setAuthInitialized(state, initialized) {
    state.authInitialized = initialized;
  },
  setUnsubscribeUser(state, { uid, unsubscribe }) {
    state.unsubscribeUsers[uid] = unsubscribe;
  },
  clearUnsubscribeUser(state, uid) {
    if (state.unsubscribeUsers[uid]) {
      state.unsubscribeUsers[uid]();
      delete state.unsubscribeUsers[uid];
    }
  }
};

const actions = {
  async fetchUsers({ commit }) {
    commit('setLoading', true);
    try {
      const response = await axios.get('https://forum-e06cc-default-rtdb.firebaseio.com/users.json');
      const users = response.data;
      Object.entries(users || {}).forEach(([uid, data]) => {
        commit('setUsers', { uid, data });
      });
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      commit('setError', error.message);
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },

  initAuth({ commit }) {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          const userData = {
            email: user.email,
            uid: user.uid,
            emailVerified: user.emailVerified,
            profile: user.profile || {}
          };
          commit('setUser', userData);
          commit('setUsers', { uid: user.uid, data: userData });
        } else {
          commit('setUser', null);
        }
        commit('setAuthInitialized', true);
        unsubscribe();
        resolve();
      });
    });
  },

  async registerUser({ commit }, { email, password, username, signature }) {
    commit('setLoading', true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await getIdToken(user);

      await sendEmailVerification(user);

      const userData = {
        email: user.email,
        uid: user.uid,
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'active',
        profile: {
          username: username || 'Гость',
          avatarUrl: '/image/empty_avatar.png',
          signature: signature || 'Участник форума'
        }
      };

      await set(databaseRef(database, `users/${user.uid}`), userData);
      await axios.put(
        `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${user.uid}.json?auth=${idToken}`,
        userData
      );

      commit('setUser', userData);
      commit('setUsers', { uid: user.uid, data: userData });
    } catch (error) {
      console.error('Registration error:', error);
      commit('setError', error.message);
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },

  async loginUser({ commit, dispatch }, { email, password }) {
    commit('setLoading', true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await getIdToken(user);

      const userRef = databaseRef(database, `users/${user.uid}`);
      const updates = {
        lastLogin: new Date().toISOString(),
        emailVerified: user.emailVerified,
        status: 'online'
      };
      await update(userRef, updates);

      const userSnapshot = await axios.get(
        `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${user.uid}.json?auth=${idToken}`
      );
      const userData = userSnapshot.data || {};

      const fullUserData = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        ...userData,
        profile: userData.profile || {}
      };

      localStorage.setItem('userToken', idToken);
      commit('setUser', fullUserData);
      commit('setUsers', { uid: user.uid, data: fullUserData });

      if (user.emailVerified) {
        await dispatch('fetchUserRole');
      }
      return user;
    } catch (error) {
      console.error('Login error:', error);
      commit('setError', error.message);
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },

  async fetchUserData({ commit, state }, uid) {
    if (state.users[uid]) {
      console.log('user.js - Данные пользователя из кэша:', state.users[uid]);
      return state.users[uid];
    }

    commit('setLoading', true);
    try {
      const userRef = databaseRef(database, `users/${uid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          console.log('user.js - Данные пользователя загружены из базы:', userData);
          commit('setUsers', { uid, data: userData });
        } else {
          console.warn('user.js - Пользователь не найден в базе:', uid);
          commit('setUsers', { 
            uid, 
            data: { 
              profile: { username: 'Гость', avatarUrl: '/image/empty_avatar.png', signature: 'Участник форума' } 
            } 
          });
        }
      }, (error) => {
        console.error('user.js - Ошибка подписки на данные пользователя:', error);
        commit('setError', error.message);
      });
      commit('setUnsubscribeUser', { uid, unsubscribe });
      const snapshot = await axios.get(
        `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${uid}.json`
      );
      const userData = snapshot.data || { profile: { username: 'Гость', avatarUrl: '/image/empty_avatar.png', signature: 'Участник форума' } };
      console.log('user.js - Данные пользователя через axios:', userData);
      commit('setUsers', { uid, data: userData });
      return userData;
    } catch (error) {
      console.error('user.js - Ошибка загрузки данных пользователя:', error);
      commit('setError', error.message);
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },

  async fetchUserRole({ commit, state }) {
    if (!state.user?.uid) return null;
    try {
      const idToken = await getIdToken(auth.currentUser);
      const response = await axios.get(
        `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${state.user.uid}/role.json?auth=${idToken}`
      );
      const role = response.data || 'user';
      commit('setUser', { ...state.user, role });
      return role;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }
  },

  updateUser({ commit }, user) {
    commit('setUser', user);
    commit('setUsers', { uid: user.uid, data: user });
  },

  clearUser({ commit }) {
    commit('setUser', null);
    Object.keys(state.unsubscribeUsers).forEach(uid => {
      commit('clearUnsubscribeUser', uid);
    });
  }
};

const getters = {
  isAuthenticated: state => !!state.user,
  currentUser: state => state.user,
  getUserById: state => uid => state.users[uid] || { profile: { username: 'Гость', avatarUrl: '/image/empty_avatar.png', signature: 'Участник форума' } },
  isLoading: state => state.loading,
  error: state => state.error,
  isVerified: state => state.isVerified,
  hasFullAccess: state => state.user && state.isVerified
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};