import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
  onAuthStateChanged
} from 'firebase/auth';
import { ref as databaseRef, get, set, update } from 'firebase/database';
import { auth as firebaseAuth, database } from '../../plugins/firebase';

console.log('auth.js: Модуль auth инициализирован');

const state = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: null,
  authUnsubscribe: null,
  users: {}, // Кэш всех пользователей
};

const getters = {
  isAuthenticated: state => state.isAuthenticated,
  currentUser: state => state.user,
  getUserId: state => state.user?.uid || null,
  authError: state => state.error,
  isLoading: state => state.loading,
  getUsername: state => state.user?.profile?.username || 'Гость',
  getUserAvatar: state => state.user?.profile?.avatarUrl || '/image/empty_avatar.png',
  getUserSignature: state => state.user?.profile?.signature || '',
  isSuperUser: state => state.user?.role === 'superuser',
  userRole: state => state.user?.role || null,
  isEmailVerified: state => state.user?.emailVerified || false,
  getUserSettings: state => state.user?.settings || {},
  getUserById: state => (uid) => state.users[uid] || { profile: { username: 'Гость', avatarUrl: '/image/empty_avatar.png', signature: '' } },
};

const actions = {
  async registration({ commit }, userData) {
    console.log('auth.js: Вызов действия registration с данными:', userData);
    try {
      if (!userData.username || !userData.email || !userData.password || !userData.passwordConfirmation) {
        throw new Error('Пожалуйста, заполните все поля.');
      }
      if (userData.password !== userData.passwordConfirmation) {
        throw new Error('Пароли не совпадают');
      }

      const usersRef = databaseRef(database, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        const usernameTaken = Object.values(users).some(user => user.profile?.username === userData.username);
        const emailTaken = Object.values(users).some(user => user.email === userData.email);
        if (usernameTaken) throw new Error('Этот username уже занят');
        if (emailTaken) throw new Error('Этот email уже зарегистрирован');
      }

      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, userData.email, userData.password);
      const user = userCredential.user;
      console.log('auth.js: Пользователь зарегистрирован:', { uid: user.uid, email: user.email });

      await sendEmailVerification(user, { url: window.location.origin + '/verify-email' });
      console.log('auth.js: Письмо для подтверждения отправлено');

      const userRef = databaseRef(database, `users/${user.uid}`);
      const userProfile = {
        username: userData.username,
        avatarUrl: '/image/empty_avatar.png',
        signature: 'New User'
      };
      const userDataForDB = {
        uid: user.uid,
        email: userData.email,
        role: 'user',
        profile: userProfile,
        settings: { profileVisibility: true, notifyMessages: true, notifyReplies: true, theme: 'light' },
        emailVerified: false,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        status: 'active'
      };

      await set(userRef, userDataForDB);
      console.log('auth.js: Данные пользователя записаны в БД');

      const userDataToStore = {
        uid: user.uid,
        email: userData.email,
        profile: userProfile,
        role: 'user',
        emailVerified: false,
        settings: userDataForDB.settings
      };

      commit('SET_USER', userDataToStore);
      commit('SET_USERS', { uid: user.uid, data: userDataToStore });
      commit('SET_AUTHENTICATED', true);
      commit('SET_TOKEN', await user.getIdToken());
      console.log('auth.js: Состояние пользователя обновлено в store:', userDataToStore);

      return { success: true, user: userDataToStore };
    } catch (error) {
      console.error('auth.js: Ошибка при регистрации:', error);
      throw new Error(error.message || 'Ошибка при регистрации');
    }
  },

  async login({ commit }, { email, password }) {
    console.log('auth.js: Вызов действия login с данными:', { email });
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;
      console.log('auth.js: Пользователь авторизован:', { uid: user.uid, email: user.email });

      const userRef = databaseRef(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.exists() ? snapshot.val() : {};

      if (userData.role === 'superuser') {
        console.log('auth.js: Обнаружен вход суперпользователя');
      }

      const userDataToStore = {
        uid: user.uid,
        email: user.email,
        profile: {
          username: userData.profile?.username || 'Гость',
          avatarUrl: userData.profile?.avatarUrl || '/image/empty_avatar.png',
          signature: userData.profile?.signature || ''
        },
        role: userData.role || 'user',
        emailVerified: user.emailVerified,
        settings: userData.settings || { profileVisibility: true, notifyMessages: true, notifyReplies: true, theme: 'light' }
      };

      commit('SET_USER', userDataToStore);
      commit('SET_USERS', { uid: user.uid, data: userDataToStore });
      commit('SET_AUTHENTICATED', true);
      commit('SET_TOKEN', await user.getIdToken());
      console.log('auth.js: Состояние пользователя обновлено в store:', userDataToStore);

      return { error: false, user: userDataToStore, redirectTo: userDataToStore.role === 'superuser' ? '/admin' : '/' };
    } catch (error) {
      console.error('auth.js: Ошибка при входе:', error);
      await signOut(firebaseAuth);
      throw new Error(error.message || 'Ошибка при входе');
    }
  },

  async logout({ commit, state }) {
    console.log('auth.js: Вызов действия logout');
    try {
      await signOut(firebaseAuth);
      console.log('auth.js: Пользователь вышел из системы');
      commit('SET_USER', null);
      commit('SET_AUTHENTICATED', false);
      commit('SET_TOKEN', null);
      if (state.authUnsubscribe) {
        state.authUnsubscribe();
        commit('SET_AUTH_UNSUBSCRIBE', null);
        console.log('auth.js: Отписка от onAuthStateChanged выполнена');
      }
      return true;
    } catch (error) {
      console.error('auth.js: Ошибка при выходе:', error);
      throw new Error(error.message || 'Ошибка при выходе');
    }
  },

  async initAuth({ commit, state }) {
    console.log('auth.js: Вызов действия initAuth');
    return new Promise((resolve) => {
      if (state.authUnsubscribe) {
        console.log('auth.js: Подписка уже существует, пропускаем повторный вызов');
        resolve(state.user);
        return;
      }

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        console.log('auth.js: Состояние аутентификации изменилось, user:', user ? { uid: user.uid, email: user.email } : 'undefined');
        if (user) {
          try {
            const token = await user.getIdToken(true);
            const userRef = databaseRef(database, `users/${user.uid}`);
            const snapshot = await get(userRef);
            const userData = snapshot.exists() ? snapshot.val() : {};

            const userDataToStore = {
              uid: user.uid,
              email: user.email,
              profile: {
                username: userData.profile?.username || 'Гость',
                avatarUrl: userData.profile?.avatarUrl || '/image/empty_avatar.png',
                signature: userData.profile?.signature || ''
              },
              role: userData.role || 'user',
              emailVerified: user.emailVerified,
              settings: userData.settings || { profileVisibility: true, notifyMessages: true, notifyReplies: true, theme: 'light' }
            };

            commit('SET_USER', userDataToStore);
            commit('SET_USERS', { uid: user.uid, data: userDataToStore });
            commit('SET_AUTHENTICATED', true);
            commit('SET_TOKEN', token);
            console.log('auth.js: Состояние пользователя обновлено в store:', userDataToStore);
          } catch (error) {
            console.error('auth.js: Ошибка при загрузке данных пользователя:', error);
            commit('SET_USER', null);
            commit('SET_AUTHENTICATED', false);
            commit('SET_TOKEN', null);
          }
        } else {
          commit('SET_USER', null);
          commit('SET_AUTHENTICATED', false);
          commit('SET_TOKEN', null);
          console.log('auth.js: Пользователь не авторизован, состояние сброшено');
        }
        resolve(user);
      });
      commit('SET_AUTH_UNSUBSCRIBE', unsubscribe);
      console.log('auth.js: Подписка на onAuthStateChanged установлена');
    });
  },

  async setUser({ commit }, userData) {
    console.log('auth.js: Вызов действия setUser с данными:', userData);
    try {
      if (userData) {
        const userRef = databaseRef(database, `users/${userData.uid}`);
        const snapshot = await get(userRef);
        const userDataFromDB = snapshot.exists() ? snapshot.val() : {};

        const userDataToStore = {
          uid: userData.uid,
          email: userData.email,
          profile: {
            username: userDataFromDB.profile?.username || userData.profile?.username || 'Гость',
            avatarUrl: userDataFromDB.profile?.avatarUrl || userData.profile?.avatarUrl || '/image/empty_avatar.png',
            signature: userDataFromDB.profile?.signature || userData.profile?.signature || ''
          },
          role: userDataFromDB.role || userData.role || 'user',
          emailVerified: userData.emailVerified || false,
          settings: userDataFromDB.settings || userData.settings || { profileVisibility: true, notifyMessages: true, notifyReplies: true, theme: 'light' }
        };

        commit('SET_USER', userDataToStore);
        commit('SET_USERS', { uid: userData.uid, data: userDataToStore });
        commit('SET_AUTHENTICATED', true);
        commit('SET_TOKEN', userData.token);
        console.log('auth.js: Состояние пользователя обновлено в store:', userDataToStore);
      } else {
        commit('SET_USER', null);
        commit('SET_AUTHENTICATED', false);
        commit('SET_TOKEN', null);
        console.log('auth.js: Пользователь не авторизован, состояние сброшено');
      }
    } catch (error) {
      console.error('auth.js: Ошибка при установке пользователя:', error);
      throw error;
    }
  },

  async fetchUserData({ commit, state }, uid) {
    console.log('auth.js: Вызов действия fetchUserData для uid:', uid);
    if (state.users[uid]) {
      console.log('auth.js: Данные пользователя уже есть в state.users:', state.users[uid]);
      return state.users[uid];
    }

    try {
      const userRef = databaseRef(database, `users/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        commit('SET_USERS', { uid, data: userData });
        console.log('auth.js: Данные пользователя загружены:', userData);
        return userData;
      } else {
        console.warn('auth.js: Пользователь не найден для uid:', uid);
        const defaultUserData = {
          uid,
          email: 'unknown',
          profile: { username: 'Гость', avatarUrl: '/image/empty_avatar.png', signature: '' },
          role: 'user'
        };
        commit('SET_USERS', { uid, data: defaultUserData });
        return defaultUserData;
      }
    } catch (error) {
      console.error('auth.js: Ошибка при загрузке данных пользователя:', error);
      const defaultUserData = {
        uid,
        email: 'unknown',
        profile: { username: 'Гость', avatarUrl: '/image/empty_avatar.png', signature: '' },
        role: 'user'
      };
      commit('SET_USERS', { uid, data: defaultUserData });
      return defaultUserData;
    }
  },

  clearUsersCache({ commit }) {
    console.log('auth.js: Очистка кэша пользователей');
    commit('CLEAR_USERS_CACHE');
  },

  // Новое действие для обновления username
  async updateUserUsername({ commit, state }, username) {
    console.log('auth.js: Вызов действия updateUserUsername с username:', username);
    try {
      if (!state.user) throw new Error('Пользователь не авторизован');
      const userId = state.user.uid;
      const userRef = databaseRef(database, `users/${userId}/profile/username`);
      await set(userRef, username);
      commit('UPDATE_USERNAME', username);
      console.log('auth.js: Username обновлен:', username);
    } catch (error) {
      console.error('auth.js: Ошибка при обновлении username:', error);
      throw error;
    }
  },

  // Новое действие для обновления avatarUrl
  async updateUserAvatar({ commit, state }, avatarUrl) {
    console.log('auth.js: Вызов действия updateUserAvatar с avatarUrl:', avatarUrl);
    try {
      if (!state.user) throw new Error('Пользователь не авторизован');
      const userId = state.user.uid;
      const userRef = databaseRef(database, `users/${userId}/profile/avatarUrl`);
      await set(userRef, avatarUrl);
      commit('UPDATE_AVATAR', avatarUrl);
      console.log('auth.js: Avatar обновлен:', avatarUrl);
    } catch (error) {
      console.error('auth.js: Ошибка при обновлении avatarUrl:', error);
      throw error;
    }
  }
};

const mutations = {
  SET_USER(state, user) {
    console.log('auth.js: Мутация SET_USER:', user);
    state.user = user;
  },
  SET_AUTHENTICATED(state, value) {
    console.log('auth.js: Мутация SET_AUTHENTICATED:', value);
    state.isAuthenticated = value;
  },
  SET_TOKEN(state, token) {
    console.log('auth.js: Мутация SET_TOKEN:', token);
    state.token = token;
  },
  SET_AUTH_UNSUBSCRIBE(state, unsubscribe) {
    console.log('auth.js: Мутация SET_AUTH_UNSUBSCRIBE');
    if (state.authUnsubscribe) state.authUnsubscribe();
    state.authUnsubscribe = unsubscribe;
  },
  SET_USERS(state, { uid, data }) {
    console.log('auth.js: Мутация SET_USERS для uid:', uid, 'данные:', data);
    state.users = { ...state.users, [uid]: data };
  },
  CLEAR_USERS_CACHE(state) {
    console.log('auth.js: Мутация CLEAR_USERS_CACHE');
    state.users = {};
  },
  UPDATE_USERNAME(state, username) {
    console.log('auth.js: Мутация UPDATE_USERNAME:', username);
    if (state.user && state.user.profile) {
      state.user.profile.username = username;
    }
  },
  UPDATE_AVATAR(state, avatarUrl) {
    console.log('auth.js: Мутация UPDATE_AVATAR:', avatarUrl);
    if (state.user && state.user.profile) {
      state.user.profile.avatarUrl = avatarUrl;
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};