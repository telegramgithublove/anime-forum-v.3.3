<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 hover:scale-105">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">
            Требуется авторизация
          </h3>
          <button @click="close" class="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors duration-300">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <p class="text-gray-700 dark:text-gray-300 mb-6">
          Чтобы создать тему, оставить комментарий или поставить лайк, пожалуйста, войдите в систему или зарегистрируйтесь.
        </p>
        <div class="flex justify-end space-x-4">
          <router-link 
            to="/login" 
            class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-full hover:from-purple-700 hover:to-indigo-600 transition-all duration-300 shadow-md transform hover:-translate-y-1"
            @click="close"
          >
            Войти
          </router-link>
          <router-link 
            to="/register" 
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 shadow-md transform hover:-translate-y-1"
            @click="close"
          >
            Регистрация
          </router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const isOpen = ref(false);
  
  const open = () => {
    isOpen.value = true;
  };
  
  const close = () => {
    isOpen.value = false;
  };
  
  defineExpose({ open, close });
  </script>
  
  <style scoped>
  /* Дополнительные стили не требуются, так как используются Tailwind классы */
  </style>