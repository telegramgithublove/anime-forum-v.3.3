<template>
  <div>
    <header class="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 text-white shadow-xl p-6">
      <div class="flex items-center justify-between max-w-7xl mx-auto gap-6">
        <!-- Навигация слева -->
        <nav class="flex items-center gap-4">
          <router-link
            v-if="isSuperUser"
            to="/admin"
            class="bg-red-500/90 px-6 py-2 rounded-xl shadow-md hover:bg-red-600 hover:shadow-lg transition-all duration-200 hover:scale-105 whitespace-nowrap"
          >
            Админ-панель
          </router-link>
          <router-link
            to="/earn"
            class="flex items-center gap-2 bg-green-500/90 px-6 py-2 rounded-xl shadow-md hover:bg-green-600 hover:shadow-lg transition-all duration-200 hover:scale-105 whitespace-nowrap"
          >
            <span class="material-icons text-2xl">monetization_on</span>
            <span>Заработать</span>
          </router-link>
          <router-link
            to="/donate"
            class="flex items-center gap-2 bg-yellow-500/90 px-6 py-2 rounded-xl shadow-md hover:bg-yellow-600 hover:shadow-lg transition-all duration-200 hover:scale-105 whitespace-nowrap"
          >
            <span class="material-icons text-2xl">coffee</span>
            <span>На кофе разработчикам</span>
          </router-link>
        </nav>

        <!-- Центральная часть с логотипом, названием и поиском -->
        <div class="flex items-center gap-6">
          <img src="/image/logo.png" alt="Logo" class="w-14 h-14 rounded-xl shadow-md transform hover:scale-105 transition-all duration-200" />
          <h1 class="text-2xl font-bold tracking-wide whitespace-nowrap text-white/90 font-serif">Anime Lights</h1>
          <div class="relative group">
            <input
              type="text"
              placeholder="Поиск..."
              class="w-56 bg-white/10 text-white rounded-xl px-4 py-2 pr-10 focus:ring-2 focus:ring-purple-400 focus:bg-white/20 transition-all duration-200 placeholder-white/50"
            />
            <span class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-white/70 cursor-pointer group-hover:text-white transition-colors duration-200 text-2xl">
              search
            </span>
          </div>
        </div>

        <!-- Правая часть с переключателем темы и профилем -->
        <div class="flex items-center gap-6">
          <span
            @click="toggleDarkMode"
            class="material-icons cursor-pointer text-3xl text-white/80 hover:text-yellow-300 transition-all duration-200 transform hover:scale-110"
          >
            {{ isDarkMode ? 'dark_mode' : 'light_mode' }}
          </span>
          <div class="relative">
            <button
              ref="profileButtonRef"
              @click="toggleProfileMenu"
              class="flex items-center gap-3 bg-white/10 text-white rounded-xl px-4 py-2 shadow-md hover:bg-white/20 transition-all duration-200 group"
            >
              <img 
                :src="userAvatar" 
                :alt="username"
                class="w-10 h-10 rounded-xl shadow-sm group-hover:scale-105 transition-all duration-200"
                @error="handleAvatarError"
              />
              <span class="truncate font-medium max-w-[120px]"> {{ username }}</span>
              <span class="material-icons text-2xl transform group-hover:rotate-180 transition-transform duration-200">arrow_drop_down</span>
            </button>

            <div 
              v-if="showProfileMenu" 
              ref="profileMenuRef"
              class="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl py-2 z-50"
            >
              <template v-if="isAuthenticated">
                <div v-if="!isEmailVerified" class="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
                  <div class="flex items-center">
                    <span class="material-icons text-yellow-600 mr-2 text-2xl">info</span>
                    <p class="text-sm text-yellow-700">
                      Подтвердите email для доступа ко всем функциям.
                    </p>
                  </div>
                </div>
                <a @click="navigateToProfile" class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                  <span class="material-icons mr-3 text-2xl">account_circle</span> Мой профиль
                </a>
                <a @click="goToMainPage" class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                  <span class="material-icons mr-3 text-2xl">forum</span> Форум
                </a>
                <router-link 
                  to="/security" 
                  class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  :class="{ 'text-gray-400 cursor-not-allowed': !isEmailVerified }"
                  @click.prevent="isEmailVerified ? null : showVerificationMessage"
                >
                  <span class="material-icons mr-3 text-2xl">settings</span> 
                  Настройки
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </router-link>
                <router-link 
                  to="/notifications" 
                  class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  :class="{ 'text-gray-400 cursor-not-allowed': !isEmailVerified }"
                  @click.prevent="isEmailVerified ? null : showVerificationMessage"
                >
                  <span class="material-icons mr-3 text-2xl">notifications</span> 
                  Уведомления
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </router-link>
                <router-link 
                  to="/my-topics" 
                  class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  :class="{ 'text-gray-400 cursor-not-allowed': !isEmailVerified }"
                  @click.prevent="isEmailVerified ? null : showVerificationMessage"
                >
                  <span class="material-icons mr-3 text-2xl">topic</span> 
                  Мои темы
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </router-link>
                <router-link 
                  to="/favorites" 
                  class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  :class="{ 'text-gray-400 cursor-not-allowed': !isEmailVerified }"
                  @click.prevent="isEmailVerified ? null : showVerificationMessage"
                >
                  <span class="material-icons mr-3 text-2xl">favorite</span>
                  Избранное
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </router-link>
                <router-link 
                  to="/subscriptions" 
                  class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  :class="{ 'text-gray-400 cursor-not-allowed': !isEmailVerified }"
                  @click.prevent="isEmailVerified ? null : showVerificationMessage"
                >
                  <span class="material-icons mr-3 text-2xl">subscriptions</span> 
                  Подписки
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </router-link>
                <div class="border-t border-gray-200 my-1"></div>
                <button
                  @click="handleLogout"
                  class="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-gray-100 transition-all duration-200 text-left"
                >
                  <span class="material-icons mr-3 text-2xl">logout</span> Выйти
                </button>
              </template>
              <template v-else>
                <button
                  @click="goToLogin"
                  class="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 text-left"
                >
                  <span class="material-icons mr-3 text-2xl">login</span> Войти
                </button>
                <button
                  @click="goToRegistration"
                  class="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 text-left"
                >
                  <span class="material-icons mr-3 text-2xl">person_add</span> Зарегистрироваться
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div class="bg-white/10 p-6 rounded-full">
        <svg class="animate-spin h-12 w-12 text-purple-500" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();
