<template>
  <div class="reply-form bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-all duration-300">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="flex items-center space-x-4">
        <img
          :src="currentUserAvatar"
          :alt="currentUserName"
          class="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
          @error="handleAvatarError"
        >
        <div>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ currentUserName }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ currentUserRole }}</p>
        </div>
      </div>
      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Ваш ответ
        </label>
        <textarea
          id="content"
          v-model="content"
          rows="4"
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 p-3"
          placeholder="Напишите ваш ответ..."
          required
        ></textarea>
      </div>
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300"
        >
          Отмена
        </button>
        <button
          type="submit"
          :disabled="isLoading"
          class="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-300"
        >
          <span v-if="isLoading">Отправка...</span>
          <span v-else>Отправить</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
  postId: { type: String, required: true },
  commentId: { type: String, required: true },
});

const emit = defineEmits(['close', 'reply-added']);

const store = useStore();
const content = ref('');

const isLoading = computed(() => store.getters['reply/isLoading']);
const currentUser = computed(() => store.state.auth.user);
const currentUserName = computed(() => currentUser.value?.profile?.username || 'Гость');
const currentUserAvatar = computed(() => currentUser.value?.profile?.avatarUrl || '/image/empty_avatar.png');
const currentUserRole = computed(() => currentUser.value?.profile?.role || 'New User');

const handleSubmit = async () => {
  if (!content.value.trim()) return;
  if (!currentUser.value) {
    alert('Пожалуйста, войдите в систему, чтобы оставить ответ');
    return;
  }

  try {
    const newReply = {
      content: content.value.trim(),
      authorId: currentUser.value.uid,
      createdAt: new Date().toISOString(),
      likes: {},
      likesCount: 0,
    };

    const result = await store.dispatch('reply/addReply', {
      postId: props.postId,
      commentId: props.commentId,
      replyData: newReply,
    });

    if (result.success) {
      const replyWithId = { id: result.replyId, ...newReply };
      emit('reply-added', replyWithId);
      content.value = '';
      emit('close');
    }
  } catch (error) {
    console.error('ReplyForm.vue - Ошибка при отправке:', error);
    alert('Ошибка при отправке ответа');
  }
};

const handleAvatarError = (event) => {
  event.target.src = '/image/empty_avatar.png';
};
</script>

<style scoped>
.reply-form { max-width: 100%; margin: 0 auto; }
.reply-form img { transition: transform 0.3s ease; }
.reply-form img:hover { transform: scale(1.1); }
textarea { resize: vertical; min-height: 100px; padding: 12px; }
button:disabled { cursor: not-allowed; }
</style>