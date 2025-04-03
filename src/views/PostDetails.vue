<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-4 sm:p-6 md:p-8">
    <div class="max-w-4xl mx-auto space-y-8 pb-48">
      <!-- Кнопка назад -->
      <button @click="goBack" class="group flex items-center space-x-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-all duration-300">
        <i class="fas fa-arrow-left text-lg transform group-hover:-translate-x-1 transition-transform duration-300"></i>
        <span class="text-sm font-semibold uppercase tracking-wide">Назад</span>
      </button>

      <!-- Загрузка -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
      </div>

      <!-- Контейнер поста и комментариев -->
      <div v-else-if="post && postId" class="space-y-12">
        <!-- Карточка поста -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform hover:shadow-2xl transition-all duration-300">
          <!-- Шапка поста -->
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center space-x-6">
              <div class="flex-shrink-0 group">
                <img
                  :src="authorData.avatar || '/image/empty_avatar.png'"
                  :alt="authorData.name"
                  class="w-16 h-16 rounded-full ml-10 object-cover ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all duration-300"
                  @error="handleAvatarError"
                >
                <div class="mt-2 text-center">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ authorData.name }}</h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ authorData.role }}</p>
                </div>
              </div>
              <div class="flex-1">
                <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 leading-tight">
                  {{ post.title || 'Без названия' }}
                </h1>
                <div class="mt-3 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <span class="flex items-center">
                    <i class="fas fa-calendar-alt mr-2"></i>
                    {{ formatDate(post.createdAt) }}
                  </span>
                  <span class="flex items-center">
                    <i class="fas fa-clock mr-2"></i>
                    {{ formatTime(post.createdAt) }}
                  </span>
                </div>
                <div v-if="post.tags && post.tags.length" class="mt-4 flex flex-wrap gap-2">
                  <span v-for="tag in post.tags" :key="tag" class="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full text-xs font-medium">
                    #{{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Содержимое поста -->
          <div class="p-6">
            <div class="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-200 break-words" v-html="post.content || ''"></div>
            <div v-if="post.pictures && Object.keys(post.pictures).length" class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div v-for="(image, index) in Object.values(post.pictures)" :key="index" class="relative group">
                <img
                  :src="getImageUrl(image)"
                  class="preview-image transform group-hover:scale-105 transition-transform duration-300"
                  :alt="'Изображение ' + (index + 1)"
                  @error="handleImageError"
                >
              </div>
            </div>
            <div v-if="post.videos && post.videos.length" class="mt-6 space-y-4">
              <div v-for="(video, index) in post.videos" :key="index">
                <video :src="video" class="preview-video" controls preload="metadata"></video>
              </div>
            </div>
            <div v-if="post.audio && post.audio.length" class="mt-6 space-y-4">
              <div v-for="(audioFile, index) in post.audio" :key="index" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <audio :src="audioFile" class="preview-audio" controls preload="metadata"></audio>
              </div>
            </div>
            <div v-if="post.documents && post.documents.length" class="mt-6 space-y-3">
              <div v-for="(doc, index) in post.documents" :key="index" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300">
                <div class="flex items-center space-x-3">
                  <i class="fas fa-file-alt text-xl text-purple-500"></i>
                  <div>
                    <span class="text-gray-900 dark:text-white font-medium">{{ doc.name || `Документ ${index + 1}` }}</span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(doc.size) }}</p>
                  </div>
                </div>
                <button @click="downloadDocument(doc.url, doc.name)" class="flex items-center space-x-2 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-300">
                  <i class="fas fa-download"></i>
                  <span class="text-sm">Скачать</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Действия с постом -->
          <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-6">
                <button @click="handleLike" class="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-all duration-300" :class="{ 'text-red-500': isLikedByCurrentUser }">
                  <i class="fas fa-heart text-lg" :class="{ 'fas': isLikedByCurrentUser, 'far': !isLikedByCurrentUser }"></i>
                  <span class="text-sm font-medium">{{ likesCount }}</span>
                </button>
                <button @click="focusComment" class="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-all duration-300">
                  <i class="fas fa-comment text-lg"></i>
                  <span class="text-sm font-medium">{{ comments.length }}</span>
                </button>
              </div>
              <div class="relative group">
                <button @click="toggleFavorite" class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-all duration-300" :class="{ 'text-yellow-500': isFavorite }">
                  <i class="fas fa-star text-lg" :class="{ 'fas': isFavorite, 'far': !isFavorite }"></i>
                </button>
                <span class="absolute right-0 top-[-2rem] w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  {{ isFavorite ? 'Удалить из избранного' : 'Добавить в избранное' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Секция комментариев -->
        <div class="space-y-6">
          <div class="flex items-center space-x-3">
            <i class="fas fa-comments text-2xl text-purple-500"></i>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Комментарии</h2>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">({{ totalComments }})</span>
          </div>
          <Comments :post-id="postId" :current-page="currentPage" :items-per-page="itemsPerPage" />
          <Pagination :total-items="totalComments" :items-per-page="itemsPerPage" :current-page="currentPage" @page-changed="handlePageChange" />
        </div>

        <!-- Форма комментария -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transform hover:shadow-2xl transition-all duration-300">
          <div class="flex items-center space-x-3 mb-4">
            <i class="fas fa-pen-alt text-2xl text-purple-500"></i>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Оставить комментарий</h2>
          </div>
          <div class="flex items-start space-x-4">
            <img
              :src="currentUser.avatarUrl || '/image/empty_avatar.png'"
              :alt="currentUser.username || 'Гость'"
              @error="handleAvatarError"
              class="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
            >
            <div class="flex-1 space-y-3">
              <div class="text-base font-semibold text-gray-900 dark:text-white">{{ currentUser.username || 'Гость' }}</div>
              <textarea
                v-model="commentContent"
                :class="{ 'required-field': !commentContent.trim() }"
                placeholder="Напишите ваш комментарий..."
                class="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px] max-h-[200px] resize-none overflow-y-auto transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                @input="handleCommentInput"
                @keydown="handleKeyDown"
              ></textarea>
              <div v-if="imagePreview" class="mt-4">
                <img :src="imagePreview" alt="Предпросмотр изображения" class="preview-image" />
              </div>
              <div v-if="videoPreview" class="mt-4">
                <video :src="videoPreview" class="preview-video" controls></video>
              </div>
              <div v-if="audioPreview" class="mt-4">
                <audio :src="audioPreview" class="preview-audio" controls></audio>
              </div>
              <div class="flex items-center justify-between">
                <div
                  class="inline-flex items-center space-x-1.5 text-sm px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded-full"
                  :class="{ 'text-red-600': remainingChars <= 0, 'text-yellow-600': remainingChars <= 50 && remainingChars > 0, 'text-gray-600': remainingChars > 50 }"
                >
                  <span class="font-mono font-medium">{{ remainingChars }}</span>
                  <span class="font-medium">символов осталось</span>
                </div>
                <div class="flex items-center space-x-3">
                  <label class="relative cursor-pointer">
                    <input type="file" accept="image/*" @change="handleImageUpload" class="hidden">
                    <i class="fas fa-image text-lg text-purple-600 hover:text-purple-700 transition-all duration-300"></i>
                  </label>
                  <label class="relative cursor-pointer">
                    <input type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg" @change="handleAudioUpload" class="hidden">
                    <i class="fas fa-music text-lg text-purple-600 hover:text-purple-700 transition-all duration-300"></i>
                  </label>
                  <label class="relative cursor-pointer">
                    <input type="file" accept="video/mp4,video/quicktime" @change="handleVideoUpload" class="hidden">
                    <i class="fas fa-video text-lg text-purple-600 hover:text-purple-700 transition-all duration-300"></i>
                  </label>
                </div>
                <button
                  @click="submitComment"
                  class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transform hover:scale-105 transition-all duration-300"
                  :disabled="!commentContent.trim()"
                >
                  <i class="fas fa-paper-plane"></i>
                  <span class="text-sm font-medium">Отправить</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Если пост не найден -->
      <div v-else class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">Пост не найден или произошла ошибка</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import Comments from '../components/Comments.vue';
