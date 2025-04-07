<template>
  <div class="relative w-full h-24 bg-gray-200 rounded-full overflow-hidden shadow-xl border border-gray-300/50">
    <!-- Progress bar -->
    <div
      class="h-full bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-600 transition-all duration-1000 ease-in-out relative shadow-inner"
      :style="{ width: `${progress}%` }"
    >
      <span
        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white font-semibold text-lg drop-shadow-lg tracking-wide"
      >
        {{ currentPreycoinBalance }} Preycoins
      </span>
    </div>

    <!-- Milestones and arrows -->
    <div
      v-for="(milestone, index) in milestones"
      :key="milestone.name"
      class="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center milestone"
      :class="`milestone-${index}`"
      :style="{
        left: milestone.position === 0 ? '1rem' :
              milestone.position === 25 ? '25%' :
              milestone.position === 50 ? '50%' :
              milestone.position === 75 ? '75%' :
              'calc(100% - 7rem)'
      }"
      @animationend="markMilestoneReached(index)"
    >
      <img
        :src="milestone.image"
        class="w-12 h-12 rounded-full border-2 transition-all duration-300 object-cover shadow-md hover:shadow-lg"
        :class="{
          'border-gray-400 opacity-70': !isMilestoneReached(index),
          'border-emerald-500 opacity-100 scale-110': isMilestoneReached(index)
        }"
        :alt="milestone.name"
        @error="handleImageError(index, $event)"
      />
      <span class="text-sm mt-1 text-gray-900 dark:text-gray-100 font-medium drop-shadow-md">
        {{ milestone.name }}
      </span>

      <!-- Right arrow (except for the last milestone) -->
      <svg
        v-if="index < milestones.length - 1"
        class="absolute arrow"
        :style="{
          left: 'calc(100% + 0.5rem)',
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${calculateArrowWidth(index)}px`,
          height: '16px'
        }"
        viewBox="0 0 24 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 6H20M20 6L15 1M20 6L15 11"
          stroke="#6b7280"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import anime from 'animejs/lib/anime.es.js';
import 'animate.css';
import emptyFolderImg from '@/assets/images/empty-folder.png';
import { useToast } from 'vue-toastification';

const store = useStore();
const toast = useToast();

const progress = computed(() => store.getters['progress/getProgress'] || 0);
const milestones = computed(() => store.getters['progress/getMilestones'] || []);
const currentPreycoinBalance = computed(() => store.getters['earn/userBalance'] || 0);

const wasMilestoneReached = ref([]);

const isMilestoneReached = (index) => {
  return currentPreycoinBalance.value >= (milestones.value[index]?.preycoins || 0);
};

const markMilestoneReached = (index) => {
  if (isMilestoneReached(index) && !wasMilestoneReached.value[index]) {
    wasMilestoneReached.value[index] = true;
    anime({
      targets: `.milestone-${index} img`,
      scale: [1, 1.3, 1],
      rotate: '360deg',
      duration: 1000,
      easing: 'easeInOutCubic',
      elasticity: 300,
    });
    toast.success(`Congrats! You've reached ${milestones.value[index].name} with ${currentPreycoinBalance.value} Preycoins!`);
  }
};

watch(currentPreycoinBalance, (newValue) => {
  milestones.value.forEach((milestone, index) => {
    if (newValue >= milestone.preycoins && !wasMilestoneReached.value[index]) {
      setTimeout(() => {
        markMilestoneReached(index);
      }, 200);
    }
  });
});

onMounted(() => {
  store.dispatch('progress/initializeProgress');
  milestones.value.forEach((milestone, index) => {
    if (currentPreycoinBalance.value >= milestone.preycoins) {
      wasMilestoneReached.value[index] = true;
    }
  });
});

const calculateArrowWidth = (index) => {
  if (index >= milestones.value.length - 1) return 0;

  const container = document.querySelector('.relative');
  const containerWidth = container ? container.offsetWidth : window.innerWidth;

  const currentPosition = milestones.value[index].position;
  const nextPosition = milestones.value[index + 1].position;

  const currentLeft = currentPosition === 0 ? 16 : (containerWidth * currentPosition) / 100;
  const nextLeft = nextPosition === 100 ? containerWidth - 112 : (containerWidth * nextPosition) / 100;

  const arrowWidth = nextLeft - currentLeft - 64;
  return Math.max(arrowWidth, 24);
};

const handleImageError = (index, event) => {
  console.error(`Error loading image for ${milestones.value[index]?.name || 'unknown'}:`, event);
  event.target.src = emptyFolderImg;
};

watch(milestones, (newMilestones) => {
  if (!newMilestones || !Array.isArray(newMilestones)) {
    console.warn('New milestones are invalid:', newMilestones);
    wasMilestoneReached.value = [];
    return;
  }
  wasMilestoneReached.value = newMilestones.map((milestone) => currentPreycoinBalance.value >= (milestone?.preycoins || 0));
}, { deep: true });
</script>

<style scoped>
.animate-pulse {
  animation: pulse 1.5s infinite;
}

img {
  transition: transform 0.3s ease, opacity 0.3s ease, scale 0.3s ease;
}

img:hover {
  transform: scale(1.2);
  z-index: 20;
}

.bg-gradient-to-r {
  background: linear-gradient(to right, #34d399, #60a5fa, #c084fc);
}

.rounded-full {
  border-radius: 9999px;
}

.drop-shadow-lg {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
}

.drop-shadow-md {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.shadow-xl {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.shadow-inner {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bg-gray-200 {
  background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
}

.hover\:shadow-lg:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
}

.arrow {
  z-index: 10;
}

.arrow path {
  stroke: #6b7280;
  transition: stroke 0.3s ease;
}

.milestone:hover .arrow path {
  stroke: #10b981;
}

.milestone img {
  position: relative;
  z-index: 1;
}

.milestone:hover img {
  z-index: 30;
}
</style>