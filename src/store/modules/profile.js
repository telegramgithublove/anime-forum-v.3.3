import axios from 'axios';
import { ref as databaseRef, set } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  profile: {
    userId: null,
    username: '',
    avatarUrl: '',
    signature: '',
    role: 'New User',
    settings: {
      profileVisibility: true,
      notifyMessages: true,
      notifyReplies: true,
    },
    messages: [''],
    notices: [''],
    mytopics: [''],
    favorites: [''],
    subscriptions: [''],
    exit: { lastLogout: null },
  },
  profilesCache: {},
};

const mutations = {
  SET_PROFILE(state, profile) {
    state.profile = { ...profile, userId: profile.userId || state.profile.userId };
  },
  UPDATE_PROFILE(state, profileData) {
    state.profile = { ...state.profile, ...profileData };
  },
  UPDATE_USERNAME(state, username) {
    state.profile.username = username;
  },
  UPDATE_AVATAR(state, avatarUrl) {
    state.profile.avatarUrl = avatarUrl;
  },
  UPDATE_SIGNATURE(state, signature) {
    state.profile.signature = signature;
  },
  UPDATE_ROLE(state, role) {
    state.profile.role = role;
  },
  SET_PROFILE_CACHE(state, { userId, profile }) {
    console.log(`Кэширование профиля для userId: ${userId}`, profile);
    state.profilesCache[userId] = { ...profile, userId };
  },
};

const actions = {
  async fetchProfile({ commit, dispatch, rootGetters }, userId) {
    try {
      const response = await axios.get(
        `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${userId}/profile.json`
      );
      
      if (response.data) {
        if (response.data.avatarUrl) {
          response.data.avatarUrl = response.data.avatarUrl.replace(
            'http://localhost:3000',
            'http://95.164.90.115:3000'
          );
        }
        const profileData = { ...response.data, userId };
        const currentUserId = rootGetters['auth/getUserId'];

        // Обновляем auth только если это профиль текущего пользователя
        if (userId === currentUserId) {
          commit('SET_PROFILE', profileData);
          if (profileData.username && profileData.username !== rootGetters['auth/getUsername']) {
            await dispatch('auth/updateUserUsername', profileData.username, { root: true });
          }
          if (profileData.avatarUrl && profileData.avatarUrl !== rootGetters['auth/getUserAvatar']) {
            await dispatch('auth/updateUserAvatar', profileData.avatarUrl, { root: true });
          }
        }
        // Всегда кэшируем профиль, независимо от того, текущий это пользователь или нет
        commit('SET_PROFILE_CACHE', { userId, profile: profileData });
        return profileData;
      }
    } catch (error) {
      console.error('Ошибка при получении профиля:', error);
      throw error;
    }
  },

  async updateUsername({ dispatch }, { userId, username }) {
    try {
      if (!username.trim()) {
        throw new Error('Имя пользователя не может быть пустым');
      }
      await dispatch('auth/updateUserUsername', username, { root: true });
      return { success: true };
    } catch (error) {
      console.error('Ошибка при обновлении имени пользователя:', error);
      throw error;
    }
  },

  async compressImage({ commit }, file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            },
            'image/jpeg',
            quality
          );
        };
      };
    });
  },

  async updateAvatar({ commit, dispatch }, { userId, avatarFile }) {
    try {
      console.log('Начинаем обработку аватара для пользователя:', userId);
      
      const compressedFile = await dispatch('compressImage', avatarFile);
      
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('isAvatar', 'true');
      
      console.log('Отправляем сжатое изображение на сервер...');
      const uploadResponse = await axios.post('http://95.164.90.115:3000/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
      });

      console.log('Получен ответ от сервера:', uploadResponse.data);

      if (uploadResponse.data && uploadResponse.data.fileUrl) {
        console.log('Получен URL изображения:', uploadResponse.data.fileUrl);
        
        await dispatch('auth/updateUserAvatar', uploadResponse.data.fileUrl, { root: true });
        localStorage.setItem('userAvatarUrl', uploadResponse.data.fileUrl);
        commit('UPDATE_AVATAR', uploadResponse.data.fileUrl);
        commit('SET_PROFILE_CACHE', { userId, profile: { ...state.profile, avatarUrl: uploadResponse.data.fileUrl, userId } });
        
        return {
          success: true,
          avatarUrl: uploadResponse.data.fileUrl
        };
      } else {
        throw new Error('Не удалось получить URL загруженного изображения');
      }
    } catch (error) {
      console.error('Ошибка при обновлении аватара:', error);
      throw error;
    }
  },

  async updateSignature({ commit }, { userId, signature }) {
    try {
      const signatureRef = databaseRef(database, `users/${userId}/profile/signature`);
      await set(signatureRef, signature);
  
      commit('UPDATE_SIGNATURE', signature);
      commit('SET_PROFILE_CACHE', { userId, profile: { ...state.profilesCache[userId], signature, userId } });
      console.log('Подпись успешно обновлена:', signature);
    } catch (error) {
      console.error('Ошибка при обновлении подписи:', error.message);
      throw new Error('Не удалось обновить подпись. Пожалуйста, попробуйте еще раз.');
    }
  },

  async updateProfile({ commit, dispatch }, { userId, profileData }) {
    try {
      const response = await axios.patch(
        `https://forum-e06cc-default-rtdb.firebaseio.com/users/${userId}/profile.json`,
        profileData
      );

      if (response.data) {
        commit('UPDATE_PROFILE', profileData);
        if (profileData.username) {
          await dispatch('auth/updateUserUsername', profileData.username, { root: true });
        }
        if (profileData.avatarUrl) {
          await dispatch('auth/updateUserAvatar', profileData.avatarUrl, { root: true });
        }
        commit('SET_PROFILE_CACHE', { userId, profile: { ...state.profile, ...profileData, userId } });
        return response.data;
      } else {
        throw new Error('Ошибка при обновлении профиля');
      }
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      throw error;
    }
  },

  async updateRole({ commit }, { userId, role }) {
    try {
      const userRef = databaseRef(database, `users/${userId}/profile`);
      const updatedProfile = { ...state.profile, role, userId };
      await set(userRef, updatedProfile);
      commit('UPDATE_ROLE', role);
      commit('SET_PROFILE_CACHE', { userId, profile: updatedProfile });
      console.log('progress.js: Роль обновлена на:', role);
    } catch (error) {
      console.error('Ошибка при обновлении роли:', error);
      throw error;
    }
  },
};

const getters = {
  getProfile: state => state.profile,
  userAvatar: state => state.profile.avatarUrl || '/image/empty_avatar.png',
  username: state => state.profile.username || '',
  signature: state => state.profile.signature || '',
  getAvatarUrl: state => state.profile.avatarUrl || '/image/empty_avatar.png',
  getSignature: state => state.profile.signature,
  getRole: state => state.profile.role || 'New User',
  getProfileByUserId: state => userId => state.profilesCache[userId] || {
    username: 'Гость',
    avatarUrl: '/image/empty_avatar.png',
    role: 'New User',
    userId
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};