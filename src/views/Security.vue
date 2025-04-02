<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-4 sm:p-6 md:p-8">
    <div class="max-w-md mx-auto space-y-8">
      <div class="flex items-center space-x-3">
        <i class="fas fa-lock text-3xl text-yellow-500"></i>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Безопасность</h1>
      </div>

      <!-- Форма сброса пароля -->
      <form @submit.prevent="resetPassword" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required
            placeholder="Введите ваш email"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          />
        </div>
        <button 
          type="submit" 
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Отправить ссылку для сброса пароля
        </button>
      </form>

      <!-- Форма повторной аутентификации -->
      <form v-if="showReauthForm" @submit.prevent="reauthenticate" class="space-y-4">
        <div>
          <label for="reauth-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Введите пароль для подтверждения</label>
          <input 
            type="password" 
            id="reauth-password" 
            v-model="reauthPassword" 
            required 
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          />
        </div>
        <button 
          type="submit" 
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Подтвердить
        </button>
      </form>

      <!-- Форма настройки MFA -->
      <div v-if="!isMfaEnabled && !showVerificationCode && !showReauthForm" class="space-y-4">
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Номер телефона</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="phone" 
            required 
            placeholder="+79991234567" 
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          />
        </div>
        <div id="recaptcha-container"></div>
        <button 
          type="button" 
          disabled
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-400 cursor-not-allowed focus:outline-none"
        >
          Включить двухфакторную аутентификацию
        </button>
        <div class="flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400">
          <i class="fas fa-hourglass-half"></i>
          <span class="text-sm font-medium">Двухфакторная аутентификация пока недоступна. Мы работаем над этим и запустим её в ближайшее время!</span>
        </div>
      </div>

      <!-- Форма ввода кода подтверждения -->
      <form v-if="showVerificationCode" @submit.prevent="verifyMfaCode" class="space-y-4">
        <div>
          <label for="verificationCode" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Код из SMS</label>
          <input 
            type="text" 
            id="verificationCode" 
            v-model="verificationCode" 
            required 
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          />
        </div>
        <button 
          type="submit" 
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Подтвердить код
        </button>
      </form>

      <!-- Сообщение, если MFA уже включена -->
      <div v-if="isMfaEnabled" class="text-green-500 text-center">
        Двухфакторная аутентификация уже включена для номера: {{ mfaPhoneNumber }}
      </div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="text-center py-4">
        <div class="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mx-auto"></div>
      </div>

      <!-- Сообщения об ошибках и успехе -->
      <div v-if="errorMessage" class="text-red-500 text-center">{{ errorMessage }}</div>
      <div v-if="successMessage" class="text-green-500 text-center">{{ successMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { RecaptchaVerifier, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../plugins/firebase';

console.log('Security.vue: Script setup started');

const store = useStore();
const router = useRouter();
const email = ref('');
const phone = ref('');
const verificationCode = ref('');
const reauthPassword = ref('');
const isLoading = ref(false);
const showVerificationCode = ref(false);
const showReauthForm = ref(false);
const isRecaptchaReady = ref(false);

const errorMessage = computed(() => {
  console.log('Security.vue: Computed errorMessage:', store.state.security.errorMessage);
  return store.state.security.errorMessage;
});
const successMessage = computed(() => {
  console.log('Security.vue: Computed successMessage:', store.state.security.successMessage);
  return store.state.security.successMessage;
});
const isMfaEnabled = computed(() => {
  console.log('Security.vue: Computed isMfaEnabled:', store.state.security.isMfaEnabled);
  return store.state.security.isMfaEnabled;
});
const mfaPhoneNumber = computed(() => {
  console.log('Security.vue: Computed mfaPhoneNumber:', store.state.security.mfaPhoneNumber);
  return store.state.security.mfaPhoneNumber;
});
const isAuthenticated = computed(() => {
  const authenticated = store.getters['auth/isAuthenticated'];
  console.log('Security.vue: Computed isAuthenticated:', authenticated);
  return authenticated;
});

// Функция для загрузки скрипта reCAPTCHA
const loadRecaptchaScript = () => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script#recaptcha-script')) {
      console.log('Security.vue: reCAPTCHA script already loaded');
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.onload = () => {
      console.log('Security.vue: reCAPTCHA script loaded');
      resolve();
    };
    script.onerror = (error) => {
      console.error('Security.vue: Error loading reCAPTCHA script:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
};

// Функция для инициализации RecaptchaVerifier
const initializeRecaptcha = async () => {
  try {
    if (!auth || !auth.app) {
      throw new Error('Объект auth не инициализирован');
    }
    console.log('Security.vue: Initializing RecaptchaVerifier with auth:', auth);
    console.log('Security.vue: auth.app:', auth.app);

    await new Promise((resolve) => {
      const checkGrecaptcha = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.render) {
          console.log('Security.vue: grecaptcha ready');
          clearInterval(checkGrecaptcha);
          resolve();
        }
      }, 100);
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('Security.vue: Recaptcha resolved:', response);
      },
      'expired-callback': () => {
        console.warn('Security.vue: Recaptcha expired');
        store.commit('security/setErrorMessage', 'Срок действия reCAPTCHA истек. Попробуйте снова.');
        isRecaptchaReady.value = false;
      }
    });

    console.log('Security.vue: RecaptchaVerifier created:', window.recaptchaVerifier);
    await window.recaptchaVerifier.render();
    console.log('Security.vue: RecaptchaVerifier rendered successfully');
    isRecaptchaReady.value = true;
  } catch (error) {
    console.error('Security.vue: Error initializing RecaptchaVerifier:', error);
    store.commit('security/setErrorMessage', 'Ошибка инициализации reCAPTCHA: ' + error.message);
    isRecaptchaReady.value = false;
    throw error;
  }
};

