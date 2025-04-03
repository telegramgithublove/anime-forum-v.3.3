<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">{{ t('loadingComments') }}</p>
    </div>
    <div v-else-if="comments.length" class="space-y-6">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition duration-300"
      >
        <div class="flex items-start space-x-4">
          <img
            :src="getAuthor(comment.authorId).avatarUrl"
            :alt="getAuthor(comment.authorId).username"
            class="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
            @error="handleAvatarError"
          />
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ getAuthor(comment.authorId).username }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ getAuthor(comment.authorId).role }}
                </p>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(comment.createdAt) }}
              </span>
            </div>

            <p class="mt-2 text-gray-700 dark:text-gray-200">
              {{ comment.content || 'Контент отсутствует' }}
            </p>

            <div v-if="comment.image" class="mt-2">
              <img
                :src="comment.image"
                alt="Комментарий изображение"
                class="preview-image"
                @error="handleMediaError('image', comment.image)"
              />
            </div>
            <div v-if="comment.video" class="mt-2">
              <video
                :src="comment.video"
                class="preview-video"
                controls
                preload="metadata"
                @error="handleMediaError('video', comment.video)"
              ></video>
            </div>
            <div v-if="comment.audio" class="mt-2">
              <audio
                :src="comment.audio"
                class="preview-audio"
                controls
                preload="metadata"
                @error="handleMediaError('audio', comment.audio)"
              ></audio>
            </div>

            <div class="mt-2 flex justify-end space-x-4">
              <button
                @click="toggleCommentLike(comment.id)"
                class="focus:outline-none flex items-center space-x-1"
                :disabled="isLoadingLikes"
              >
                <i
                  :class="[
                    'fas fa-heart text-lg',
                    isLikedByUser(comment.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500',
                  ]"
                ></i>
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {{ comment.likesCount || 0 }}
                </span>
              </button>
              <button
                @click="toggleReplyForm(comment.id)"
                class="flex items-center space-x-1 text-gray-500 hover:text-purple-500 transition duration-300"
              >
                <i class="fas fa-reply"></i>
                <span class="text-sm">{{ t('reply') }}</span>
              </button>
            </div>

            <div v-if="activeReplyForm === comment.id" class="mt-4">
              <ReplyForm
                :post-id="props.postId"
                :comment-id="comment.id"
                @close="toggleReplyForm(null)"
                @reply-added="handleReplyAdded"
              />
            </div>

            <div
              v-if="replies[comment.id]?.length"
              class="mt-4 space-y-4 pl-6 border-l-2 border-purple-200 dark:border-purple-900"
            >
              <div
                v-for="reply in replies[comment.id]"
                :key="reply.id"
                class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm"
              >
                <div class="flex items-start space-x-3">
                  <img
                    :src="getAuthor(reply.authorId).avatarUrl"
                    :alt="getAuthor(reply.authorId).username"
                    class="w-8 h-8 rounded-full object-cover ring-2 ring-purple-400/30"
                    @error="handleAvatarError"
                  />
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                          {{ getAuthor(reply.authorId).username }}
                        </h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ getAuthor(reply.authorId).role }}
                        </p>
                      </div>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatDate(reply.createdAt) }}
                      </span>
                    </div>
                    <p class="mt-1 text-gray-700 dark:text-gray-200">
                      {{ reply.content || 'Контент ответа отсутствует' }}
                    </p>
                    <div class="mt-2 flex justify-end space-x-2">
                      <button
                        @click="toggleReplyLike(comment.id, reply.id)"
                        class="focus:outline-none flex items-center space-x-1"
                        :disabled="isLoadingLikes"
                      >
                        <i
                          :class="[
                            'fas fa-heart text-md',
                            isReplyLikedByUser(reply.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500',
                          ]"
                        ></i>
                        <span class="text-xs text-gray-600 dark:text-gray-300">
                          {{ reply.likesCount || 0 }}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <i class="far fa-comments text-5xl text-gray-300 dark:text-gray-600 mb-4 animate-bounce"></i>
      <p class="text-gray-500 dark:text-gray-400">{{ t('noComments') }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import ReplyForm from './ReplyForm.vue';

const props = defineProps({
  postId: { type: [String, Number], required: true },
  comments: { type: Array, default: () => [] }, // Пропс для получения комментариев текущей страницы
});

const { t } = useI18n();
const store = useStore();

const isLoading = computed(() => store.getters['comments/isLoading'] || store.getters['reply/isLoading']);
const replies = computed(() => store.getters['reply/getReplies'] || {});
const activeReplyForm = ref(null);
const isLoadingLikes = ref(false);

const currentUserId = computed(() => store.state.auth.user?.uid || null);

// Используем пропс comments вместо sortedComments из Vuex
// Убираем сортировку, так как пагинация уже управляется в PostDetails.vue
const displayedComments = computed(() => props.comments);

const getAuthor = (authorId) => {
  if (!authorId || authorId === 'unknown') {
    return {
      username: 'Гость',
      avatarUrl: '/image/empty_avatar.png',
      role: 'New User',
    };
  }
  const profileData = store.getters['profile/getProfileByUserId'](authorId);
  return {
    username: profileData?.username || `User_${authorId.slice(0, 6)}`,
    avatarUrl: profileData?.avatarUrl || '/image/empty_avatar.png',
    role: profileData?.role || 'New User',
  };
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
};

const isLikedByUser = (commentId) => {
  const comment = props.comments.find((c) => c.id === commentId);
  return comment?.likes?.[currentUserId.value] || false;
};

const isReplyLikedByUser = (replyId) => {
  for (const commentId in replies.value) {
    const reply = replies.value[commentId]?.find((r) => r.id === replyId);
    if (reply) return reply.likes?.[currentUserId.value] || false;
  }
  return false;
};

const toggleCommentLike = async (commentId) => {
  if (!currentUserId.value) {
    alert('Войдите, чтобы поставить лайк');
    return;
  }
  try {
    isLoadingLikes.value = true;
    const comment = props.comments.find((c) => c.id === commentId);
    const liked = !isLikedByUser(commentId);
    await store.dispatch('comments/toggleCommentLike', {
      postId: props.postId,
      commentId,
      userId: currentUserId.value,
      liked,
    });
    // Перезагружаем комментарии после изменения лайка
    await store.dispatch('comments/fetchComments', props.postId);
  } catch (error) {
    console.error('Ошибка лайка комментария:', error);
  } finally {
    isLoadingLikes.value = false;
  }
};

const toggleReplyLike = async (commentId, replyId) => {
  if (!currentUserId.value) {
    alert('Войдите, чтобы поставить лайк');
    return;
  }
  try {
    isLoadingLikes.value = true;
    await store.dispatch('reply/toggleReplyLike', {
      postId: props.postId,
      commentId,
      replyId,
      userId: currentUserId.value,
    });
  } catch (error) {
    console.error('Ошибка лайка ответа:', error);
  } finally {
    isLoadingLikes.value = false;
  }
};

const toggleReplyForm = (commentId) => {
  activeReplyForm.value = activeReplyForm.value === commentId ? null : commentId;
};

const handleReplyAdded = async (newReply) => {
  const commentId = activeReplyForm.value;
  const currentReplies = replies.value[commentId] || [];
  if (!currentReplies.some((reply) => reply.id === newReply.id)) {
    store.commit('reply/SET_REPLIES', { commentId, replies: [...currentReplies, newReply] });
  }
  activeReplyForm.value = null;
  // Перезагружаем комментарии, чтобы обновить общее количество
  await store.dispatch('comments/fetchComments', props.postId);
};

onMounted(async () => {
  if (!props.postId) return;

  // Загружаем профиль текущего пользователя
  if (currentUserId.value) {
    await store.dispatch('profile/fetchProfile', currentUserId.value);
  }

  // Загружаем профили авторов комментариев
  const uniqueAuthorIds = [...new Set(props.comments.map((c) => c.authorId).filter((id) => id && id !== 'unknown'))];
  await Promise.all(
    uniqueAuthorIds.map((authorId) =>
      store.dispatch('profile/fetchProfile', authorId).catch((error) =>
        console.error('Ошибка загрузки профиля:', error)
      )
    )
  );

  // Загружаем ответы для комментариев текущей страницы
  props.comments.forEach((comment) => {
    store.dispatch('reply/fetchReplies', { postId: props.postId, commentId: comment.id });
  });
});

watch(
  () => props.comments,
  async (newComments) => {
    if (newComments.length && props.postId) {
      const uniqueAuthorIds = [...new Set(newComments.map((c) => c.authorId).filter((id) => id && id !== 'unknown'))];
      await Promise.all(
        uniqueAuthorIds.map((authorId) =>
          store.dispatch('profile/fetchProfile', authorId).catch((error) =>
            console.error('Ошибка загрузки профиля:', error)
          )
        )
      );
      newComments.forEach((comment) => {
        store.dispatch('reply/fetchReplies', { postId: props.postId, commentId: comment.id });
      });
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  // Не очищаем все комментарии, так как они управляются в PostDetails.vue
});

const handleAvatarError = (event) => {
  event.target.src = '/image/empty_avatar.png';
};

const handleMediaError = (type, url) => {
  console.error(`Ошибка загрузки ${type}:`, url);
};
</script>

<style scoped>
.animate-bounce {
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}
.preview-image {
  max-width: 200px;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.preview-video {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.preview-audio {
  width: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>