import Pagination from '../components/Pagination.vue';

const store = useStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const commentContent = ref('');
const imagePreview = ref(null);
const videoPreview = ref(null);
const audioPreview = ref(null);
const imageFile = ref(null);
const audioFile = ref(null);
const videoFile = ref(null);

const post = ref(null);
const isLoading = ref(true);

const postId = computed(() => {
  const id = route.params.id;
  console.log('PostDetails.vue - Вычисляем postId:', id);
  return id;
});

const comments = computed(() => store.getters['comments/getComments'] || []);
const currentPage = computed(() => store.getters['pagination/getCurrentPage']);
const itemsPerPage = ref(10);
const totalComments = computed(() => comments.value.length);

const MAX_CHARS = 333;
const remainingChars = computed(() => MAX_CHARS - (commentContent.value?.length || 0));

// Текущий пользователь
const currentUser = computed(() => {
  const authUser = store.state.auth.user || {};
  return {
    username: authUser.profile?.username || 'Гость',
    avatarUrl: authUser.profile?.avatarUrl || '/image/empty_avatar.png',
    signature: authUser.profile?.signature || 'Участник форума',
  };
});

// Исправленный authorData с дополнительной проверкой
const authorData = computed(() => {
  const authorId = post.value?.authorId;
  if (!authorId || !post.value) {
    console.warn('PostDetails.vue - authorId отсутствует или пост не загружен:', post.value);
    return {
      name: 'Гость',
      avatar: '/image/empty_avatar.png',
      role: 'New User',
    };
  }

  // Получаем профиль из кэша Vuex
  const authorProfile = store.getters['profile/getProfileByUserId'](authorId);
  console.log('PostDetails.vue - Данные профиля автора из кэша:', authorProfile);

  // Дополнительная проверка: если профиля нет в кэше или он некорректен
  if (!authorProfile || (!authorProfile.username && !authorProfile.profile?.username)) {
    console.warn('PostDetails.vue - Профиль не найден в кэше или некорректен для authorId:', authorId, authorProfile);
    // Используем данные из поста как запасной вариант
    if (post.value.authorName && post.value.authorAvatar) {
      return {
        name: post.value.authorName,
        avatar: post.value.authorAvatar,
        role: 'New User', // Роль по умолчанию, так как её нет в данных поста
      };
    }
    // Если данных нет и в посте, возвращаем значения по умолчанию
    return {
      name: 'Гость',
      avatar: '/image/empty_avatar.png',
      role: 'New User',
    };
  }

  // Возвращаем данные из профиля, если они корректны
  return {
    name: authorProfile?.profile?.username || authorProfile?.username || 'Гость',
    avatar: authorProfile?.profile?.avatarUrl || authorProfile?.avatarUrl || '/image/empty_avatar.png',
    role: authorProfile?.profile?.role || authorProfile?.role || 'New User',
  };
});

