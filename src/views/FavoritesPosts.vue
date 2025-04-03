<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-4 sm:p-6 md:p-8">
    <div class="max-w-4xl mx-auto space-y-8">
      <div class="flex items-center space-x-3">
        <i class="fas fa-star text-3xl text-yellow-500"></i>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Избранные посты</h1>
      </div>
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
      </div>
      <div v-else-if="pagedPosts.length" class="space-y-4">
        <div v-for="post in pagedPosts" :key="post.id" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transform hover:shadow-2xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-semibold text-gray-800 dark:text-white">{{ post.title || 'Без названия' }}</h2>
              <p class="text-gray-600 dark:text-gray-400 mt-2">{{ post.content ? post.content.slice(0, 100) + (post.content.length > 100 ? '...' : '') : 'Нет описания' }}</p>
            </div>
            <button @click="openConfirmation(post.id, post.categoryId)" class="text-red-500 hover:text-red-600 transition-all duration-300">
              <i class="fas fa-trash text-lg"></i>
            </button>
          </div>
          <router-link :to="`/post/${post.id}`" class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mt-2 inline-block">Читать далее</router-link>
        </div>
        <!-- Компонент пагинации с отступом снизу -->
        <div class="mt-8 flex justify-center pb-12">
          <Pagination 
            :total-items="totalItems" 
            :items-per-page="itemsPerPage" 
            @page-changed="handlePageChange"
          />
        </div>
      </div>
      <p v-else class="text-gray-500 dark:text-gray-400 text-lg">Нет избранных постов.</p>
    </div>
    <PopUp
      ref="popup"
      message="Вы точно хотите удалить этот пост из избранного?"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import PopUp from '../components/PopUp.vue';
import Pagination from '../components/Pagination.vue'; // Убедитесь, что путь к компоненту правильный

const store = useStore();
const toast = useToast();
const isLoading = ref(true);
const popup = ref(null);
let pendingPostId = null;
let pendingCategoryId = null;

// Получение всех избранных постов
const allPosts = computed(() => {
  const posts = store.getters['favorites/getFavoritePosts'] || [];
  console.log('FavoritesPosts.vue - Текущие избранные посты из computed:', posts);
  return posts;
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

onMounted(async () => {
  console.log('FavoritesPosts.vue - Компонент смонтирован');
  try {
    isLoading.value = true;
    await store.dispatch('favorites/fetchFavoritePosts');
    console.log('FavoritesPosts.vue - После fetchFavoritePosts, allPosts:', allPosts.value);
    store.dispatch('pagination/setTotalItems', allPosts.value.length);
    isLoading.value = false;
  } catch (error) {
    console.error('FavoritesPosts.vue - Ошибка при загрузке избранных постов:', error);
    toast.error('Ошибка при загрузке избранных постов');
    isLoading.value = false;
  }
});

// Обработчик смены страницы
const handlePageChange = (page) => {
  store.dispatch('pagination/setCurrentPage', page);
};

const openConfirmation = (postId, categoryId) => {
  pendingPostId = postId;
  pendingCategoryId = categoryId;
  console.log('FavoritesPosts.vue - Открытие поп-ап для postId:', postId, 'categoryId:', categoryId);
  popup.value.show();
};

const confirmDelete = async () => {
  const user = store.state.auth.user;
  if (!user) {
    console.log('FavoritesPosts.vue - Пользователь не авторизован для переключения избранного');
    toast.warning('Пожалуйста, войдите в систему, чтобы удалить из избранного');
    return;
  }

  if (!pendingPostId) {
    console.error('FavoritesPosts.vue - Нет postId для удаления');
    return;
  }

  console.log('FavoritesPosts.vue - Подтверждено удаление для postId:', pendingPostId, 'categoryId:', pendingCategoryId);
  try {
    await store.dispatch('favorites/toggleFavorite', { 
      postId: pendingPostId, 
      categoryId: pendingCategoryId || '-OJTCQi2RB-FivSg_Cap'
    });
    await store.dispatch('favorites/fetchFavoritePosts');
    store.dispatch('pagination/setTotalItems', allPosts.value.length); // Обновляем общее количество после удаления
    toast.success('Пост удален из избранного');
  } catch (error) {
    console.error('FavoritesPosts.vue - Ошибка при переключении избранного:', error);
    toast.error('Не удалось обновить избранное');
  } finally {
    pendingPostId = null;
    pendingCategoryId = null;
  }
};

const cancelDelete = () => {
  console.log('FavoritesPosts.vue - Удаление отменено пользователем');
  pendingPostId = null;
  pendingCategoryId = null;
};

// Отслеживаем изменения allPosts для диагностики
watch(allPosts, (newValue) => {
  console.log('FavoritesPosts.vue - allPosts изменился:', newValue);
});
</script>