const isLoading = ref(false);
const showProfileMenu = ref(false);
const profileButtonRef = ref(null);
const profileMenuRef = ref(null);

const isSuperUser = computed(() => store.getters['auth/isSuperUser']);
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const isEmailVerified = computed(() => store.getters['auth/isEmailVerified']);
const userAvatar = computed(() => store.getters['auth/getUserAvatar']);
const username = computed(() => store.getters['auth/getUsername']);
const isDarkMode = ref(false);

const handleAvatarError = (e) => {
  e.target.src = '/image/empty_avatar.png';
};

const handleClickOutside = (event) => {
  if (profileMenuRef.value && profileButtonRef.value) {
    if (!profileMenuRef.value.contains(event.target) && 
        !profileButtonRef.value.contains(event.target)) {
      showProfileMenu.value = false;
    }
  }
};

onMounted(() => {
  if (!store.state.auth.authUnsubscribe) {
    store.dispatch('auth/initAuth').catch(error => {
      console.error('Error initializing auth:', error);
    });
  }
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const showVerificationMessage = () => {
  alert('Для доступа к этой функции необходимо подтвердить email адрес. Пожалуйста, проверьте вашу почту, включая папку спам.');
};

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
}

function goToRegistration() {
  showProfileMenu.value = false;
  router.push({ name: 'Registration' });
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
}

async function handleLogout() {
  try {
    isLoading.value = true;
    await store.dispatch('auth/logout');
    showProfileMenu.value = false;
    router.push('/');
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    isLoading.value = false;
  }
}

const navigateToProfile = () => {
  const userId = store.getters['auth/getUserId'];
  if (userId) {
    showProfileMenu.value = false;
    router.push({ 
      name: 'Profile', 
      params: { id: userId }
    });
  } else {
    console.error('User ID not found in store');
    router.push('/login');
  }
};

function goToMainPage() {
  showProfileMenu.value = false;
  router.push({ path: '/' });
}

function goToLogin() {
  showProfileMenu.value = false;
  router.push('/login');
}
</script>

<style scoped>
/* Общие стили для header */
header {
  padding: 1.5rem 2rem; /* Увеличенные отступы */
}

/* Контейнер для всего контента */
.max-w-7xl {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem; /* Увеличенный отступ между блоками */
}

/* Навигация слева */
nav {
  display: flex;
  align-items: center;
  gap: 1rem; /* Увеличенные отступы между кнопками */
}

/* Кнопки в навигации */
nav a {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* Увеличенный отступ между иконкой и текстом */
  padding: 0.5rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 1rem; /* Увеличенный шрифт */
  font-weight: 500;
  transition: all 0.2s ease-in-out;
}

nav a:hover {
  transform: scale(1.05);
}

/* Центральная часть */
.flex.items-center.gap-6 {
  display: flex;
  align-items: center;
  gap: 1.5rem; /* Увеличенные отступы */
}

/* Логотип */
img {
  width: 3.5rem; /* Увеличенный логотип */
  height: 3.5rem;
  border-radius: 0.75rem;
  transition: transform 0.2s ease-in-out;
}

/* Заголовок */
h1 {
  font-size: 1.5rem; /* Увеличенный шрифт */
  font-weight: 700;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* Поле поиска */
.relative {
  position: relative;
  width: 14rem; /* Увеличенная ширина */
}

input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 1rem; /* Увеличенные отступы */
  border-radius: 0.75rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem; /* Увеличенный шрифт */
  transition: all 0.2s ease-in-out;
}

input:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.2);
  ring: 2px solid rgba(147, 51, 234, 0.5);
}

