<template>
  <aside 
    class="fixed top-0 left-0 h-full w-72 bg-gradient-to-br from-purple-800 via-purple-700 to-blue-600 shadow-2xl transition-all duration-300 ease-in-out transform z-50"
    :class="{ '-translate-x-full': isCollapsed }"
  >
    <!-- User Profile Section -->
    <div class="p-6 flex flex-col items-center border-b border-white/10 relative">
      <!-- Close Button -->
      <button 
        @click="toggleSidebar"
        class="absolute top-2 right-2 text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
      >
        <i class="fas fa-times text-xl"></i>
      </button>
      <div v-if="isAuthenticated" class="relative group cursor-pointer" @click="navigateToProfile">
        <img 
          :src="avatarSrc" 
          :alt="userName"
          class="w-20 h-20 rounded-full object-cover ring-4 ring-purple-400/30 group-hover:ring-purple-400/50 transition-all duration-300 shadow-xl"
          @error="handleAvatarError"
        />
        <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
      </div>
      <h3 class="mt-4 text-xl font-semibold text-white">{{ userName }}</h3>
      <p class="text-xs text-gray-300">{{ userRole }}</p>
    </div>

    <!-- Navigation -->
    <nav class="px-4 py-6 space-y-2">
      <a 
        v-for="(item, index) in menuItems" 
        :key="index"
        :href="item.link" 
        class="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
      >
        <i :class="['fas', item.icon, 'text-lg transition-all duration-200 group-hover:scale-110']"></i>
        <span class="font-medium tracking-wide">{{ item.text }}</span>
      </a>

      <!-- Новые поля -->
      <div class="mt-4 space-y-2">
        <!-- Посты по популярности -->
        <router-link 
          to="/popular-posts" 
          class="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-gradient-to-r from-purple-500/20 to-blue-500/20 transition-all duration-300 group"
        >
          <i class="fas fa-chart-line text-lg transition-all duration-200 group-hover:scale-110 group-hover:text-purple-300"></i>
          <span class="font-medium tracking-wide">Посты по популярности</span>
        </router-link>

        <!-- Самые обсуждаемые посты -->
        <router-link 
          to="/most-discussed-posts" 
          class="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-gradient-to-r from-purple-500/20 to-blue-500/20 transition-all duration-300 group"
        >
          <i class="fas fa-comments text-lg transition-all duration-200 group-hover:scale-110 group-hover:text-purple-300"></i>
          <span class="font-medium tracking-wide">Самые обсуждаемые посты</span>
        </router-link>

        <!-- Самые понравившиеся посты -->
        <router-link 
          to="/most-liked-posts" 
          class="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-gradient-to-r from-purple-500/20 to-blue-500/20 transition-all duration-300 group"
        >
          <i class="fas fa-heart text-lg transition-all duration-200 group-hover:scale-110 group-hover:text-purple-300"></i>
          <span class="font-medium tracking-wide">Самые понравившиеся посты</span>
        </router-link>
      </div>
    </nav>

    <!-- Bottom Actions -->
    <div class="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
      <button
        v-if="isAuthenticated"
        @click="logout"
        class="w-full bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 group"
      >
        <i class="fas fa-sign-out-alt group-hover:-translate-x-0.5 transition-transform duration-200"></i>
        <span class="font-medium">Выйти</span>
      </button>
      <button
        v-else
        @click="goToRegistration"
        class="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 group"
      >
        <i class="fas fa-user-plus group-hover:scale-110 transition-transform duration-200"></i>
        <span class="font-medium">Регистрация</span>
      </button>
    </div>
  </aside>

  <!-- Toggle Button -->
  <button 
    v-if="isCollapsed" 
    @click="toggleSidebar" 
    class="absolute top-4 left-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl shadow-lg z-50 transition-all duration-200 hover:scale-105"
  >
    <i class="fas fa-bars text-xl"></i>
  </button>

  <!-- Modal & Loading -->
  <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
    <div class="bg-white/10 p-4 rounded-full">
      <svg class="animate-spin h-10 w-10 text-purple-500" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { auth } from '../plugins/firebase';

const router = useRouter();
const store = useStore();
const isCollapsed = ref(true);
const isLoading = ref(false);

// Получаем данные из profile store
const userProfile = computed(() => store.getters['profile/getProfile']);
const avatarSrc = ref('/image/empty_avatar.png');
const userName = computed(() => store.getters['profile/username'] || 'Гость');
const signature = computed(() => store.getters['profile/signature'] || '');
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const userRole = computed(() => store.getters['profile/getRole'] || 'New User');

// Обработчик ошибки загрузки аватара
const handleAvatarError = () => {
  avatarSrc.value = '/image/empty_avatar.png';
};

// Следим за изменением аватара
watch(
  () => store.getters['profile/userAvatar'],
  (newAvatar) => {
    avatarSrc.value = newAvatar || '/image/empty_avatar.png';
  },
  { immediate: true }
);



const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

async function logout() {
  try {
    isLoading.value = true;
    await store.dispatch('auth/logout');
    
    // Сбрасываем состояние профиля
    store.commit('profile/SET_PROFILE', {
      username: 'Гость',
      avatarUrl: '/image/empty_avatar.png',
      signature: '',
      role: 'New User',
      settings: {
        profileVisibility: true,
        notifyMessages: true,
        notifyReplies: true,
      },
      messages: [],
      notices: [],
      mytopics: [],
      favorites: [],
      subscriptions: [],
      exit: { lastLogout: Date.now() }
    });
    
    // Очищаем локальное хранилище
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('emailVerified');
    localStorage.removeItem('userAvatarUrl');
    localStorage.removeItem('userSettings');
    
    // Сбрасываем локальные значения
    avatarSrc.value = '/image/empty_avatar.png';
    
    // Закрываем сайдбар
    isCollapsed.value = true;
    
    // Перенаправляем на главную страницу
    await router.push('/');
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    isLoading.value = false;
  }
}

const goToRegistration = () => {
  router.push({ name: 'Registration' });
};

const navigateToProfile = () => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    router.push({ 
      name: 'Profile', 
      params: { id: userId }
    });
  }
};

const goToMainPage = () => {
  router.push({ path: '/' });
};

// Загружаем профиль при монтировании, если пользователь авторизован
onMounted(async () => {
  if (isAuthenticated.value) {
    const userId = store.state.auth.user?.uid || localStorage.getItem('userId');
    if (userId) {
      try {
        await store.dispatch('profile/fetchProfile', userId);
      } catch (error) {
        console.error('Ошибка при загрузке профиля:', error);
      }
    }
  }
});
</script>

<style scoped>
.backdrop-blur-sm {
  backdrop-filter: blur(8px);
}
</style>