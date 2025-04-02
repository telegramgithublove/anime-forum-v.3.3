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
        <router-link :to="{ name: 'create-post', params: { categoryId } }" class="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium rounded-full hover:from-purple-700 hover:to-indigo-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg">
          <i class="fas fa-plus mr-2"></i>
          Новая тема
        </router-link>
      </div>

      <div v-if="pagedPosts.length > 0 && !isLoading" class="space-y-6">
        <div v-for="post in pagedPosts" :key="post.id" class="group">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <router-link :to="{ name: 'post-details', params: { id: post.id }}" class="block p-8">
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
                  @click.stop="toggleLike(post.id)"
                  class="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-500 transition-colors duration-200"
                  :disabled="isLoadingLikes"
                >
                  <i class="fas" :class="post.isLiked ? 'fa-heart text-purple-600 dark:text-purple-500' : 'fa-heart'"></i>
                  <span>{{ post.likesCount }}</span>
                </button>
                <span class="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                  <i class="fas fa-comment"></i>
                  <span>{{ post.comments ? Object.keys(post.comments).length : 0 }}</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { getDatabase, ref as dbRef, get, onValue } from 'firebase/database';
import Pagination from '../components/Pagination.vue';

const route = useRoute();
const store = useStore();
const categoryId = route.params.categoryId;
const posts = ref([]);
const categoryName = ref('');
const categoryDescription = ref('');
const isLoading = ref(true);
const isLoadingLikes = ref(false);
const loadingProgress = ref(0);
const itemsPerPage = 10;
let unsubscribe = null;

onMounted(async () => {
  try {
    isLoading.value = true;
    loadingProgress.value = 0;
    const db = getDatabase();
    
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
        console.log('Snapshot из onValue:', snapshot.val());
        loadingProgress.value = 80;
        if (snapshot.exists()) {
          const postsData = snapshot.val();
          const currentUserId = store.state.auth.user?.uid || localStorage.getItem('userId');
          console.log('[CategoryPosts] Current user ID:', currentUserId);

          const postsArray = await Promise.all(Object.entries(postsData).map(async ([id, post]) => {
            console.log('[CategoryPosts] Post:', { id, post });

            // Используем данные из поста как приоритетные
            let authorName = post.authorName || 'Гость';
            let authorAvatar = post.authorAvatar || '/image/empty_avatar.png';
            let authorRole = 'New User';

            if (post.authorId) {
              try {
                // Проверяем кэш профиля
                let authorProfile = store.getters['profile/getProfileByUserId'](post.authorId);
                console.log('[CategoryPosts] Profile from cache for authorId:', post.authorId, authorProfile);

                // Загружаем профиль только если он не в кэше и это не текущий пользователь
                if ((!authorProfile || !store.state.profile.profilesCache[post.authorId]) && post.authorId !== currentUserId) {
                  console.log('[CategoryPosts] Profile not in cache, fetching for authorId:', post.authorId);
                  await store.dispatch('profile/fetchProfile', post.authorId);
                  authorProfile = store.getters['profile/getProfileByUserId'](post.authorId);
                  console.log('[CategoryPosts] Profile fetched for authorId:', post.authorId, authorProfile);
                }

                if (authorProfile) {
                  // Используем данные из поста, если они есть, иначе из профиля
                  authorName = post.authorName || authorProfile.username || 'Гость';
                  authorAvatar = post.authorAvatar || authorProfile.avatarUrl || '/image/empty_avatar.png';
                  authorRole = authorProfile.role || 'New User';
                } else {
                  console.warn('[CategoryPosts] No profile data returned for authorId:', post.authorId);
                }

                console.log('[CategoryPosts] Final author data:', { postId: id, authorId: post.authorId, authorName, authorAvatar, authorRole });
              } catch (error) {
                console.error('[CategoryPosts] Failed to fetch profile for authorId:', post.authorId, error);
              }
            } else {
              console.warn('[CategoryPosts] No authorId for post:', id, 'Using fallback:', { authorName });
            }

            const isLiked = post.likes && currentUserId && post.likes[currentUserId] || false;

            return {
              id,
              ...post,
              authorName,
              authorAvatar,
              authorRole,
              tags: Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : ['форум']),
              likes: post.likes || {},
              likesCount: post.likesCount || Object.keys(post.likes || {}).length,
              comments: post.comments || [],
              views: post.views || 0,
              createdAt: post.createdAt || 0,
              isLiked
            };
          }));

          posts.value = postsArray;
          store.dispatch('pagination/setTotalItems', postsArray.length);
          store.dispatch('pagination/setItemsPerPage', itemsPerPage);
          console.log('[CategoryPosts] Posts updated:', postsArray);

          // Проверка уникальности authorId
          const authorIds = postsArray.map(post => post.authorId);
          const uniqueAuthorIds = new Set(authorIds);
          console.log('[Debug] All authorIds in posts:', authorIds);
          console.log('[Debug] Unique authorIds count:', uniqueAuthorIds.size, 'Total posts:', postsArray.length);
          if (uniqueAuthorIds.size < postsArray.length) {
            console.warn('[Debug] Duplicate authorIds detected!');
          }

          loadingProgress.value = 100;
        } else {
          posts.value = [];
          store.dispatch('pagination/setTotalItems', 0);
        }
        setTimeout(() => {
          isLoading.value = false;
          loadingProgress.value = 0;
        }, 500);
      }, (error) => {
        console.error('Ошибка в подписке onValue:', error);
        isLoading.value = false;
        loadingProgress.value = 0;
      });
    } else {
      throw new Error('Категория не найдена');
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    isLoading.value = false;
    loadingProgress.value = 0;
  }
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

const sortedPosts = computed(() => {
  return [...posts.value].sort((a, b) => {
    const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt;
    const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt;
    return bTime - aTime;
  });
});

const pagedPosts = computed(() => {
  const result = store.getters['pagination/getPagedItems'](sortedPosts.value);
  console.log('Paged posts:', result);
  return result;
});

const formatDate = (timestamp) => {
  if (!timestamp) return 'Неизвестно';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const toggleLike = async (postId) => {
  try {
    isLoadingLikes.value = true;
    const updatedPost = await store.dispatch('posts/toggleLike', postId);
    const postIndex = posts.value.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      const currentUserId = store.state.auth.user?.uid || localStorage.getItem('userId');
      const isLiked = updatedPost.likes && updatedPost.likes[currentUserId] || false;
      posts.value[postIndex] = {
        ...posts.value[postIndex],
        likes: updatedPost.likes,
        likesCount: updatedPost.likesCount,
        isLiked
      };
    }
  } catch (error) {
    console.error('Ошибка при переключении лайка:', error);
  } finally {
    isLoadingLikes.value = false;
  }
};

const handleAvatarError = (event) => {
  event.target.src = '/image/empty_avatar.png';
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