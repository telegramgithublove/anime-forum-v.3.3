<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto pb-20">
      <!-- Заголовок -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent animate-gradient-text flex items-center">
          <i class="fas fa-comments mr-3 text-purple-600 dark:text-purple-400"></i>
          Самые обсуждаемые посты
        </h1>
        <router-link 
          to="/" 
          class="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-600 hover:text-purple-600 dark:hover:text-purple-200 transition-all duration-300 shadow-sm transform hover:scale-105"
          title="На главную"
        >
          <i class="fas fa-arrow-left text-lg"></i>
        </router-link>
      </div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
        <div class="relative w-32 h-32">
          <div class="absolute inset-0 border-4 border-t-purple-600 dark:border-t-purple-500 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
          <span class="absolute inset-0 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
            {{ loadingProgress }}%
          </span>
        </div>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400 animate-pulse">
          Загрузка самых обсуждаемых постов...
        </p>
      </div>

      <!-- Список постов с пагинацией -->
      <div v-else-if="pagedPosts.length > 0" class="space-y-6">
        <div v-for="post in pagedPosts" :key="post.id" class="group">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <router-link 
              :to="{ name: 'post-details', params: { id: post.id }}" 
              class="block p-8"
              @click="incrementPostViews(post.id)"
            >
              <div class="flex items-start space-x-6">
                <div class="flex-shrink-0 text-center">
                  <img 
                    :src="post.authorAvatar || '/image/empty_avatar.png'" 
                    :alt="`${post.authorName}'s avatar`" 
                    class="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-purple-200 dark:border-purple-700 group-hover:border-purple-400 dark:group-hover:border-purple-500 transition-colors duration-300 mx-auto"
                    @error="handleAvatarError"
                  >
                  <span class="block mt-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {{ post.authorName || 'Гость' }}
                  </span>
                </div>
                <div class="flex-1">
                  <div class="flex items-start justify-between">
                    <h2 class="text-xl sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-purple-400 hover:to-indigo-400 transform hover:-translate-y-0.5 transition-all duration-300 tracking-wide uppercase font-sans">
                      {{ post.title || 'Без заголовка' }}
                    </h2>
                    <span class="flex flex-col items-end text-sm text-gray-500 dark:text-gray-400">
                      <span>{{ formatDate(post.createdAt) }}</span>
                      <span>{{ new Date(post.createdAt).toLocaleTimeString() }}</span>
                    </span>
                  </div>
                  <p class="mt-4 text-gray-700 dark:text-gray-300 text-base leading-relaxed line-clamp-2">
                    {{ post.content ? post.content.substring(0, 100) + '...' : 'Контент отсутствует...' }}
                  </p>
                  <div class="mt-4 flex justify-between items-center text-gray-500 dark:text-gray-400">
                    <span class="flex items-center space-x-1">
                      <i class="fas fa-eye"></i>
                      <span>{{ post.views || 0 }} просмотров</span>
                    </span>
                    <span class="flex items-center space-x-1">
                      <i class="fas fa-heart"></i>
                      <span>{{ post.likesCount || 0 }}</span>
                    </span>
                    <span class="flex items-center space-x-1">
                      <i class="fas fa-comment"></i>
                      <span>{{ post.commentsCount || 0 }} комментариев</span>
                    </span>
                  </div>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Компонент пагинации -->
        <div class="mt-8 flex justify-center">
          <Pagination 
            :total-items="totalItems" 
            :items-per-page="itemsPerPage" 
            @page-changed="handlePageChange"
          />
        </div>
      </div>

      <!-- Если постов нет -->
      <div v-else class="text-center text-lg text-gray-600 dark:text-gray-400 py-12">
        Пока нет обсуждаемых постов
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { getDatabase, ref as dbRef, get, update } from 'firebase/database';
import Pagination from '../components/Pagination.vue'; // Убедитесь, что путь к компоненту правильный

const store = useStore();
const isLoading = ref(true);
const loadingProgress = ref(0);

// Получение всех постов
const allPosts = computed(() => {
  const posts = Object.values(store.state.posts.posts || {});
  return posts
    .map(post => ({
      ...post,
      commentsCount: post.comments ? Object.keys(post.comments).length : 0,
      likesCount: post.likes ? Object.keys(post.likes).length : 0,
      views: post.views || 0,
      title: post.title || 'Без заголовка',
      content: post.content || '',
      authorName: post.authorName || 'Гость',
      authorAvatar: post.authorAvatar || '/image/empty_avatar.png',
      createdAt: post.createdAt || Date.now()
    }))
    .filter(post => post.commentsCount !== undefined)
    .sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
});

// Пагинация
const itemsPerPage = computed(() => store.getters['pagination/getItemsPerPage']);
const currentPage = computed(() => store.getters['pagination/getCurrentPage']);
const totalItems = computed(() => allPosts.value.length);

const pagedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return allPosts.value.slice(start, end);
});

// Загрузка всех постов при монтировании
onMounted(async () => {
  try {
    loadingProgress.value = 20;
    const db = getDatabase();
    const postsRef = dbRef(db, 'posts');
    
    console.log('Загрузка постов из Firebase...');
    const snapshot = await get(postsRef);
    loadingProgress.value = 60;
    
    if (snapshot.exists()) {
      const postsData = snapshot.val();
      console.log('Данные из Firebase:', postsData);
      store.commit('posts/SET_POSTS', postsData);
      store.dispatch('pagination/setTotalItems', Object.keys(postsData).length);
      console.log('Состояние store после загрузки:', store.state.posts.posts);
    } else {
      console.warn('Посты в Firebase не найдены');
    }
    
    loadingProgress.value = 100;
  } catch (error) {
    console.error('Ошибка при загрузке обсуждаемых постов:', error);
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
  }
});

// Обработчик смены страницы
const handlePageChange = (page) => {
  store.dispatch('pagination/setCurrentPage', page);
};

// Увеличение просмотров при клике на пост
const incrementPostViews = async (postId) => {
  try {
    await store.dispatch('posts/incrementViews', postId);
    console.log(`Просмотры увеличены для поста ${postId}`);
  } catch (error) {
    console.error('Ошибка при увеличении просмотров:', error);
  }
};

// Обработка ошибки аватара
const handleAvatarError = (event) => {
  event.target.src = '/image/empty_avatar.png';
};

// Форматирование даты
const formatDate = (timestamp) => {
  if (!timestamp) return 'Неизвестно';
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};
</script>

<style scoped>
.animate-gradient-text {
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>