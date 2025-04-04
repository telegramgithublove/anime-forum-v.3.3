<template>
  <div class="max-w-7xl mx-auto px-4 relative pb-24">
    <h1 class="text-3xl font-bold text-center text-gray-900 mb-8">
      Категории форума
    </h1>
    
    <!-- Сетка категорий -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      <div 
        v-for="category in categories" 
        :key="category.id"
        class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer category-card"
        @click="navigateToCategory(category)"
      >
        <div class="p-6 h-full flex flex-col">
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-900">
              {{ category.name }}
            </h3>
            <span 
              class="inline-block px-2 py-1 text-sm rounded mt-2 w-fit"
              :class="{
                'bg-green-100 text-green-800': category.type === 'default',
                'bg-blue-100 text-blue-800': category.type === 'announcement',
                'bg-purple-100 text-purple-800': category.type === 'discussion',
                'bg-yellow-100 text-yellow-800': category.type === 'help'
              }"
            >
              {{ getCategoryTypeName(category.type) }}
            </span>
            <p class="text-gray-600 mt-3">
              {{ category.description }}
            </p>
          </div>
          <div class="flex justify-between items-center mt-4 text-sm text-gray-500">
            <span>{{ category.topicsCount || 0 }} тем</span>
            <span>{{ formatDate(category) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Сообщение если нет категорий -->
    <div v-if="!categories.length && !loading" class="text-center py-12">
      <p class="text-gray-500 text-lg">Категории пока не созданы</p>
    </div>

    <!-- Сообщение если идет загрузка -->
    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500 text-lg">Загрузка...</p>
    </div>

    <!-- Сообщение если произошла ошибка -->
    <div v-if="error" class="text-center py-12">
      <p class="text-red-500 text-lg">Произошла ошибка при загрузке категорий</p>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default {
  name: 'CategoryList',
  
  setup() {
    const store = useStore();
    const router = useRouter();

    const categories = computed(() => {
      const cats = store.getters['categories/getAllCategories'];
      console.log('CategoryList.vue: Получены категории из геттера:', cats);
      return cats;
    });

    const loading = computed(() => store.state.categories.loading);
    const error = computed(() => store.state.categories.error);

    const getCategoryTypeName = (type) => {
      const types = {
        default: 'Обычная',
        announcement: 'Объявления',
        discussion: 'Обсуждения',
        help: 'Помощь',
      };
      return types[type] || type;
    };

    const determineLastActivity = (category) => {
      console.log('CategoryList.vue: Определение последней активности для категории:', category.name, category);
      
      const timestamps = [];
      
      // Добавляем lastActivity категории, если оно есть
      if (category.lastActivity && !isNaN(Number(category.lastActivity))) {
        timestamps.push(Number(category.lastActivity));
      }

      // Проверяем посты
      if (category.posts && typeof category.posts === 'object') {
        Object.values(category.posts).forEach(post => {
          if (post && post.createdAt) {
            const timestamp = typeof post.createdAt === 'string' 
              ? Date.parse(post.createdAt) 
              : Number(post.createdAt);
            if (!isNaN(timestamp)) {
              timestamps.push(timestamp);
            }
          }
          // Проверяем комментарии к постам
          if (post && post.comments && typeof post.comments === 'object') {
            Object.values(post.comments).forEach(comment => {
              if (comment && comment.createdAt) {
                const commentTimestamp = typeof comment.createdAt === 'string' 
                  ? Date.parse(comment.createdAt) 
                  : Number(comment.createdAt);
                if (!isNaN(commentTimestamp)) {
                  timestamps.push(commentTimestamp);
                }
              }
            });
          }
        });
      }

      console.log('CategoryList.vue: Найденные временные метки для категории', category.name, timestamps);
      return timestamps.length > 0 ? Math.max(...timestamps) : null;
    };

    const formatDate = (category) => {
      console.log('CategoryList.vue: Форматирование даты для категории:', category.name, 'topicsCount:', category.topicsCount);
      
      // Если 0 тем, показываем "Нет активности"
      if (!category.topicsCount || category.topicsCount === 0) {
        return 'Нет активности';
      }

      // Ищем последнюю активность
      const timestamp = determineLastActivity(category);
      
      if (!timestamp || isNaN(Number(timestamp))) {
        return 'Нет активности'; // Это не должно сработать при topicsCount > 0, но оставлено для безопасности
      }

      try {
        return format(new Date(Number(timestamp)), 'dd MMM yyyy HH:mm', { locale: ru });
      } catch (error) {
        console.error('CategoryList.vue: Ошибка форматирования даты:', error, 'Timestamp:', timestamp);
        return 'Нет активности';
      }
    };

    const navigateToCategory = (category) => {
      if (category && category.id) {
        console.log('CategoryList.vue: Переход к категории:', category.id);
        router.push({
          name: 'CategoryPosts',
          params: { categoryId: category.id },
        });
      }
    };

    onMounted(async () => {
      console.log('CategoryList.vue: Монтирование компонента');
      try {
        await store.dispatch('categories/fetchCategories');
        console.log('CategoryList.vue: Категории загружены');
      } catch (error) {
        console.error('CategoryList.vue: Ошибка при загрузке категорий:', error);
      }
    });

    return {
      categories,
      loading,
      error,
      getCategoryTypeName,
      formatDate,
      navigateToCategory,
    };
  },
};
</script>

<style scoped>
.category-card {
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-2px);
}
</style>