const likesCount = computed(() => post.value?.likesCount || 0);

const isLikedByCurrentUser = computed(() => {
  const user = store.state.auth.user;
  if (!post.value || !user) return false;
  return false; // Временная заглушка, замените на реальную логику
});

const isFavorite = computed(() => {
  const user = store.state.auth.user;
  
  if (!user) return false;
  const favorites = store.getters['favorites/getFavoritePosts'] || [];
  return favorites.some(p => p.id === postId.value);
});

// Функция загрузки данных
const loadPostData = async () => {
  if (!postId.value) {
    console.error('PostDetails.vue - postId отсутствует в route.params.id');
    toast.error('Не указан ID поста');
    router.push('/');
    return;
  }

  try {
    isLoading.value = true;
    console.log('PostDetails.vue - Начало загрузки данных для postId:', postId.value);

    const postData = await store.dispatch('posts/fetchPostById', postId.value);
    if (!postData) {
      console.warn('PostDetails.vue - Пост не найден для postId:', postId.value);
      toast.warning('Пост не найден');
      router.push('/');
      return;
    }
    post.value = postData;
    console.log('PostDetails.vue - Пост загружен:', post.value);

    if (post.value.authorId) {
      console.log('PostDetails.vue - Загрузка профиля автора для authorId:', post.value.authorId);
      const authorProfile = await store.dispatch('profile/fetchProfile', post.value.authorId);
      console.log('PostDetails.vue - Профиль автора загружен:', authorProfile);
    }

    console.log('PostDetails.vue - Загрузка комментариев для postId:', postId.value);
    await store.dispatch('comments/fetchComments', postId.value);
    console.log('PostDetails.vue - Комментарии загружены:', comments.value);
    store.dispatch('pagination/setTotalItems', comments.value.length);

    const currentUserData = store.state.auth.user;
    if (currentUserData && post.value.authorId === currentUserData.uid) {
      console.log('PostDetails.vue - Запуск слушателя уведомлений для владельца поста:', postId.value);
      try {
        await store.dispatch('notifications/startListeningNotifications', postId.value);
      } catch (error) {
        console.error('PostDetails.vue - Ошибка при запуске слушателя уведомлений:', error);
      }
    }
  } catch (error) {
    console.error('PostDetails.vue - Ошибка загрузки:', error);
    toast.error(error.message || 'Ошибка при загрузке поста или комментариев');
    post.value = null;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadPostData();
});

watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    console.log('PostDetails.vue - Изменение postId в маршруте:', newId);
    loadPostData();
  }
});

onBeforeUnmount(() => {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
  if (videoPreview.value) URL.revokeObjectURL(videoPreview.value);
  if (audioPreview.value) URL.revokeObjectURL(audioPreview.value);
  commentContent.value = '';
  imageFile.value = null;
  audioFile.value = null;
  videoFile.value = null;
  videoPreview.value = null;
  audioPreview.value = null;

  const currentUser = store.state.auth.user;
  if (postId.value && currentUser && post.value?.authorId === currentUser.uid) {
    console.log('PostDetails.vue - Остановка слушателя уведомлений для postId:', postId.value);
    try {
      store.dispatch('notifications/stopListeningNotifications', postId.value);
    } catch (error) {
      console.error('PostDetails.vue - Ошибка при остановке слушателя уведомлений:', error);
    }
  }
});

const goBack = () => router.push('/');

const handleLike = async () => {
  const user = store.state.auth.user;
  if (!user) {
    toast.warning('Пожалуйста, войдите в систему, чтобы поставить лайк');
    return;
  }
  try {
    const updatedPost = await store.dispatch('posts/toggleLike', post.value.id);
    post.value = updatedPost || post.value;
    console.log('PostDetails.vue - Лайк обновлен:', post.value.likesCount);
  } catch (error) {
    toast.error('Не удалось поставить лайк');
    console.error('PostDetails.vue - Ошибка при переключении лайка:', error);
  }
};

const toggleFavorite = async () => {
  const user = store.state.auth.user;
  if (!user) {
    toast.warning('Пожалуйста, войдите в систему, чтобы добавить в избранное');
    return;
  }
  if (!postId.value) {
    toast.error('ID поста не найден');
    return;
  }
  try {
    await store.dispatch('favorites/toggleFavorite', { 
      postId: postId.value, 
      categoryId: post.value?.categoryId || '-OJTCQi2RB-FivSg_Cap'
    });
    await store.dispatch('favorites/fetchFavoritePosts');
    toast.success(isFavorite.value ? 'Добавлено в избранное' : 'Удалено из избранного');
    console.log('PostDetails.vue - Статус избранного обновлен:', isFavorite.value);
  } catch (error) {
    console.error('PostDetails.vue - Ошибка при переключении избранного:', error);
    toast.error('Не удалось обновить избранное');
  }
};

const focusComment = () => {
  const textarea = document.querySelector('textarea');
  if (textarea) textarea.focus();
};

const handleCommentInput = (event) => {
  if (event.target.value.length > MAX_CHARS) {
    commentContent.value = event.target.value.slice(0, MAX_CHARS);
  }
};

