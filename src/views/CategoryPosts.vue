<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto pb-20">
      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center gap-4">
          <router-link 
            to="/" 
            class="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-600 hover:text-purple-600 dark:hover:text-purple-200 transition-all duration-300 shadow-sm transform hover:scale-105"
            title="На главную"
          >
            <i class="fas fa-arrow-left text-lg"></i>
          </router-link>
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent animate-gradient-text">
              {{ categoryName || 'Категория' }}
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
              {{ categoryDescription || 'Описание категории будет здесь...' }}
            </p>
          </div>
        </div>
        <div>
          <button 
            v-if="!isAuthenticated" 
            @click="openAttention" 
            class="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium rounded-full hover:from-purple-700 hover:to-indigo-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg"
          >
            <i class="fas fa-plus mr-2"></i>
            Новая тема
          </button>
          <router-link 
            v-else 
            :to="{ name: 'create-post', params: { categoryId } }" 
            class="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium rounded-full hover:from-purple-700 hover:to-indigo-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg"
          >
            <i class="fas fa-plus mr-2"></i>
            Новая тема
          </router-link>
        </div>
      </div>

      <div v-if="pagedPosts.length > 0 && !isLoading" class="space-y-6">
        <div v-for="post in pagedPosts" :key="post.id" class="group">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <router-link 
              :to="{ name: 'post-details', params: { id: post.id }}" 
              class="block p-8"
              @click="incrementPostViews(post.id)"
            >
              <div class="flex items-start space-x-6">
                <div class="flex-shrink-0 text-center">
                  <img 
                    :src="post.authorAvatar" 
                    :alt="`${post.authorName}'s avatar`" 
                    class="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-purple-200 dark:border-purple-700 group-hover:border-purple-400 dark:group-hover:border-purple-500 transition-colors duration-300 mx-auto"
                    @error="handleAvatarError($event)"
                  >
                  <span class="block mt-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {{ post.authorName }}
                  </span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ post.authorRole }}
                  </p>
                </div>
                <div class="flex-1">
                  <div class="flex items-start justify-between">
                    <h2 class="text-xl sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-purple-400 hover:to-indigo-400 transform hover:-translate-y-0.5 transition-all duration-300 tracking-wide uppercase font-sans">
                      {{ post.title }}
                    </h2>
                    <span class="flex flex-col items-end text-sm text-gray-500 dark:text-gray-400">
                      <span>{{ formatDate(post.createdAt) }}</span>
                      <span>{{ new Date(post.createdAt).toLocaleTimeString() }}</span>
                    </span>
                  </div>
                  <p class="mt-4 text-gray-700 dark:text-gray-300 text-base leading-relaxed line-clamp-2">
                    {{ post.content ? post.content.substring(0, 100) + '...' : 'Контент отсутствует...' }}
                  </p>
                  <div class="mt-4 mr-4 mb-4 flex justify-end">
                    <router-link 
                      :to="{ name: 'post-details', params: { id: post.id }}" 
                      class="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-full hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                    >
                      Читать далее
                    </router-link>
                  </div>
                  <div v-if="post.tags && post.tags.length" class="mt-6 flex flex-wrap gap-3">
                    <span 
                      v-for="tag in post.tags" 
                      :key="tag"
                      class="px-4 py-2 text-base rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors duration-300 font-medium"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </router-link>
            <div class="flex items-center justify-between px-8 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center space-x-4">
                <button 
                  @click.stop="isAuthenticated ? toggleLike(post.id) : openAttention()"
                  class="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-500 transition-colors duration-200"
                  :disabled="isLoadingLikes"
                  :title="isAuthenticated ? '' : 'Требуется авторизация'"
                >
                  <i class="fas" :class="post.isLiked ? 'fa-heart text-purple-600 dark:text-purple-500' : 'fa-heart'"></i>
                  <span>{{ post.likesCount }}</span>
                </button>
                <span class="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                  <i class="fas fa-comment"></i>
                  <span>{{ post.commentsCount }}</span>
                </span>
                <span class="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                  <i class="fas fa-eye"></i>
                  <span>{{ post.views }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
        <div class="relative w-32 h-32">
          <div class="absolute inset-0 border-4 border-t-purple-600 dark:border-t-purple-500 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
          <span class="absolute inset-0 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
            {{ loadingProgress }}%
          </span>
        </div>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400 animate-pulse">
          Загрузка тем...
        </p>
      </div>
      <div v-else-if="posts.length === 0" class="text-center text-lg text-gray-600 dark:text-gray-400">
        Постов нет
      </div>

      <div class="mb-122">
        <Pagination :total-items="posts.length" :items-per-page="itemsPerPage" />
      </div>
    </div>
    <Attention ref="attentionModal" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { getDatabase, ref as dbRef, get, onValue, update } from 'firebase/database';
import Pagination from '../components/Pagination.vue';
import Attention from '../components/Attention.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();
const categoryId = route.params.categoryId;
const posts = ref([]);
const categoryName = ref('');
const categoryDescription = ref('');
const isLoading = ref(true);
const isLoadingLikes = ref(false);
const loadingProgress = ref(0);
const itemsPerPage = 10;
const attentionModal = ref(null);
let unsubscribe = null;

const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);

