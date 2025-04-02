<template>
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-4 sm:p-6 md:p-8">
      <div class="max-w-4xl mx-auto space-y-8">
        <div class="flex items-center space-x-3">
          <i class="fas fa-folder-open text-3xl text-blue-500"></i>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Мои темы</h1>
        </div>
        <div v-if="isLoading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
        </div>
        <div v-else-if="userPosts.length" class="space-y-4">
          <div v-for="post in userPosts" :key="post.id" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transform hover:shadow-2xl transition-all duration-300">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-semibold text-gray-800 dark:text-white">{{ post.title || 'Без названия' }}</h2>
                <p class="text-gray-600 dark:text-gray-400 mt-2" v-html="post.content ? post.content.slice(0, 100) + (post.content.length > 100 ? '...' : '') : 'Нет описания'"></p>
              </div>
              <button @click="openConfirmation(post.id)" class="text-red-500 hover:text-red-600 transition-all duration-300">
                <i class="fas fa-trash text-lg"></i>
              </button>
            </div>
            <router-link :to="`/post/${post.id}`" class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mt-2 inline-block">Читать далее</router-link>
          </div>
        </div>
        <p v-else class="text-gray-500 dark:text-gray-400 text-lg">У вас еще нет созданных тем.</p>
      </div>
      <PopUp
        ref="popup"
        message="Вы точно хотите удалить эту тему?"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import { useStore } from 'vuex';
  import { useToast } from 'vue-toastification';
  import PopUp from '../components/PopUp.vue';
  
  const store = useStore();
  const toast = useToast();
  const isLoading = ref(true);
  const popup = ref(null);
  let pendingPostId = null;
  
  // Логируем текущего пользователя
  const currentUser = computed(() => {
    const user = store.state.auth.user;
    console.log('MyTopics.vue - Текущий пользователь:', user ? { uid: user.uid, email: user.email } : 'Не авторизован');
    return user;
  });
  
  // Логируем посты пользователя
  const userPosts = computed(() => {
    const posts = store.getters['mytopics/getUserPosts'] || [];
    console.log('MyTopics.vue - Вычисляем userPosts:', {
      postsCount: posts.length,
      posts: posts.map(p => ({ id: p.id, title: p.title, userId: p.userId }))
    });
    return posts;
  });
  
  onMounted(async () => {
    console.log('MyTopics.vue - Компонент смонтирован, начинаем загрузку постов');
    console.log('MyTopics.vue - Состояние авторизации:', store.state.auth);
    await fetchPosts();
  });
  
  const fetchPosts = async () => {
    console.log('MyTopics.vue - Вызов fetchPosts');
    try {
      isLoading.value = true;
      console.log('MyTopics.vue - Устанавливаем isLoading = true');
      
      const userId = currentUser.value?.uid;
      console.log('MyTopics.vue - userId для запроса:', userId);
      
      if (!userId) {
        console.warn('MyTopics.vue - Пользователь не авторизован, пропускаем загрузку постов');
        toast.warning('Пожалуйста, войдите в систему для просмотра ваших тем');
        return;
      }
  
      console.log('MyTopics.vue - Отправляем запрос в store.dispatch("mytopics/fetchUserPosts")');
      await store.dispatch('mytopics/fetchUserPosts');
      
      const fetchedPosts = store.getters['mytopics/getUserPosts'];
      console.log('MyTopics.vue - Посты успешно загружены из store:', {
        postsCount: fetchedPosts.length,
        posts: fetchedPosts.map(p => ({ id: p.id, title: p.title, userId: p.userId }))
      });
    } catch (error) {
      console.error('MyTopics.vue - Ошибка при загрузке постов:', {
        message: error.message,
        stack: error.stack
      });
      toast.error('Ошибка при загрузке ваших тем');
    } finally {
      isLoading.value = false;
      console.log('MyTopics.vue - Устанавливаем isLoading = false');
    }
  };
  
  const openConfirmation = (postId) => {
    console.log('MyTopics.vue - Открываем подтверждение удаления', {
      postId,
      currentPendingPostId: pendingPostId
    });
    pendingPostId = postId;
    if (popup.value) {
      console.log('MyTopics.vue - Показываем PopUp для postId:', postId);
      popup.value.show();
    } else {
      console.error('MyTopics.vue - popup.value не определен');
    }
  };
  
  const confirmDelete = async () => {
    console.log('MyTopics.vue - Подтверждение удаления вызвано');
    const user = currentUser.value;
    
    console.log('MyTopics.vue - Проверка авторизации перед удалением:', {
      userExists: !!user,
      userId: user?.uid
    });
    
    if (!user) {
      console.warn('MyTopics.vue - Пользователь не авторизован для удаления');
      toast.warning('Пожалуйста, войдите в систему, чтобы удалить тему');
      return;
    }
  
    if (!pendingPostId) {
      console.error('MyTopics.vue - Нет pendingPostId для удаления');
      return;
    }
  
    console.log('MyTopics.vue - Подтверждено удаление для postId:', pendingPostId);
    try {
      console.log('MyTopics.vue - Отправляем запрос на удаление через store.dispatch("mytopics/deleteUserPost")');
      await store.dispatch('mytopics/deleteUserPost', pendingPostId);
      console.log('MyTopics.vue - Пост успешно удален, postId:', pendingPostId);
      toast.success('Тема удалена');
      
      console.log('MyTopics.vue - Обновляем список постов после удаления');
      await fetchPosts();
    } catch (error) {
      console.error('MyTopics.vue - Ошибка при удалении темы:', {
        postId: pendingPostId,
        message: error.message,
        stack: error.stack
      });
      toast.error('Не удалось удалить тему');
    } finally {
      pendingPostId = null;
      console.log('MyTopics.vue - Сбрасываем pendingPostId после удаления');
    }
  };
  
  const cancelDelete = () => {
    console.log('MyTopics.vue - Отмена удаления', {
      postId: pendingPostId
    });
    pendingPostId = null;
    console.log('MyTopics.vue - pendingPostId сброшен');
  };
  
  // Отслеживаем изменения userPosts для диагностики
  watch(userPosts, (newValue, oldValue) => {
    console.log('MyTopics.vue - Обнаружено изменение в userPosts:', {
      oldCount: oldValue.length,
      newCount: newValue.length,
      newPosts: newValue.map(p => ({ id: p.id, title: p.title, userId: p.userId })),
      diff: newValue.length !== oldValue.length ? 'Добавлен/удален пост' : 'Состав не изменился'
    });
  });
  
  // Слушаем изменения в состоянии store.state.mytopics.userPosts
  watch(() => store.state.mytopics.userPosts, async (newPosts, oldPosts) => {
    console.log('MyTopics.vue - Обнаружено изменение в store.state.mytopics.userPosts:', {
      oldCount: oldPosts.length,
      newCount: newPosts.length,
      newPosts: newPosts.map(p => ({ id: p.id, title: p.title, userId: p.userId }))
    });
    
    if (newPosts.length !== oldPosts.length) {
      console.log('MyTopics.vue - Количество постов изменилось, обновляем список');
      await fetchPosts();
    } else {
      console.log('MyTopics.vue - Количество постов не изменилось, пропускаем обновление');
    }
  });
  
  // Дополнительное логирование состояния при загрузке
  watch(isLoading, (newValue) => {
    console.log('MyTopics.vue - Состояние isLoading изменилось:', newValue);
  });
  </script>