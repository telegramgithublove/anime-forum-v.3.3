// progress.js
import narutoImg from '@/assets/images/naruto.png';
import luffyImg from '@/assets/images/luffy.png';
import leviImg from '@/assets/images/levi.png';
import gokuImg from '@/assets/images/goku.png';
import sailorMoonImg from '@/assets/images/sailor-moon.png';

const state = {
  createdPosts: parseInt(localStorage.getItem('userCreatedPosts') || '0'),
  totalPosts: 18000,
  milestones: [
    { name: 'New User', posts: 0, image: narutoImg, position: 0 },
    { name: 'User', posts: 200, image: luffyImg, position: 25 },
    { name: 'Moderator', posts: 700, image: leviImg, position: 42 },
    { name: 'Teacher', posts: 1000, image: sailorMoonImg, position: 65 },
    { name: 'Administrator', posts: 1800, image: gokuImg, position: 100 },
  ],
};

const mutations = {
  INCREMENT_POSTS(state) {
    state.createdPosts += 1;
    localStorage.setItem('userCreatedPosts', state.createdPosts.toString());
  },
  SET_POSTS(state, count) {
    state.createdPosts = count;
    localStorage.setItem('userCreatedPosts', count.toString());
  },
};

const actions = {
  async incrementPosts({ commit, dispatch, state }) {
    commit('INCREMENT_POSTS');
    await dispatch('updateRoleAndNotify', state.createdPosts);
  },
  async setPosts({ commit, dispatch, state }, count) {
    commit('SET_POSTS', count);
    await dispatch('updateRoleAndNotify', count);
  },
  async resetProgress({ commit, dispatch }) {
    commit('SET_POSTS', 0);
    await dispatch('updateRoleAndNotify', 0);
  },
  async updateRoleAndNotify({ state, rootState, dispatch }, newPostCount) {
    const userId = rootState.auth.user?.uid;
    if (!userId) {
      console.warn('progress.js: Пользователь не авторизован для обновления статуса');
      return;
    }

    const newMilestone = state.milestones.find(
      (m) => newPostCount >= m.posts && newPostCount < (state.milestones[state.milestones.indexOf(m) + 1]?.posts || Infinity)
    ) || state.milestones[0];

    if (newMilestone && newMilestone.name !== rootState.profile.profile.role) {
      console.log(`progress.js: Достигнута веха ${newMilestone.name} при ${newPostCount} постах, обновляем роль`);
      await dispatch('profile/updateRole', { userId, role: newMilestone.name }, { root: true });
    }
  },
  initializeProgress({ commit, dispatch, state, rootState }) {
    const savedPosts = localStorage.getItem('userCreatedPosts');
    if (savedPosts) {
      commit('SET_POSTS', parseInt(savedPosts));
    }
    const userId = rootState.auth.user?.uid;
    if (userId) {
      const currentMilestone = state.milestones.find(
        (m) => state.createdPosts >= m.posts && state.createdPosts < (state.milestones[state.milestones.indexOf(m) + 1]?.posts || Infinity)
      ) || state.milestones[0];
      if (currentMilestone && currentMilestone.name !== rootState.profile.profile.role) {
        dispatch('profile/updateRole', { userId, role: currentMilestone.name }, { root: true });
      }
    }
  },
};

const getters = {
  getProgress(state) {
    const currentMilestone = state.milestones.find(
      (m) => state.createdPosts >= m.posts && state.createdPosts < (state.milestones[state.milestones.indexOf(m) + 1]?.posts || Infinity)
    ) || state.milestones[0];
    const nextMilestone = state.milestones[state.milestones.indexOf(currentMilestone) + 1];

    if (!nextMilestone) return currentMilestone.position;

    const postsInRange = state.createdPosts - currentMilestone.posts;
    const totalRange = nextMilestone.posts - currentMilestone.posts;
    const positionRange = nextMilestone.position - currentMilestone.position;

    const progressInRange = (postsInRange / totalRange) * positionRange;
    return Math.min(currentMilestone.position + progressInRange, 100);
  },
  getCurrentMilestone(state) {
    const current = state.milestones.find((m) => state.createdPosts < m.posts) || state.milestones[state.milestones.length - 1];
    return state.milestones[state.milestones.indexOf(current) - 1] || state.milestones[0];
  },
  getNextMilestone(state) {
    return state.milestones.find((m) => state.createdPosts < m.posts) || state.milestones[state.milestones.length - 1];
  },
  getMilestones(state) {
    return state.milestones;
  },
  getCreatedPosts(state) {
    return state.createdPosts;
  },
  getMilestoneProgress: (state) => (index) => {
    if (index >= state.milestones.length - 1) return 100;

    const currentMilestone = state.milestones[index];
    const nextMilestone = state.milestones[index + 1];
    const postsInRange = state.createdPosts - currentMilestone.posts;
    const totalRange = nextMilestone.posts - currentMilestone.posts;

    return Math.min(Math.max((postsInRange / totalRange) * 100, 0), 100);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};