onMounted(async () => {
  console.log('Security.vue: onMounted called');
  try {
    await store.dispatch('auth/initAuth');
    const user = auth.currentUser;
    console.log('Security.vue: Current user on mount:', user ? { uid: user.uid, email: user.email } : 'No user');

    if (!user || !isAuthenticated.value) {
      console.warn('Security.vue: No authenticated user, redirecting to login');
      store.commit('security/setErrorMessage', 'Вы должны войти в систему для настройки безопасности.');
      router.push('/login');
      return;
    }

    await loadRecaptchaScript();
    await initializeRecaptcha();

    console.log('Security.vue: Calling checkMfaStatus...');
    await store.dispatch('security/checkMfaStatus');
  } catch (error) {
    console.error('Security.vue: Error in onMounted:', error);
  }
});

const resetPassword = async () => {
  console.log('Security.vue: resetPassword called with email:', email.value);
  isLoading.value = true;
  try {
    await store.dispatch('security/resetPassword', email.value);
    console.log('Security.vue: resetPassword completed');
  } catch (error) {
    console.error('Security.vue: Error in resetPassword:', error);
  }
  isLoading.value = false;
};

// Функция повторной аутентификации
const reauthenticate = async () => {
  console.log('Security.vue: reauthenticate called');
  isLoading.value = true;
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Нет текущего пользователя');

    const credential = await signInWithEmailAndPassword(auth, user.email, reauthPassword.value);
    console.log('Security.vue: Reauthentication successful:', credential);
    store.commit('security/setSuccessMessage', 'Аутентификация подтверждена.');
    showReauthForm.value = false;
    await startMfaEnrollment(); // Повторяем попытку MFA после успешной аутентификации
  } catch (error) {
    console.error('Security.vue: Error in reauthenticate:', error);
    store.commit('security/setErrorMessage', 'Ошибка повторной аутентификации: ' + error.message);
  }
  isLoading.value = false;
};

const startMfaEnrollment = async () => {
  console.log('Security.vue: startMfaEnrollment called with phone:', phone.value);
  if (!auth.currentUser) {
    console.warn('Security.vue: startMfaEnrollment aborted: No authenticated user');
    store.commit('security/setErrorMessage', 'Вы должны войти в систему для настройки MFA.');
    router.push('/login');
    return;
  }
  if (!isRecaptchaReady.value) {
    console.warn('Security.vue: reCAPTCHA not ready');
    store.commit('security/setErrorMessage', 'reCAPTCHA не готова. Попробуйте снова.');
    return;
  }
  isLoading.value = true;
  try {
    await store.dispatch('security/startMfaEnrollment', phone.value);
    console.log('Security.vue: startMfaEnrollment completed, error:', store.state.security.errorMessage, 'success:', store.state.security.successMessage);
    if (!store.state.security.errorMessage) {
      showVerificationCode.value = true;
      console.log('Security.vue: Showing verification code input');
    } else if (store.state.security.errorMessage.includes('auth/requires-recent-login')) {
      console.warn('Security.vue: Requires recent login, showing reauth form');
      showReauthForm.value = true;
    }
  } catch (error) {
    console.error('Security.vue: Error in startMfaEnrollment:', error);
    if (error.code === 'auth/requires-recent-login') {
      console.warn('Security.vue: Requires recent login, showing reauth form');
      showReauthForm.value = true;
    }
  }
  isLoading.value = false;
};

const verifyMfaCode = async () => {
  console.log('Security.vue: verifyMfaCode called with code:', verificationCode.value);
  if (!auth.currentUser) {
    console.warn('Security.vue: verifyMfaCode aborted: No authenticated user');
    store.commit('security/setErrorMessage', 'Вы должны войти в систему для подтверждения кода.');
    router.push('/login');
    return;
  }
  isLoading.value = true;
  try {
    await store.dispatch('security/verifyMfaCode', verificationCode.value);
    console.log('Security.vue: verifyMfaCode completed, error:', store.state.security.errorMessage, 'success:', store.state.security.successMessage);
    if (!store.state.security.errorMessage) {
      showVerificationCode.value = false;
      console.log('Security.vue: Hiding verification code input');
    }
  } catch (error) {
    console.error('Security.vue: Error in verifyMfaCode:', error);
  }
  isLoading.value = false;
};
</script>