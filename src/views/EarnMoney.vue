<!-- EarnMoney.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 py-12 px-4">
    <h1 class="text-5xl font-bold text-white text-center mb-12 animate-pulse font-anime">
      Заработай Preycoins!
    </h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
      <div v-for="(card, index) in cards" :key="index" 
           class="card group relative overflow-hidden rounded-xl shadow-2xl transform transition-all duration-500 hover:scale-105">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
        
        <div class="relative z-20 p-6 h-full flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <component :is="card.icon" class="w-10 h-10 text-yellow-400 animate-bounce" />
              <h2 class="text-2xl font-bold text-white font-anime">{{ card.title }}</h2>
            </div>
            
            <ul class="text-white/90 space-y-2 mb-6 text-sm">
              <li v-for="benefit in card.benefits" :key="benefit" class="flex items-center gap-2">
                <star-icon class="w-4 h-4 text-pink-400" />
                {{ benefit }}
              </li>
            </ul>
          </div>

          <div class="space-y-4">
            <p class="text-white font-bold text-lg">
              Стоимость: <span class="text-yellow-400">{{ card.cost }}</span> Preycoins
            </p>
            <button 
              @click="activateCard(card)" 
              :disabled="userBalance < card.requiredBalance"
              class="w-full py-4 px-8 rounded-lg font-bold text-white text-lg transition-all duration-300 transform
                     disabled:opacity-50 disabled:cursor-not-allowed
                     bg-gradient-to-r from-pink-500 to-purple-600
                     hover:from-pink-600 hover:to-purple-700 hover:scale-105
                     active:scale-95">
              {{ userBalance >= card.requiredBalance ? 'Активировать' : 'Недостаточно Preycoins' }}
            </button>
          </div>
        </div>

        <div class="absolute inset-0 bg-anime-pattern opacity-10"></div>
      </div>
    </div>

    <!-- Раздел правил с отступом снизу -->
    <div class="max-w-4xl mx-auto mt-16 mb-20 p-8 bg-gray-900/50 backdrop-blur-md rounded-xl shadow-2xl text-white">
      <h2 class="text-3xl font-bold text-center mb-6 font-anime text-yellow-400 animate-float">
        Как заработать Preycoins?
      </h2>
      <p class="text-lg mb-4">
        <span class="text-pink-400 font-bold">Preycoins</span> — это валюта нашего портала. Один Preycoins = одному российскому рублю.
      </p>
      <p class="mb-4">
        В профиле вашего аккаунта есть <span class="text-yellow-400">Progress Bar</span>. Зайдите туда и посмотрите. Вы начинаете зарабатывать Preycoins с вашего первого статуса <span class="text-pink-400">New User</span>. Каждый ваш пост в любой категории форума стоит <span class="text-yellow-400">1 Preycoins</span>.
      </p>
      <p class="mb-4">
        Первый шаг — самая сложная часть пути. Когда вы набираете <span class="text-yellow-400">200 Preycoins</span>, вы можете активировать свою первую карточку и получить небольшие бонусы. Дальше будет легче!
      </p>
      <ul class="space-y-4 text-base">
        <li class="flex items-start gap-2">
          <star-icon class="w-5 h-5 text-pink-400 flex-shrink-0" />
          <span>Статус <span class="text-pink-400">User</span>: до второй карточки вам нужно набрать <span class="text-yellow-400">700 Preycoins</span>. Теперь у вас есть доступ к уникальным темам, где каждая тема стоит <span class="text-yellow-400">20 Preycoins</span>, а обычная — <span class="text-yellow-400">10 Preycoins</span>.</span>
        </li>
        <li class="flex items-start gap-2">
          <star-icon class="w-5 h-5 text-pink-400 flex-shrink-0" />
          <span>Статус <span class="text-pink-400">Moderator</span> (<span class="text-yellow-400">1000 Preycoins</span>): вы получаете бонусы модератора. Обычные посты стоят <span class="text-yellow-400">20 Preycoins</span>, а в уникальных категориях — <span class="text-yellow-400">30 Preycoins</span>.</span>
        </li>
        <li class="flex items-start gap-2">
          <star-icon class="w-5 h-5 text-pink-400 flex-shrink-0" />
          <span>Статус <span class="text-pink-400">Teacher</span> (<span class="text-yellow-400">1000 Preycoins</span>): вы получаете бонусы + <span class="text-yellow-400">5000 рублей</span> за 12 ч/месяц помощи администрации. Гибкий график по вашему календарю.</span>
        </li>
        <li class="flex items-start gap-2">
          <star-icon class="w-5 h-5 text-pink-400 flex-shrink-0" />
          <span>Статус <span class="text-pink-400">Administrator</span> (<span class="text-yellow-400">1700 Preycoins</span>): вы получаете бонусы + <span class="text-yellow-400">15,000 рублей</span> за 150 мин/месяц помощи команде разработчиков. Гибкий график, работа 25 минут в неделю в админ-панели.</span>
        </li>
      </ul>
      <p class="mt-6">
        Все деньги за вашу работу выводятся на банковскую карту. Если вы ответственно выполняете обязанности, мы гарантируем обещанные бонусы из карточек <span class="text-pink-400">User</span>, <span class="text-pink-400">Moderator</span>, <span class="text-pink-400">Teacher</span> и <span class="text-pink-400">Administrator</span>.
      </p>
      <p class="mt-4 italic text-gray-300">
        Если вы решите просто пользоваться форумом без активации карточек, наш негласный договор приостанавливается до даты, когда вы решите возобновить работу.
      </p>
    </div>

    <div class="fixed top-4 right-4 bg-gray-800/80 backdrop-blur-sm p-8 rounded-lg text-white">
      Ваш баланс: <span class="text-yellow-400 font-bold">
        <br>
        {{ userBalance }}
      </span> Preycoins

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { StarIcon as star } from '@heroicons/vue/24/solid';
import { UserIcon as user } from '@heroicons/vue/24/solid';
import { ShieldCheckIcon as shieldCheck } from '@heroicons/vue/24/solid';
import { BookOpenIcon as bookOpen } from '@heroicons/vue/24/solid';
import { Cog8ToothIcon as cog8Tooth } from '@heroicons/vue/24/solid';

