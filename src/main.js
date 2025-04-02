// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './plugins/router';
import store from './store/store';
import './style.css';
import 'tailwindcss/tailwind.css';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import VuePlyr from 'vue-plyr';
import 'vue-plyr/dist/vue-plyr.css';
import Vue3AudioPlayer from 'vue3-audio-player';
import 'vue3-audio-player/dist/style.css';
import i18n from './i18n';
import { auth } from './plugins/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { get, ref as databaseRef } from 'firebase/database';
import { database } from './plugins/firebase';

const toastOptions = {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
};

console.log('main.js: Начало инициализации приложения...');

const app = createApp(App);

// Инициализация Web Worker
const myWorker = new Worker(new URL('./workers/worker.js', import.meta.url));
myWorker.onmessage = (e) => {
  console.log('main.js: Сообщение от воркера:', e.data);
};
// Ждем полной загрузки воркера перед отправкой сообщения
myWorker.addEventListener('message', () => {
  myWorker.postMessage('Hello, worker!');
}, { once: true });
console.log('main.js: Воркер инициализирован и отправлено сообщение');

app.use(i18n);
app.use(router);
app.use(store);
app.use(Toast, toastOptions);
app.use(VuePlyr, { plyr: {} });
app.component('vue3-audio-player', Vue3AudioPlayer);
console.log('main.js: Плагины подключены');

onAuthStateChanged(auth, async (user) => {
  console.log('main.js: Изменение состояния аутентификации, user:', user ? { uid: user.uid, email: user.email } : 'undefined');
  try {
    if (user) {
      console.log('main.js: Пользователь обнаружен, обновляем данные...');
      await user.reload(); // Обновляем данные пользователя
      const token = await user.getIdToken();
      const userRef = databaseRef(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userDataFromDB = snapshot.exists() ? snapshot.val() : {};

      const userData = {
        uid: user.uid,
        email: user.email,
        profile: {
          username: userDataFromDB.profile?.username || 'Гость',
          avatarUrl: userDataFromDB.profile?.avatarUrl || '/image/empty_avatar.png',
          signature: userDataFromDB.profile?.signature || ''
        },
        role: userDataFromDB.role || 'user',
        emailVerified: user.emailVerified,
        token: token,
        settings: userDataFromDB.settings || {}
      };

      console.log('main.js: Данные пользователя обновлены:', userData);
      await store.dispatch('auth/setUser', userData);
      localStorage.setItem(`user_${user.uid}`, JSON.stringify(userData));
      console.log('main.js: Состояние пользователя сохранено в store и localStorage');
      await store.dispatch('profile/fetchProfile', user.uid);
      console.log('main.js: Профиль пользователя загружен');
    } else {
      console.log('main.js: Пользователь не авторизован');
      await store.dispatch('auth/setUser', null);
      localStorage.removeItem('user');
    }
  } catch (error) {
    console.error('main.js: Ошибка при инициализации аутентификации:', error);
    await store.dispatch('auth/setUser', null); // Сбрасываем состояние при ошибке
  }

  if (!app._container) {
    console.log('main.js: Монтирование приложения...');
    app.mount('#app');
    console.log('main.js: Приложение смонтировано');
  } else {
    console.log('main.js: Приложение уже смонтировано');
  }
});

console.log('main.js: Инициализация приложения завершена (асинхронно)');