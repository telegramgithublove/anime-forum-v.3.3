<template>
    <div v-if="isVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Подтверждение удаления</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-6">{{ message }}</p>
        <div class="flex justify-end space-x-4">
          <button
            @click="cancel"
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
          >
            Нет
          </button>
          <button
            @click="confirm"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300"
          >
            Да
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const props = defineProps({
    message: {
      type: String,
      default: 'Вы уверены?',
    },
  });
  
  const emit = defineEmits(['confirm', 'cancel']);
  const isVisible = ref(false);
  
  const show = () => {
    isVisible.value = true;
  };
  
  const hide = () => {
    isVisible.value = false;
  };
  
  const confirm = () => {
    emit('confirm');
    hide();
  };
  
  const cancel = () => {
    emit('cancel');
    hide();
  };
  
  defineExpose({ show });
  </script>
  
  <style scoped>
  .scale-100 {
    animation: scaleIn 0.2s ease-out;
  }
  
  @keyframes scaleIn {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  </style>