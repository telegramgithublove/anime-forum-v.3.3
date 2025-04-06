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
        class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden category-card"
        :class="{
          'border-2 border-red-500': category.type === 'unique',
          'opacity-50 cursor-not-allowed': category.type === 'unique' && !canAccessUniqueCategories
        }"
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
                'bg-yellow-100 text-yellow-800': category.type === 'help',
                'bg-red-100 text-red-800 font-semibold': category.type === 'unique'
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
            <span>{{ formatLastPostDate(category.lastActivity, category.topicsCount) }}</span>
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

    // Получаем категории из store
    const categories = computed(() => store.getters['categories/getAllCategories']);
    const loading = computed(() => store.state.categories.loading);
    const error = computed(() => store.state.categories.error);

    // Проверяем, имеет ли пользователь доступ к уникальным категориям
    const canAccessUniqueCategories = computed(() => {
      const user = store.state.auth.user;
      const userRole = store.state.profile.profile?.role || 'New User';
      const allowedRoles = ['User', 'Moderator', 'Teacher', 'Administrator'];
      return user && allowedRoles.includes(userRole);
    });

    const getCategoryTypeName = (type) => {
      const types = {
        default: 'Обычная',
        announcement: 'Объявления',
        discussion: 'Обсуждения',
        help: 'Помощь',
        unique: 'Уникальная категория'
      };
      return types[type] || type;
    };

    const formatLastPostDate = (timestamp, topicsCount) => {
      // Если нет постов (topicsCount = 0), показываем "Нет активности"
      if (topicsCount === 0) {
        return 'Нет активности';
      }
      
      if (!timestamp) {
        console.log('Нет timestamp для lastActivity:', timestamp);
        return 'Нет активности';
      }
      try {
        // Поддержка timestamp в миллисекундах
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          console.error('Некорректный timestamp:', timestamp);
          return 'Ошибка даты';
        }
        return format(date, 'dd MMM yyyy HH:mm', { locale: ru });
      } catch (error) {
        console.error('Ошибка форматирования даты:', error, 'Timestamp:', timestamp);
        return 'Ошибка даты';
      }
    };

    const navigateToCategory = (category) => {
      if (category && category.id) {
        if (category.type === 'unique' && !canAccessUniqueCategories.value) {
          return;
        }
        router.push({
          name: 'CategoryPosts',
          params: { categoryId: category.id }
        });
      }
    };

    // Загружаем категории при монтировании компонента
    onMounted(async () => {
      try {
        await store.dispatch('categories/fetchCategories');
        console.log('Категории загружены:', categories.value);
      } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
      }
    });

    return {
      categories,
      loading,
      error,
      getCategoryTypeName,
      formatLastPostDate,
      navigateToCategory,
      canAccessUniqueCategories
    };
  }
};
</script>

<style scoped>
.category-card {
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-2px);
}

.category-card.opacity-50:hover {
  transform: none;
  shadow: none;
}
</style>