// Статические уникальные категории (заглушки для проверки)
const uniqueCategories = {
  'unique1': { name: 'Устаревшие ремёсла', description: 'Исследование исчезнувших профессий в аниме и манге.' },
  'unique2': { name: 'Синестезия в аниме', description: 'Визуальные и звуковые эксперименты в тайтлах.' },
  'unique3': { name: 'Вымышленные традиции', description: 'Уникальные ритуалы выдуманных миров.' },
};

onMounted(async () => {
  try {
    isLoading.value = true;
    loadingProgress.value = 0;
    const db = getDatabase();
    
    // Проверяем, является ли категория уникальной (статической)
    if (uniqueCategories[categoryId]) {
      categoryName.value = uniqueCategories[categoryId].name;
      categoryDescription.value = uniqueCategories[categoryId].description;
      loadingProgress.value = 100;
      isLoading.value = false;
      // Пока нет постов для уникальных категорий, они пустые
      posts.value = [];
      return;
    }

    // Загрузка данных из Firebase для обычных категорий
    const categoryRef = dbRef(db, `categories/${categoryId}`);
    loadingProgress.value = 20;
    const categorySnapshot = await get(categoryRef);
    
    if (categorySnapshot.exists()) {
      const categoryData = categorySnapshot.val();
      categoryName.value = categoryData.name;
      categoryDescription.value = categoryData.description;
      loadingProgress.value = 40;
      
      const postsRef = dbRef(db, `categories/${categoryId}/posts`);
      unsubscribe = onValue(postsRef, async (snapshot) => {
        loadingProgress.value = 80;
        if (snapshot.exists()) {
          const postsData = snapshot.val();
          const currentUserId = store.state.auth.user?.uid || localStorage.getItem('userId');

          const postsArray = await Promise.all(Object.entries(postsData).map(async ([id, post]) => {
            let authorName = post.authorName || 'Гость';
            let authorAvatar = post.authorAvatar || '/image/empty_avatar.png';
            let authorRole = 'New User';

            if (post.authorId && post.authorId !== currentUserId) {
              try {
                let authorProfile = store.getters['profile/getProfileByUserId'](post.authorId);
                if (!authorProfile) {
                  await store.dispatch('profile/fetchProfile', post.authorId);
                  authorProfile = store.getters['profile/getProfileByUserId'](post.authorId);
                }
                if (authorProfile) {
                  authorName = post.authorName || authorProfile.username || 'Гость';
                  authorAvatar = post.authorAvatar || authorProfile.avatarUrl || '/image/empty_avatar.png';
                  authorRole = authorProfile.role || 'New User';
                }
              } catch (error) {
                console.error('[CategoryPosts] Failed to fetch profile:', error);
              }
            } else if (post.authorId === currentUserId) {
              authorName = store.getters['auth/getUsername'];
              authorAvatar = store.getters['auth/getUserAvatar'];
              authorRole = store.getters['auth/userRole'] || 'New User';
            }

            const likes = post.likes || {};
            const isLiked = currentUserId && likes[currentUserId] ? true : false;
            const likesCount = Object.keys(likes).length;
            const commentsCount = post.commentsCount || 0;
            const views = post.views || 0;

            return {
              id,
              ...post,
              authorName,
              authorAvatar,
              authorRole,
              tags: Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : ['форум']),
              likes,
              likesCount,
              commentsCount,
              views,
              createdAt: post.createdAt || 0,
              isLiked
            };
          }));
          posts.value = postsArray;
          loadingProgress.value = 100;
        }
        isLoading.value = false;
      });
    } else {
      throw new Error('Категория не найдена');
    }
  } catch (error) {
    console.error('Error loading posts:', error);
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

// Сортировка постов по убыванию createdAt (последние сверху)
const sortedPosts = computed(() => {
  return [...posts.value].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA; // Сортировка от последнего к первому
  });
});

