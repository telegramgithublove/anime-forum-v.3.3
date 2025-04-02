// src/store/modules/security.js
import { auth } from '../../plugins/firebase'; // Импортируем auth из firebase.js
import { 
  sendPasswordResetEmail, 
  multiFactor, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator 
} from 'firebase/auth';

console.log('security.js: Модуль security инициализирован');

export default {
  namespaced: true,

  state: {
    errorMessage: '',
    successMessage: '',
    isMfaEnabled: false,
    mfaPhoneNumber: '',
    verificationId: ''
  },

  mutations: {
    setErrorMessage(state, message) {
      console.log('security.js: Мутация setErrorMessage:', message);
      state.errorMessage = message;
      state.successMessage = '';
    },
    setSuccessMessage(state, message) {
      console.log('security.js: Мутация setSuccessMessage:', message);
      state.successMessage = message;
      state.errorMessage = '';
    },
    setMfaStatus(state, { isEnabled, phoneNumber }) {
      console.log('security.js: Мутация setMfaStatus:', { isEnabled, phoneNumber });
      state.isMfaEnabled = isEnabled;
      state.mfaPhoneNumber = phoneNumber;
    },
    setVerificationId(state, verificationId) {
      console.log('security.js: Мутация setVerificationId:', verificationId);
      state.verificationId = verificationId;
    }
  },

  actions: {
    async resetPassword({ commit }, email) {
      console.log('security.js: Вызов действия resetPassword с email:', email);
      try {
        console.log('security.js: Отправка письма для сброса пароля...');
        await sendPasswordResetEmail(auth, email);
        console.log('security.js: Письмо для сброса пароля отправлено');
        commit('setSuccessMessage', 'Ссылка для сброса пароля отправлена на ваш email.');
      } catch (error) {
        console.error('security.js: Ошибка в resetPassword:', error);
        commit('setErrorMessage', error.message);
      }
    },

    async startMfaEnrollment({ commit }, phoneNumber) {
      console.log('security.js: Вызов действия startMfaEnrollment с номером:', phoneNumber);
      try {
        const user = auth.currentUser;
        console.log('security.js: Текущий пользователь:', user ? { uid: user.uid, email: user.email } : 'No user');
        if (!user) {
          console.warn('security.js: Нет авторизованного пользователя');
          commit('setErrorMessage', 'Вы должны войти в систему для настройки MFA.');
          return;
        }

        console.log('security.js: Получение сессии multiFactor...');
        const multiFactorSession = await multiFactor(user).getSession();
        console.log('security.js: Сессия multiFactor получена:', multiFactorSession);

        console.log('security.js: Инициализация PhoneAuthProvider...');
        const phoneAuthProvider = new PhoneAuthProvider(auth);

        console.log('security.js: Проверка инициализации recaptchaVerifier...');
        if (!window.recaptchaVerifier) {
          console.error('security.js: recaptchaVerifier не инициализирован');
          commit('setErrorMessage', 'Ошибка: reCAPTCHA не инициализирована.');
          return;
        }

        console.log('security.js: recaptchaVerifier инициализирован:', window.recaptchaVerifier);

        console.log('security.js: Проверка номера телефона через reCAPTCHA...');
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
          { phoneNumber, session: multiFactorSession },
          window.recaptchaVerifier
        );
        console.log('security.js: Получен verificationId:', verificationId);

        commit('setVerificationId', verificationId);
        commit('setSuccessMessage', 'Код отправлен на ваш номер телефона.');
      } catch (error) {
        console.error('security.js: Ошибка в startMfaEnrollment:', error);
        commit('setErrorMessage', error.message);
      }
    },

    async verifyMfaCode({ commit, state }, verificationCode) {
      console.log('security.js: Вызов действия verifyMfaCode с кодом:', verificationCode);
      try {
        const user = auth.currentUser;
        console.log('security.js: Текущий пользователь:', user ? { uid: user.uid, email: user.email } : 'No user');
        console.log('security.js: Текущий verificationId:', state.verificationId);
        if (!user || !state.verificationId) {
          console.warn('security.js: Отсутствует пользователь или verificationId');
          commit('setErrorMessage', 'Ошибка: процесс верификации не начат.');
          return;
        }

        console.log('security.js: Создание учетных данных телефона...');
        const phoneCredential = PhoneMultiFactorGenerator.assertion(
          PhoneAuthProvider.credential(state.verificationId, verificationCode)
        );
        console.log('security.js: Учетные данные телефона созданы:', phoneCredential);

        console.log('security.js: Регистрация MFA...');
        await multiFactor(user).enroll(phoneCredential, 'Телефон');
        console.log('security.js: MFA успешно зарегистрирована');

        commit('setSuccessMessage', 'Двухфакторная аутентификация успешно включена.');
        commit('setMfaStatus', { isEnabled: true, phoneNumber: state.mfaPhoneNumber || phoneCredential.phoneNumber });
        commit('setVerificationId', '');
      } catch (error) {
        console.error('security.js: Ошибка в verifyMfaCode:', error);
        commit('setErrorMessage', error.message);
      }
    },

    async checkMfaStatus({ commit }) {
      console.log('security.js: Вызов действия checkMfaStatus');
      try {
        const user = auth.currentUser;
        console.log('security.js: Текущий пользователь:', user ? { uid: user.uid, email: user.email } : 'No user');
        if (user) {
          console.log('security.js: Проверка зарегистрированных факторов MFA...');
          const mfaInfo = multiFactor(user).enrolledFactors;
          console.log('security.js: Факторы MFA:', mfaInfo);
          if (mfaInfo.length > 0) {
            const phoneNumber = mfaInfo[0].phoneNumber || '';
            console.log('security.js: MFA включена для номера:', phoneNumber);
            commit('setMfaStatus', { isEnabled: true, phoneNumber });
          } else {
            console.log('security.js: Факторы MFA не найдены');
            commit('setMfaStatus', { isEnabled: false, phoneNumber: '' });
          }
        } else {
          console.warn('security.js: Нет авторизованного пользователя для проверки MFA');
          commit('setMfaStatus', { isEnabled: false, phoneNumber: '' });
        }
      } catch (error) {
        console.error('security.js: Ошибка в checkMfaStatus:', error);
        commit('setErrorMessage', error.message);
      }
    }
  }
};