.material-icons.absolute {
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem; /* Увеличенная иконка */
}

/* Правая часть */
.flex.items-center.gap-6 {
  display: flex;
  align-items: center;
  gap: 1.5rem; /* Увеличенные отступы */
}

/* Иконка переключения темы */
.material-icons.text-3xl {
  font-size: 1.875rem; /* Увеличенная иконка */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

/* Кнопка профиля */
button.flex.items-center {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* Увеличенный отступ */
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease-in-out;
}

button.flex.items-center:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

button img {
  width: 2.5rem; /* Увеличенный аватар */
  height: 2.5rem;
  border-radius: 0.75rem;
}

button span.truncate {
  max-width: 120px; /* Увеличенная ширина имени */
  font-size: 1rem; /* Увеличенный шрифт */
}

/* Выпадающее меню профиля */
.absolute.mt-3 {
  top: 100%;
  right: 0;
  width: 16rem; /* Увеличенная ширина */
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
}

/* Элементы выпадающего меню */
.absolute.mt-3 a, 
.absolute.mt-3 button {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* Увеличенный отступ */
  padding: 0.625rem 1rem;
  font-size: 1rem; /* Увеличенный шрифт */
  color: #374151;
  transition: background-color 0.2s ease-in-out;
}

.absolute.mt-3 a:hover, 
.absolute.mt-3 button:hover {
  background-color: #f3f4f6;
}

/* Разделитель в меню */
.border-t {
  border-top: 1px solid #e5e7eb;
  margin: 0.25rem 0;
}

/* Стили для загрузки */
.fixed.inset-0 {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.animate-spin {
  width: 3rem; /* Увеличенный спиннер */
  height: 3rem;
}
</style>