<template>
  <div class="min-h-screen bg-gradient-to-r from-purple-600 to-blue-500 p-6">
    <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <header class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <img src="/image/logo.png" alt="Logo" class="w-12 h-12 rounded-full">
          <h1 class="text-3xl font-bold text-purple-700 font-serif">Основные настройки профиля</h1>
        </div>
      </header>

      <!-- Основная информация -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-blue-600">Основная информация</h2>
        <div class="space-y-4">
          <!-- Имя пользователя -->
          <div class="relative">
            <label class="block text-gray-700 font-medium mb-2">Имя пользователя</label>
            <input
              v-model="username"
              @input="() => { if (username.trim()) updateUsernameDebounced(); else usernameError = 'Имя пользователя не может быть пустым.'; }"
              type="text"
              maxlength="17"
              class="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Введите имя пользователя"
            />
            <p class="absolute bottom-1 right-2 text-gray-500 text-sm">{{ 17 - username.length }} символов осталось</p>
            <p v-if="usernameError" class="absolute bottom-1 mb-4 right-2 text-red-500 text-sm">{{ usernameError }}</p>
          </div>

          <!-- Аватар -->
          <div>
            <label class="block text-gray-700 font-medium mb-2">Аватар</label>
            <div class="flex items-center space-x-6">
              <div class="relative">
                <img 
                  :src="avatarUrl" 
                  :alt="username"
                  @error="handleAvatarError"
                  class="w-24 h-24 rounded-full object-cover border-4 border-purple-200 shadow-lg hover:border-purple-300 transition-all duration-300"
                >
                <div class="absolute bottom-0 right-0 bg-purple-500 rounded-full p-1.5 border-2 border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
              </div>
              <label class="relative cursor-pointer">
                <input
                  type="file"
                  @change="handleAvatarChange"
                  class="hidden"
                  accept="image/*"
                >
                <div class="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg group">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                  </svg>
                  <span class="font-medium group-hover:text-white/90">Выберите файл</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Прогресс -->
          <div class="max-w-4xl mx-auto p-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Профиль пользователя</h1>
            <div class="mb-6">
              <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Ваш прогресс</h2>
              <ProgressBar />
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Создано тем: {{ createdPosts }} / {{ totalPosts }}
              </p>
            </div>
           <TestProgress /> --> 
          </div>

          <!-- Кнопки -->
          <div class="mt-6 flex justify-end space-x-4">
            <router-link
              to="/"
              class="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200"
            >
              На главную
            </router-link>
          </div>
        </div>
      </section>

      <!-- Модальное окно с поздравлением -->
      <div
        v-if="showCelebration"
        class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        @click="closeCelebration"
      >
        <div
          class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl transform transition-all duration-500"
          :class="{ 'scale-110': showCelebration }"
          @click.stop
        >
          <h2 class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
            Поздравляем!
          </h2>
          <p class="text-lg text-gray-900 dark:text-gray-100 mb-4">
            Вы достигли роли <span class="font-semibold text-purple-600">{{ newMilestone.name }}!</span>
          </p>
          <img
            :src="newMilestone.image"
            class="w-24 h-24 mx-auto rounded-full border-4 border-emerald-500 mb-4"
            alt="New Role"
          />
          <button
            class="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
            @click="closeCelebration"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import ProgressBar from '../../components/ProgressBar.vue';
import TestProgress from '../../components/TestProgress.vue';
import party from 'party-js';

const router = useRouter();
const store = useStore();
const toast = useToast();

// Debounce функция
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Реактивные данные из Vuex
const username = computed({
  get: () => store.getters['profile/username'],
  set: (value) => store.commit('profile/UPDATE_USERNAME', value),
});

const avatarUrl = computed(() => {
  const avatar = store.getters['profile/userAvatar'];
  return !avatar || avatar === '' ? '/image/empty_avatar.png' : avatar;
});

const createdPosts = computed(() => store.getters['progress/getCreatedPosts']);
const totalPosts = computed(() => store.state.progress.totalPosts);
const milestones = computed(() => store.getters['progress/getMilestones']);

// Локальное состояние
const usernameError = ref('');
const showCelebration = ref(false);
const newMilestone = ref(null);

// Обработчики
const handleAvatarError = (e) => {
  e.target.src = '/image/empty_avatar.png';
};

const updateUsernameDebounced = debounce(async function () {
  try {
    const userId = store.getters['auth/getUserId'];
    if (!userId) throw new Error('Пользователь не авторизован');

    await store.dispatch('profile/updateUsername', { userId, username: username.value });
    toast.success('Имя пользователя успешно обновлено');
    usernameError.value = '';
  } catch (error) {
    usernameError.value = error.message;
    toast.error(error.message);
  }
}, 5000);

const handleAvatarChange = async (event) => {
  try {
    const file = event.target.files[0];
    if (!file) return;

    const userId = store.getters['auth/getUserId'];
    if (!userId) throw new Error('Пользователь не авторизован');

    await store.dispatch('profile/updateAvatar', { userId, avatarFile: file });
    toast.success('Аватар успешно обновлен');
  } catch (error) {
    toast.error(error.message);
  }
};

// Закрытие поздравления и обновление последней роли
const closeCelebration = () => {
  showCelebration.value = false;
  localStorage.setItem('lastSeenRole', newMilestone.value.name);
  newMilestone.value = null;
};

// Проверка новой роли и отображение поздравления
const checkForNewMilestone = () => {
  const currentPosts = createdPosts.value;
  const currentMilestone = milestones.value.find(
    (m) => currentPosts >= m.posts && currentPosts < (milestones.value[milestones.value.indexOf(m) + 1]?.posts || Infinity)
  ) || milestones.value[0];

  const lastSeenRole = localStorage.getItem('lastSeenRole') || 'New User';
  if (currentMilestone.name !== lastSeenRole && currentMilestone.posts > 0) {
    newMilestone.value = currentMilestone;
    showCelebration.value = true;
    triggerConfetti();
  }
};

const triggerConfetti = () => {
  party.confetti(document.querySelector('.max-w-4xl'), {
    count: party.variation.range(50, 100),
    size: party.variation.range(0.8, 1.2),
    spread: 60,
    speed: 500,
  });
};

// При монтировании компонента
onMounted(async () => {
  try {
    const userId = store.getters['auth/getUserId'];
    if (userId) {
      await store.dispatch('profile/fetchProfile', userId);
      await store.dispatch('progress/initializeProgress');
      checkForNewMilestone();
    }
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error);
    toast.error('Не удалось загрузить профиль');
  }
});
</script>

<style scoped>
header {
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.bg-opacity-50 {
  backdrop-filter: blur(4px);
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>