const pagedPosts = computed(() => {
  return store.getters['pagination/getPagedItems'](sortedPosts.value);
});

const formatDate = (timestamp) => {
  if (!timestamp) return 'Неизвестно';
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const toggleLike = async (postId) => {
  if (!isAuthenticated.value) {
    openAttention();
    return;
  }
  try {
    isLoadingLikes.value = true;
    const currentUserId = store.state.auth.user?.uid || localStorage.getItem('userId');
    const db = getDatabase();
    const postRefGlobal = dbRef(db, `posts/${postId}`);
    const postRefCategory = dbRef(db, `categories/${categoryId}/posts/${postId}`);

    const postSnapshotCategory = await get(postRefCategory);
    if (!postSnapshotCategory.exists()) throw new Error('Пост не найден');

    const postData = postSnapshotCategory.val();
    const likes = postData.likes || {};
    const isLiked = !!likes[currentUserId];
    const updatedLikes = { ...likes };
    const newLikesCount = isLiked ? Object.keys(likes).length - 1 : Object.keys(likes).length + 1;

    if (isLiked) {
      delete updatedLikes[currentUserId];
    } else {
      updatedLikes[currentUserId] = true;
    }

    const updates = {
      likes: updatedLikes,
      likesCount: newLikesCount
    };
    await update(postRefGlobal, updates);
    await update(postRefCategory, updates);

    const postIndex = posts.value.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      posts.value[postIndex] = {
        ...posts.value[postIndex],
        likes: updatedLikes,
        likesCount: newLikesCount,
        isLiked: !isLiked
      };
    }
  } catch (error) {
    console.error('Ошибка при переключении лайка:', error);
    alert(error.message);
  } finally {
    isLoadingLikes.value = false;
  }
};

const incrementPostViews = async (postId) => {
  try {
    const db = getDatabase();
    const postRefGlobal = dbRef(db, `posts/${postId}`);
    const postRefCategory = dbRef(db, `categories/${categoryId}/posts/${postId}`);

    // Получаем текущее значение views
    const snapshot = await get(postRefCategory);
    if (!snapshot.exists()) throw new Error('Пост не найден');

    const postData = snapshot.val();
    const currentViews = postData.views || 0;
    const newViews = currentViews + 1;

    // Обновляем в Firebase
    const updates = { views: newViews };
    await update(postRefGlobal, updates);
    await update(postRefCategory, updates);

    // Обновляем локальное состояние
    const postIndex = posts.value.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      posts.value[postIndex] = {
        ...posts.value[postIndex],
        views: newViews
      };
    }

    // Также обновляем в Vuex через dispatch
    await store.dispatch('posts/incrementViews', postId);
  } catch (error) {
    console.error('Ошибка при обновлении просмотров:', error);
  }
};

const handleAvatarError = (event) => {
  event.target.src = '/image/empty_avatar.png';
};

const openAttention = () => {
  attentionModal.value.open();
};
</script>

<style scoped>
.animate-gradient-text {
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>