const handleKeyDown = (event) => {
  if (remainingChars.value <= 0 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
  }
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите файл изображения');
      return;
    }
    imageFile.value = file;
    imagePreview.value = URL.createObjectURL(file);
    toast.info(`Выбрано изображение: ${file.name}`);
  }
  event.target.value = '';
};

const handleAudioUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith('audio/')) {
      toast.error('Выберите аудиофайл');
      return;
    }
    audioFile.value = file;
    audioPreview.value = URL.createObjectURL(file);
    toast.info(`Выбрана музыка: ${file.name}`);
  }
  event.target.value = '';
};

const handleVideoUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith('video/')) {
      toast.error('Выберите видеофайл');
      return;
    }
    videoFile.value = file;
    videoPreview.value = URL.createObjectURL(file);
    toast.info(`Выбрано видео: ${file.name}`);
  }
  event.target.value = '';
};

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    toast.warning('Пожалуйста, введите текст комментария');
    return;
  }

  const user = store.state.auth.user;
  if (!user) {
    toast.error('Пожалуйста, войдите в систему');
    return;
  }

  try {
    let imageUrl = null;
    let videoUrl = null;
    let audioUrl = null;

    if (imageFile.value) {
      const result = await store.dispatch('picture/uploadImage', { file: imageFile.value, type: 'comment' });
      imageUrl = result;
    }

    if (videoFile.value) {
      const videoResult = await store.dispatch('video/uploadVideo', videoFile.value);
      videoUrl = videoResult.videoUrl;
    }

    if (audioFile.value) {
      const audioResult = await store.dispatch('music/uploadAudio', audioFile.value);
      audioUrl = audioResult.success ? audioResult.data.url : null;
    }

    const commentData = {
      postId: postId.value,
      content: commentContent.value.trim(),
      image: imageUrl || null,
      video: videoUrl || null,
      audio: audioUrl || null,
      authorId: user.uid,
      createdAt: Date.now(),
    };

    console.log('PostDetails.vue - Отправка комментария:', commentData);
    await store.dispatch('comments/addComment', commentData);

    commentContent.value = '';
    imageFile.value = null;
    imagePreview.value = null;
    videoFile.value = null;
    videoPreview.value = null;
    audioFile.value = null;
    audioPreview.value = null;
    toast.success('Комментарий успешно добавлен!');
  } catch (error) {
    console.error('PostDetails.vue - Ошибка отправки комментария:', error);
    toast.error('Не удалось отправить комментарий');
  }
};

const handlePageChange = (page) => {
  store.dispatch('pagination/setCurrentPage', page);
  console.log('PostDetails.vue - Смена страницы пагинации:', page);
};

const handleAvatarError = (event) => {
  console.log('PostDetails.vue - Ошибка загрузки аватара');
  event.target.src = '/image/empty_avatar.png';
};

const handleImageError = (event) => {
  console.log('PostDetails.vue - Ошибка загрузки изображения');
  event.target.src = '/image/error-placeholder.png';
};

const formatDate = (timestamp) => (timestamp ? new Date(timestamp).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
const formatTime = (timestamp) => (timestamp ? new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '');
const formatFileSize = (size) => {
  if (!size) return '';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  const index = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

const getImageUrl = (image) => image || '';

const downloadDocument = (url, name) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = name || 'document';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.prose :deep(p) {
  margin: 0.5em 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.prose :deep(a) {
  color: #6366f1;
  text-decoration: none;
  transition: color 0.2s;
}
.prose :deep(a:hover) {
  color: #4f46e5;
}
.prose :deep(b) {
  font-weight: bold;
}
.prose :deep(i) {
  font-style: italic;
}
.prose :deep(u) {
  text-decoration: underline;
}
.prose {
  max-width: 100%;
  overflow-x: hidden;
  word-wrap: break-word;
  overflow-wrap: break-word;
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

.required-field {
  border-color: red;
  animation: blink 1s step-end infinite alternate;
}

@keyframes blink {
  from {
    border-color: red;
  }
  to {
    border-color: transparent;
  }
}
</style>