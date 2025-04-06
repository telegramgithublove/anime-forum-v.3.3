<template>
  <div class="post-list-container min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Навигация по вкладкам -->
      <div class="flex justify-between items-center mb-8">
        <div class="flex space-x-4">
          <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Обсуждения
            </span>
          </h1>
          <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-800">
              Уникальная категория
            </span>
          </h1>
        </div>
        <button 
          @click="createNewPost" 
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full 
                 shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 
                 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-105 transition-all duration-200"
          :disabled="!canCreatePost"
        >
          <i class="fas fa-plus mr-2"></i>
          Создать пост
        </button>
      </div>

      <!-- Список постов -->
      <div class="space-y-6">
        <article v-for="post in filteredPosts" :key="post.id" 
                 class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 
                        transition-all duration-300 overflow-hidden">
          <div class="p-6">
            <!-- Заголовок и мета-информация -->
            <div class="flex items-center space-x-4 mb-4">
              <img :src="post.authorAvatar || '/image/empty_avatar.png'" 
                   :alt="post.authorName || 'Автор'"
                   class="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30" />
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white hover:text-purple-600 
                           dark:hover:text-purple-400 transition-colors duration-200">
                  <router-link :to="{ name: 'PostDetails', params: { id: post.id, categoryId: post.categoryId } }">
                    {{ post.title }}
                  </router-link>
                </h2>
                <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span class="font-medium">{{ post.authorName || 'Гость' }}</span>
                  <span>•</span>
                  <time>{{ formatDate(post.createdAt) }}</time>
                </div>
              </div>
            </div>

            <!-- Превью контента -->
            <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3" v-html="post.content"></p>

            <!-- Теги -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span v-for="tag in post.tags" 
                    :key="tag"
                    class="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 
                           text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/50 
                           transition-colors duration-200 cursor-pointer">
                #{{ tag }}
              </span>
            </div>

            <!-- Действия с постом -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center space-x-6">
                <!-- Лайки -->
                <button @click="toggleLike(post)" 
                        class="group flex items-center space-x-2"
                        :class="{ 'text-red-500': post.isLiked, 'text-gray-500 dark:text-gray-400': !post.isLiked }">
                  <i class="fas fa-heart text-lg group-hover:scale-110 transition-transform"></i>
                  <span class="font-medium">{{ post.likesCount || 0 }}</span>
                </button>

                <!-- Комментарии -->
                <router-link :to="{ name: 'PostDetails', params: { id: post.id, categoryId: post.categoryId }}" 
                           class="group flex items-center space-x-2 text-gray-500 dark:text-gray-400 
                                  hover:text-purple-600 dark:hover:text-purple-400">
                  <i class="fas fa-comment text-lg group-hover:scale-110 transition-transform"></i>
                  <span class="font-medium">{{ post.commentsCount || 0 }}</span>
                </router-link>

                <!-- Поделиться -->
                <button @click="sharePost(post)" 
                        class="group flex items-center space-x-2 text-gray-500 dark:text-gray-400 
                               hover:text-purple-600 dark:hover:text-purple-400">
                  <i class="fas fa-share text-lg group-hover:scale-110 transition-transform"></i>
                </button>
              </div>

              <!-- Дополнительные действия -->
              <div class="flex items-center space-x-2">
                <button v-if="canModifyPost(post)" 
                        @click="editPost(post)"
                        class="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 
                               dark:hover:text-purple-400 transition-colors">
                  <i class="fas fa-edit"></i>
                </button>
                <button v-if="canModifyPost(post)" 
                        @click="deletePost(post)"
                        class="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 
                               dark:hover:text-red-400 transition-colors">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </article>
        <div v-if="filteredPosts.length === 0" class="text-center text-gray-500 dark:text-gray-400">
          Постов пока нет
        </div>
      </div>

      <!-- Пагинация -->
      <div class="mt-8 flex justify-center">
        <nav class="flex items-center space-x-2">
          <button @click="prevPage" 
                  :disabled="currentPage === 1"
                  class="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 
                         hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 
                         transition-colors duration-200">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Страница {{ currentPage }} из {{ totalPages }}
          </span>
          <button @click="nextPage" 
                  :disabled="currentPage === totalPages"
                  class="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 
                         hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 
                         transition-colors duration-200">
            <i class="fas fa-chevron-right"></i>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const router = useRouter();
const store = useStore();

const currentPage = ref(1);
const postsPerPage = 10;

// Получаем посты из store
const allPosts = computed(() => {
  const postsObj = store.state.posts.posts || {};
  return Object.values(postsObj).sort((a, b) => b.createdAt - a.createdAt);
});

// Фильтруем посты в зависимости от роли пользователя
const filteredPosts = computed(() => {
  const userRole = store.state.profile.profile?.role || 'New User';
  const isAuthenticated = !!store.state.auth.user;
  const uniqueCategoryIds = ['unique1', 'unique2', 'unique3'];

  if (!isAuthenticated || userRole === 'New User') {
    return allPosts.value.filter(post => !uniqueCategoryIds.includes(post.categoryId));
  }
  return allPosts.value;
});

const totalPages = computed(() => Math.ceil(filteredPosts.value.length / postsPerPage));

const posts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage;
  const end = start + postsPerPage;
  return filteredPosts.value.slice(start, end);
});

// Форматирование даты
const formatDate = (date) => {
  const parsedDate = typeof date === 'string' ? new Date(date) : new Date(date || Date.now());
  return format(parsedDate, 'dd MMM yyyy HH:mm', { locale: ru });
};

// Проверка доступа к созданию постов
const canCreatePost = computed(() => {
  const userRole = store.state.profile.profile?.role || 'New User';
  const isAuthenticated = !!store.state.auth.user;
  return isAuthenticated && userRole !== 'New User';
});

// Обработчики действий
const toggleLike = async (post) => {
  try {
    await store.dispatch('posts/toggleLike', post.id);
  } catch (error) {
    console.error('Ошибка при обновлении лайка:', error);
  }
};

const sharePost = (post) => {
  const url = window.location.origin + router.resolve({
    name: 'PostDetails',
    params: { id: post.id, categoryId: post.categoryId }
  }).href;
  
  if (navigator.share) {
    navigator.share({
      title: post.title,
      text: post.content.substring(0, 100) + '...',
      url: url
    });
  } else {
    navigator.clipboard.writeText(url);
    // TODO: Добавить уведомление о копировании
  }
};

const createNewPost = () => {
  if (canCreatePost.value) {
    router.push({ name: 'create-post' });
  }
};

const canModifyPost = (post) => {
  const currentUser = store.state.auth.user;
  return currentUser && (currentUser.uid === post.authorId || currentUser.isAdmin);
};

const editPost = (post) => {
  router.push({ name: 'edit-post', params: { id: post.id } });
};

const deletePost = async (post) => {
  if (!confirm('Вы уверены, что хотите удалить этот пост?')) return;
  
  try {
    await store.dispatch('posts/deletePost', post.id);
  } catch (error) {
    console.error('Ошибка при удалении поста:', error);
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const fetchPosts = async () => {
  try {
    await store.dispatch('posts/fetchPosts');
  } catch (error) {
    console.error('Ошибка при загрузке постов:', error);
  }
};

onMounted(() => {
  fetchPosts();
});
</script>