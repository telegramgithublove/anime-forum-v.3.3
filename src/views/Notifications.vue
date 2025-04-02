<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-4 sm:p-6 md:p-8">
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Заголовок -->
      <div class="flex items-center space-x-3">
        <i class="fas fa-bell text-3xl text-blue-500"></i>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Уведомления</h1>
      </div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
      </div>

      <!-- Список уведомлений -->
      <div v-else-if="notifications.length" class="space-y-4">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transform hover:shadow-2xl transition-all duration-300"
        >
          <div class="flex items-start">
            <!-- Иконка в зависимости от типа -->
            <div v-if="notification.type === 'success' || notification.type === 'comment'" class="flex-shrink-0">
              <span class="flex h-10 w-10 rounded-full bg-green-100 justify-center items-center">
                <span class="material-icons text-green-600">check_circle</span>
              </span>
            </div>
            <div v-else-if="notification.type === 'error'" class="flex-shrink-0">
              <span class="flex h-10 w-10 rounded-full bg-red-100 justify-center items-center">
                <span class="material-icons text-red-600">error</span>
              </span>
            </div>
            <div v-else-if="notification.type === 'warning'" class="flex-shrink-0">
              <span class="flex h-10 w-10 rounded-full bg-yellow-100 justify-center items-center">
                <span class="material-icons text-yellow-600">warning</span>
              </span>
            </div>
            <div v-else class="flex-shrink-0">
              <span class="flex h-10 w-10 rounded-full bg-blue-100 justify-center items-center">
                <span class="material-icons text-blue-600">info</span>
              </span>
            </div>

            <!-- Текст уведомления -->
            <div class="ml-3 w-0 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
              <p class="mt-1 text-sm text-gray-500">{{ notification.message }}</p>
              <p class="mt-1 text-xs text-gray-400">{{ formatDate(notification.timestamp) }}</p>

              <!-- Кнопки действий -->
              <div class="mt-3 flex space-x-4">
                <router-link
                  :to="`/post/${notification.postId}`"
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span class="material-icons mr-1 text-sm">forum</span>
                  Перейти к посту
                </router-link>
              </div>
            </div>

            <!-- Кнопка закрытия -->
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="removeNotification(notification.id)"
                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span class="sr-only">Удалить</span>
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Если уведомлений нет -->
      <p v-else class="text-gray-500 dark:text-gray-400 text-lg">У вас пока нет уведомлений.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';

const store = useStore();
const toast = useToast();
const isLoading = ref(true);

// Получаем уведомления из хранилища
const notifications = computed(() => store.getters['notifications/getNotifications']);

// Получаем текущего пользователя
const currentUser = computed(() => store.state.auth.user);

// Загружаем уведомления при монтировании
onMounted(async () => {
  try {
    isLoading.value = true;
    if (!currentUser.value) {
      toast.warning('Пожалуйста, войдите в систему для просмотра уведомлений');
      return;
    }

    // Загружаем посты пользователя, чтобы подписаться на их уведомления
    await store.dispatch('posts/fetchPostsByCategory', '-OJTCQi2RB-FivSg_Cap'); // Замените на нужную категорию или добавьте логику для всех категорий
    const userPosts = Object.values(store.state.posts.posts).filter(post => post.authorId === currentUser.value.uid);

    // Подписываемся на уведомления для всех постов пользователя
    userPosts.forEach(post => {
      store.dispatch('notifications/startListeningNotifications', post.id);
    });
  } catch (error) {
    console.error('Notification.vue - Ошибка при загрузке уведомлений:', error);
    toast.error('Ошибка при загрузке уведомлений');
  } finally {
    isLoading.value = false;
  }
});

// Отписываемся от уведомлений при размонтировании
onUnmounted(() => {
  const userPosts = Object.values(store.state.posts.posts).filter(post => post.authorId === currentUser.value?.uid);
  userPosts.forEach(post => {
    store.dispatch('notifications/stopListeningNotifications', post.id);
  });
});

// Удаление уведомления
const removeNotification = (id) => {
  store.commit('notifications/REMOVE_NOTIFICATION', id);
  toast.success('Уведомление удалено');
};

// Форматирование даты
const formatDate = (timestamp) => {
  return timestamp
    ? new Date(timestamp).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
};
</script>

<style scoped>
/* Стили оставляем как есть, они подходят для списка */
</style>