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
  users: {},
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
  isSuperUser: state => state.user?.role === 'superuser' && state.user?.email === 'superuser@example.com',
  userRole: state => state.user?.role || null,
  isEmailVerified: state => state.user?.emailVerified || false,
  getUserSettings: state => state.user?.settings || {},
  getUserById: state => (uid) => state.users[uid] || { profile: { username: 'Гость', avatarUrl: '/image/empty_avatar.png', signature: '' } },
  userBalance: state => state.user?.balance || 0,
};

const actions = {
  async initAuth({ commit, state }) {
    console.log('auth.js: Инициализация аутентификации');

    // Восстановление суперпользователя из localStorage
    const superuserData = JSON.parse(localStorage.getItem('superuserData'));
    if (superuserData && superuserData.email === 'superuser@example.com') {
      commit('SET_USER', superuserData);
      commit('SET_AUTHENTICATED', true);
      commit('SET_TOKEN', 'superuser-token');
      console.log('auth.js: Суперпользователь восстановлен из localStorage:', superuserData);
    }

    return new Promise((resolve) => {
      if (state.authUnsubscribe) {
        console.log('auth.js: Подписка уже существует, возвращаем текущего пользователя');
        resolve(state.user);
        return;
      }

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const superuserRef = databaseRef(database, `superuser/${firebaseUser.uid}`);
            const superuserSnapshot = await get(superuserRef);
            let userData;

            if (superuserSnapshot.exists()) {
              userData = superuserSnapshot.val();
              console.log('auth.js: Авторизован суперпользователь:', userData);
            } else {
              const userRef = databaseRef(database, `users/${firebaseUser.uid}`);
              const userSnapshot = await get(userRef);
              userData = userSnapshot.exists() ? userSnapshot.val() : null;
              console.log('auth.js: Авторизован обычный пользователь:', userData);
            }

            if (userData) {
              const userToStore = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                profile: userData.profile || { username: 'Гость', avatarUrl: '/image/empty_avatar.png', signature: '' },
                role: userData.role || 'user',
                emailVerified: firebaseUser.emailVerified || userData.emailVerified || false,
                settings: userData.settings || {},
                balance: userData.balance || 0,
              };
              commit('SET_USER', userToStore);
              commit('SET_AUTHENTICATED', true);
              commit('SET_TOKEN', await firebaseUser.getIdToken());
              localStorage.setItem('isAuthenticated', 'true');
              localStorage.setItem('userRole', userToStore.role);
              localStorage.setItem('userId', userToStore.uid);
              console.log('auth.js: Пользователь загружен в состояние:', userToStore);
            } else {
              console.log('auth.js: Данные пользователя не найдены в базе');
            }
            resolve(state.user);
          } catch (error) {
            console.error('auth.js: Ошибка при загрузке данных пользователя:', error);
            commit('SET_ERROR', error.message);
            resolve(null);
          }
        } else if (!state.user) { // Если нет Firebase-пользователя и суперпользователя
          commit('SET_USER', null);
          commit('SET_AUTHENTICATED', false);
          commit('SET_TOKEN', null);
          console.log('auth.js: Пользователь не авторизован');
          resolve(null);
        } else {
          resolve(state.user); // Суперпользователь уже восстановлен
        }
      }, (error) => {
        console.error('auth.js: Ошибка в onAuthStateChanged:', error);
        commit('SET_ERROR', error.message);
        resolve(null);
      });

      commit('SET_AUTH_UNSUBSCRIBE', unsubscribe);
    });
  },

  async login({ commit }, { email, password, router }) { 
    console.log('auth.js: Вызов действия login с email:', email);
    try {
      commit('SET_LOADING', true);

      // Жестко закодированный вход для суперпользователя
      if (email === 'superuser@example.com' && password === 'C7ceb1fd&') {
        const superuserUid = 'superuser-fixed-uid';
        const superuserData = {
          uid: superuserUid,
          email: 'superuser@example.com',
          profile: {
            username: 'superuser',
            avatarUrl: '/image/superuser_avatar.png',
            signature: 'Главный администратор'
          },
          role: 'superuser',
          emailVerified: true,
          settings: {
            profileVisibility: true,
            notifyMessages: true,
            notifyReplies: true,
            theme: 'light'
          },
          balance: 1000,
        };

        const superuserRef = databaseRef(database, `superuser/${superuserUid}`);
        const superuserSnapshot = await get(superuserRef);
        if (!superuserSnapshot.exists()) {
          await set(superuserRef, superuserData);
          console.log('auth.js: Данные суперпользователя записаны в базу:', superuserData);
        }

        commit('SET_USER', superuserData);
        commit('SET_AUTHENTICATED', true);
        commit('SET_TOKEN', 'superuser-token');
        localStorage.setItem('superuserData', JSON.stringify(superuserData));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', 'superuser');
        localStorage.setItem('userId', superuserUid);
        console.log('auth.js: Успешный вход суперпользователя:', superuserData);

        if (router) {
          router.push('/admin');
        }

        return { success: true, user: superuserData };
      }

      // Стандартный вход для других пользователей
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const firebaseUser = userCredential.user;

      const superuserRef = databaseRef(database, `superuser/${firebaseUser.uid}`);
      const superuserSnapshot = await get(superuserRef);
      let userData;

      if (superuserSnapshot.exists()) {
        userData = superuserSnapshot.val();
        console.log('auth.js: Вход суперпользователя:', userData);
      } else {
        const userRef = databaseRef(database, `users/${firebaseUser.uid}`);
        const userSnapshot = await get(userRef);
        userData = userSnapshot.exists() ? userSnapshot.val() : null;
        console.log('auth.js: Вход обычного пользователя:', userData);
      }

      if (userData) {
        const userToStore = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          profile: userData.profile || { username: 'Гость', avatarUrl: '/image/empty_avatar.png', signature: '' },
          role: userData.role || 'user',
          emailVerified: firebaseUser.emailVerified || userData.emailVerified || false,
          settings: userData.settings || {},
          balance: userData.balance || 0,
        };
        commit('SET_USER', userToStore);
        commit('SET_AUTHENTICATED', true);
        commit('SET_TOKEN', await firebaseUser.getIdToken());
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', userToStore.role);
        localStorage.setItem('userId', userToStore.uid);
        console.log('auth.js: Успешный вход, пользователь:', userToStore);

        if (userToStore.role === 'superuser' && userToStore.email === 'superuser@example.com' && router) {
          routerENDpush('/admin');
        }

        return { success: true, user: userToStore };
      } else {
        throw new Error('Данные пользователя не найдены в базе');
      }
    } catch (error) {
      console.error('auth.js: Ошибка при входе:', error);
      commit('SET_ERROR', error.message);
      throw new Error(error.message || 'Ошибка при входе');
    } finally {
      commit('SET_LOADING', false);
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
      localStorage.removeItem('superuserData');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      return true;
    } catch (error) {
      console.error('auth.js: Ошибка при выходе:', error);
      throw new Error(error.message || 'Ошибка при выходе');
    }
  },

  async registration({ commit }, userData) {
    console.log('auth.js: Вызов действия registration с данными:', userData);
    try {
      // Проверка обязательных полей
      if (!userData.username || !userData.email || !userData.password || !userData.passwordConfirmation) {
        throw new Error('Все поля обязательны для заполнения');
      }
      if (userData.password !== userData.passwordConfirmation) {
        throw new Error('Пароли не совпадают');
      }

      // Проверка уникальности username и email
      const usersRef = databaseRef(database, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        const usernameTaken = Object.values(users).some(user => user.profile?.username === userData.username);
        const emailTaken = Object.values(users).some(user => user.email === userData.email);
        if (usernameTaken) throw new Error('Этот username уже занят');
        if (emailTaken) throw new Error('Этот email уже зарегистрирован');
      }

      // Регистрация в Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, userData.email, userData.password);
      const user = userCredential.user;
      console.log('auth.js: Пользователь зарегистрирован в Firebase:', { uid: user.uid, email: user.email });

      // Отправка письма для верификации email
      await sendEmailVerification(user, { url: window.location.origin + '/verify-email' });
      console.log('auth.js: Письмо для подтверждения email отправлено');

      // Создание профиля пользователя
      const userRef = databaseRef(database, `users/${user.uid}`);
      const userProfile = {
        username: userData.username,
        avatarUrl: '/image/empty_avatar.png',
        signature: 'Новичок'
      };

      const userDataForDB = {
        uid: user.uid,
        email: userData.email,
        role: 'user', // Начальная роль
        profile: userProfile,
        settings: {
          profileVisibility: true,
          notifyMessages: true,
          notifyReplies: true,
          theme: 'light'
        },
        emailVerified: false,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        status: 'active',
        balance: 0
      };

      // Сохранение данных в Realtime Database
      await set(userRef, userDataForDB);
      console.log('auth.js: Данные пользователя записаны в базу:', userDataForDB);

      // Подготовка данных для состояния Vuex
      const userToStore = {
        uid: user.uid,
        email: userData.email,
        profile: userProfile,
        role: userDataForDB.role,
        emailVerified: userDataForDB.emailVerified,
        settings: userDataForDB.settings,
        balance: userDataForDB.balance
      };

      // Обновление состояния Vuex
      commit('SET_USER', userToStore);
      commit('SET_AUTHENTICATED', true);
      commit('SET_TOKEN', await user.getIdToken());
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', userToStore.role);
      localStorage.setItem('userId', userToStore.uid);
      console.log('auth.js: Состояние пользователя обновлено в store:', userToStore);

      // Возвращаем результат
      return { success: true, user: userToStore };
    } catch (error) {
      console.error('auth.js: Ошибка при регистрации:', error);
      commit('SET_ERROR', error.message);
      throw error; // Пробрасываем ошибку для обработки в компоненте
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async setUser({ commit }, userData) { /* ... */ },
  async fetchUserData({ commit, state }, uid) { /* ... */ },
  clearUsersCache({ commit }) { /* ... */ },
  async updateUserUsername({ commit, state }, username) { /* ... */ },
  async updateUserAvatar({ commit, state }, avatarUrl) { /* ... */ },
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
    if (state.user && state.user.profile) state.user.profile.username = username;
  },
  UPDATE_AVATAR(state, avatarUrl) {
    console.log('auth.js: Мутация UPDATE_AVATAR:', avatarUrl);
    if (state.user && state.user.profile) state.user.profile.avatarUrl = avatarUrl;
  },
  SET_LOADING(state, value) {
    console.log('auth.js: Мутация SET_LOADING:', value);
    state.loading = value;
  },
  SET_ERROR(state, error) {
    console.log('auth.js: Мутация SET_ERROR:', error);
    state.error = error;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};