<template>
  <div>
    <header class="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 text-white shadow-xl p-4">
      <div class="flex justify-between items-center max-w-7xl mx-auto">
        <nav class="flex items-center space-x-4">
          <div class="ml-4">
            <router-link
              v-if="isSuperUser"
              to="/admin"
              class="bg-red-500/90 px-5 py-2 rounded-xl shadow-lg hover:bg-red-600 hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Админ-панель
            </router-link>
          </div>
        </nav>

        <div class="flex items-center space-x-6">
          <img src="/image/logo.png" alt="Logo" class="w-14 h-14 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200" />
          <h1 class="text-2xl font-bold tracking-wide whitespace-nowrap text-white/90 font-serif">Anime Lights Forum</h1>

          <div class="relative group">
            <input
              type="text"
              placeholder="Поиск..."
              class="w-64 bg-white/10 text-white rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-purple-400 focus:bg-white/20 transition-all duration-200 placeholder-white/50"
            />
            <span class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-white/70 cursor-pointer group-hover:text-white transition-colors duration-200">
              search
            </span>
          </div>
        </div>

        <div class="flex items-center space-x-6">
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
              class="flex items-center space-x-3 bg-white/10 text-white rounded-xl px-4 py-2.5 shadow-lg hover:bg-white/20 transition-all duration-200 group"
            >
              <img 
                :src="userAvatar" 
                :alt="username"
                class="w-9 h-9 rounded-xl shadow-md group-hover:scale-105 transition-all duration-200"
                @error="handleAvatarError"
              />
              <span class="truncate font-medium">{{ username }}</span>
              <span class="material-icons transform group-hover:rotate-180 transition-transform duration-200">arrow_drop_down</span>
            </button>

            <div 
              v-if="showProfileMenu" 
              ref="profileMenuRef"
              class="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl py-2 z-50"
            >
              <template v-if="isAuthenticated">
                <div v-if="!isEmailVerified" class="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
                  <div class="flex items-center">
                    <span class="material-icons text-yellow-600 mr-2">info</span>
                    <p class="text-sm text-yellow-700">
                      Для доступа ко всем функциям необходимо подтвердить email. 
                      <br>Пожалуйста, проверьте почту, включая папку "Спам".
                    </p>
                  </div>
                </div>
                <a @click="navigateToProfile" class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                  <span class="material-icons mr-3">account_circle</span> Мой профиль
                </a>
                <a @click="goToMainPage" class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                  <span class="material-icons mr-3">forum</span> Форум
                </a>
                <router-link 
                  to="/security" 
                  class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  :class="{ 'text-gray-400 cursor-not-allowed': !isEmailVerified }"
                  @click.prevent="isEmailVerified ? null : showVerificationMessage"
                >
                  <span class="material-icons mr-3">settings</span> 
                  Настройки
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </router-link>
                <router-link 
                  to="/notifications" 
                  class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  :class="{ 'text-gray-400 cursor-not-allowed': !isEmailVerified }"
                  @click.prevent="isEmailVerified ? null : showVerificationMessage"
                >
                  <span class="material-icons mr-3">notifications</span> 
                  Уведомления
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </router-link>
                <router-link 
                  to="/my-topics" 
                  class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  :class="{ 'text-gray-400 cursor-not-allowed': !isEmailVerified }"
                  @click.prevent="isEmailVerified ? null : showVerificationMessage"
                >
                  <span class="material-icons mr-3">topic</span> 
                  Мои темы
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </router-link>
                <router-link 
                  to="/favorites" 
                  class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  :class="{ 'text-gray-400 cursor-not-allowed': !isEmailVerified }"
                  @click.prevent="isEmailVerified ? null : showVerificationMessage"
                >
                  <span class="material-icons mr-3">favorite</span>
                  Избранное
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </router-link>
                <router-link 
                  to="/subscriptions" 
                  class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  :class="{ 'text-gray-400 cursor-not-allowed': !isEmailVerified }"
                  @click.prevent="isEmailVerified ? null : showVerificationMessage"
                >
                  <span class="material-icons mr-3">subscriptions</span> 
                  Подписки
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </router-link>
                <div class="border-t border-gray-200 my-1"></div>
                <button
                  @click="handleLogout"
                  class="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-gray-100 transition-all duration-200 text-left"
                >
                  <span class="material-icons mr-3">logout</span> Выйти
                </button>
              </template>
              <template v-else>
                <button
                  @click="goToLogin"
                  class="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 text-left"
                >
                  <span class="material-icons mr-3">login</span> Войти
                </button>
                <button
                  @click="goToRegistration"
                  class="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 text-left"
                >
                  <span class="material-icons mr-3">person_add</span> Зарегистрироваться
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div class="bg-white/10 p-4 rounded-full">
        <svg class="animate-spin h-10 w-10 text-purple-500" viewBox="0 0 24 24">
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
/* Стили остаются без изменений */
</style>