// Инициализация store
const store = useStore();

// Подключение геттера createdPosts из progress.js
const createdPosts = computed(() => store.getters['progress/getCreatedPosts']);
// Приравниваем userBalance к createdPosts
const userBalance = computed(() => store.getters['progress/getCreatedPosts']);

// Функция активации карточки
const activateCard = (card) => {
  store.dispatch('activateCard', card);
};

// Данные карточек
const cards = ref([
  {
    title: 'User',
    cost: 200,
    requiredBalance: 200,
    icon: user,
    benefits: [
      'Уникальный стикерпак с аниме-героями',
      'Доступ к уникальным темам (10 Preycoin/тема)',
      'Лимит символов увеличен в посте в два раза'
    ]
  },
  {
    title: 'Moderator',
    cost: 700,
    requiredBalance: 700,
    icon: shieldCheck,
    benefits: [
      'Все преимущества User',
      'Обычные посты: 10 Preycoins',
      'Уникальные темы: 25 Preycoins',
      'Возможность вывода 700 Preycoins на карту'
    ]
  },
  {
    title: 'Teacher',
    cost: 1000,
    requiredBalance: 1000,
    icon: bookOpen,
    benefits: [
      'Все преимущества User и Moderator',
      'Уникальные темы: 35 Preycoins',
      'Гибкий график (12ч/мес через Zoom)',
      'Фиксированная зарплата 5000₽/мес',
    ]
  },
  {
    title: 'Administrator',
    cost: 1800,
    requiredBalance: 1800,
    icon: cog8Tooth,
    benefits: [
      'Доступ к админ-панели',
      'Контроль порядка',
      'Зарплата 15,000₽/мес',
      'Работа 150 мин/месяц (20 мин в неделю)'
    ]
  }
]);
</script>

<style scoped>
.font-anime {
  font-family: 'Anime Ace', sans-serif;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bg-anime-pattern {
  background-image: url('https://i.pinimg.com/originals/5e/5b/5e/5e5b5e0a6f1b2c3d4e5f6a7b8c9d0e1f.jpg');
  background-size: cover;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>