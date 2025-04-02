<template>
  <div class="flex flex-col min-h-screen bg-gray-100 text-gray-900">
    <HeaderWrapper class="bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md" />
    <div class="flex flex-1">
      <Sidebar />
      <main class="flex-1 p-6">
        <div v-if="isInitializing" class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
        <RouterView v-else />
      </main>
    </div>
    <Footer class="bg-gray-800 text-gray-300 text-center p-4" />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import HeaderWrapper from './components/HeaderWrapper.vue';
import Sidebar from './components/Sidebar.vue';
import Footer from './components/Footer.vue';
import { initializeDefaultCategories } from './utils/initializeCategories';

export default {
  name: 'App',
  components: {
    HeaderWrapper,
    Sidebar,
    Footer,
  },
  setup() {
    const store = useStore();
    const isInitializing = ref(true);

    onMounted(async () => {
      console.log('App: Инициализация...');
      try {
        const user = await store.dispatch('auth/initAuth');
        if (user) {
          await store.dispatch('profile/fetchProfile', user.uid);
        }
        await initializeDefaultCategories();
        await store.dispatch('categories/fetchCategories');
        console.log('App: Категории загружены');
      } catch (error) {
        console.error('App: Ошибка при загрузке категорий:', error);
      } finally {
        isInitializing.value = false;
      }
    });

    return { isInitializing };
  },
};
</script>