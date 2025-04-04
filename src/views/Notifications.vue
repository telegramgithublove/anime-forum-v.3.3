<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-4 sm:p-6 md:p-8">
    <div class="max-w-4xl mx-auto space-y-8 pb-14">
      <div class="flex items-center space-x-3">
        <i class="fas fa-bell text-3xl text-blue-500"></i>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Уведомления</h1>
      </div>

      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
      </div>

      <div v-else-if="pagedNotifications.length" class="space-y-4">
        <div
          v-for="notification in pagedNotifications"
          :key="notification.id"
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transform hover:shadow-2xl transition-all duration-300"
        >
          <div class="flex items-start">
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

            <div class="ml-3 w-0 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
              <p class="mt-1 text-sm text-gray-500">{{ notification.message }}</p>
              <p class="mt-1 text-xs text-gray-400">{{ formatDate(notification.timestamp) }}</p>
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

      <p v-else class="text-gray-500 dark:text-gray-400 text-lg">У вас пока нет уведомлений.</p>

      <Pagination
        :total-items="totalNotifications"
        :items-per-page="itemsPerPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import Pagination from '../components/Pagination.vue';

const store = useStore();
const toast = useToast();
const isLoading = ref(true);
const itemsPerPage = ref(10);

const currentPage = computed(() => {
  const page = store.getters['pagination/getCurrentPage'];
  console.log('Notifications.vue: Текущая страница:', page);
  return page;
});

const notifications = computed(() => {
  const notifs = store.getters['notifications/getNotifications'] || [];
  console.log('Notifications.vue: Все уведомления:', notifs);
  return notifs;
});

const totalNotifications = computed(() => {
  const total = store.getters['notifications/getTotalNotifications'] || 0;
  console.log('Notifications.vue: Общее количество уведомлений:', total);
  return total;
});

const pagedNotifications = computed(() => {
  const getter = store.getters['notifications/getPagedNotifications'];
  console.log('Notifications.vue: Проверка геттера getPagedNotifications:', getter);
  if (typeof getter !== 'function') {
    console.error('Notifications.vue: Геттер getPagedNotifications не является функцией или не существует');
    return [];
  }
  const paged = getter(currentPage.value, itemsPerPage.value);
  console.log('Notifications.vue: Страница уведомлений:', paged);
  return paged;
});

const currentUser = computed(() => {
  const user = store.state.auth.user;
  console.log('Notifications.vue: Текущий пользователь:', user);
  return user;
});

onMounted(async () => {
  console.log('Notifications.vue: Компонент монтируется');
  try {
    isLoading.value = true;
    if (!currentUser.value) {
      console.warn('Notifications.vue: Пользователь не авторизован');
      toast.warning('Пожалуйста, войдите в систему для просмотра уведомлений');
      return;
    }

    console.log('Notifications.vue: Загрузка уведомлений для userId:', currentUser.value.uid);
    await store.dispatch('notifications/fetchNotifications', currentUser.value.uid);
    console.log('Notifications.vue: Установка общего количества уведомлений:', totalNotifications.value);
    store.dispatch('pagination/setTotalItems', totalNotifications.value);
  } catch (error) {
    console.error('Notifications.vue: Ошибка при загрузке уведомлений:', error);
    toast.error('Ошибка при загрузке уведомлений');
  } finally {
    isLoading.value = false;
    console.log('Notifications.vue: Загрузка завершена');
  }
});

onUnmounted(() => {
  console.log('Notifications.vue: Компонент размонтируется');
  store.dispatch('notifications/stopListeningNotifications');
});

const removeNotification = (id) => {
  console.log('Notifications.vue: Удаление уведомления с ID:', id);
  store.commit('notifications/REMOVE_NOTIFICATION', id);
  store.dispatch('pagination/setTotalItems', totalNotifications.value);
  toast.success('Уведомление удалено');
};

const formatDate = (timestamp) => {
  const formatted = timestamp
    ? new Date(timestamp).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  console.log('Notifications.vue: Форматирование даты:', { timestamp, formatted });
  return formatted;
};
</script>

<style scoped>
/* Стили остаются без изменений */
</style>