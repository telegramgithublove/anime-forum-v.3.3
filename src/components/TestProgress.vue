<template>
    <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Тестирование прогресса</h2>
      <div class="flex flex-col gap-4">
        <!-- Кнопки для установки постов на 1 меньше каждой роли -->
        <button
          @click="setPosts(0)"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
        >
          Установить 0 постов (New User)
        </button>
        <button
          @click="setPosts(199)"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
        >
          Установить 199 постов (до User)
        </button>
        <button
          @click="setPosts(499)"
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors duration-200"
        >
          Установить 499 постов (до Moderator)
        </button>
        <button
          @click="setPosts(999)"
          class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors duration-200"
        >
          Установить 999 постов (до Teacher)
        </button>
        <button
          @click="setPosts(17999)"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
        >
          Установить 17999 постов (до Administrator)
        </button>
  
        <!-- Кнопки для установки точного количества постов для ролей -->
        <button
          @click="setPosts(200)"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
        >
          Установить 200 постов (User)
        </button>
        <button
          @click="setPosts(500)"
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors duration-200"
        >
          Установить 500 постов (Moderator)
        </button>
        <button
          @click="setPosts(1000)"
          class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors duration-200"
        >
          Установить 1000 постов (Teacher)
        </button>
        <button
          @click="setPosts(18000)"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
        >
          Установить 18000 постов (Administrator)
        </button>
  
        <!-- Кнопка сброса -->
        <button
          @click="resetProgress"
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
        >
          Сбросить прогресс
        </button>
      </div>
      <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Текущие посты: {{ currentPosts }}
      </p>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  import { useStore } from 'vuex';
  import { useToast } from 'vue-toastification';
  
  const store = useStore();
  const toast = useToast();
  
  const currentPosts = computed(() => store.getters['progress/getCreatedPosts']);
  
  const setPosts = async (count) => {
    try {
      await store.dispatch('progress/setPosts', count);
      toast.success(`Установлено ${count} постов`);
    } catch (error) {
      toast.error('Ошибка при установке постов');
      console.error(error);
    }
  };
  
  const resetProgress = async () => {
    try {
      await store.dispatch('progress/resetProgress');
      toast.success('Прогресс сброшен');
    } catch (error) {
      toast.error('Ошибка при сбросе прогресса');
      console.error(error);
    }
  };
  </script>
  
  <style scoped>
  button {
    transition: transform 0.2s ease-in-out;
  }
  
  button:hover {
    transform: scale(1.05);
  }
  </style>