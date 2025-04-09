import narutoImg from '@/assets/images/naruto.png';
import narutoImg from '@/assets/images/naruto.png';
import narutoImg from '@/assets/images/naruto.png';
import narutoImg from '@/assets/images/naruto.png';
import narutoImg from '@/assets/images/naruto.png';
import narutoImg from '@/assets/images/naruto.png';
import luffyImg from '@/assets/images/luffy.png';
import leviImg from '@/assets/images/levi.png';
import gokuImg from '@/assets/images/goku.png';
import sailorMoonImg from '@/assets/images/sailor-moon.png';
import { useToast } from 'vue-toastification';

const toast = useToast();

const state = {
  totalPreycoins: 1800, // Maximum Preycoins for progress
  milestones: [
    { name: 'New User', preycoins: 0, image: narutoImg, position: 0 },
    { name: 'User', preycoins: 200, image: luffyImg, position: 25 },
    { name: 'Moderator', preycoins: 700, image: leviImg, position: 50 },
    { name: 'Teacher', preycoins: 1000, image: sailorMoonImg, position: 75 },
    { name: 'Administrator', preycoins: 1800, image: gokuImg, position: 100 },
  ],
};

const mutations = {
  // No mutations needed since balance is managed in earn.js
};

const actions = {
  async incrementPosts({ dispatch, rootState }, { isUniqueCategory }) {
    const userRole = rootState.profile.profile?.role || 'New User';
    if (userRole === 'New User' && isUniqueCategory) {
      toast.error('New User does not have access to unique categories!');
      return;
    }
    console.log(`progress.js: Incrementing posts, isUniqueCategory: ${isUniqueCategory}`);
    await dispatch('earn/addPreycoinForPost', { isUniqueCategory }, { root: true });
    await dispatch('updateRoleAndNotify', rootState.earn.userBalance);
  },
  async setPosts({ dispatch }, count) {
    await dispatch('earn/setBalance', count, { root: true });
    await dispatch('updateRoleAndNotify', count);
  },
  async resetProgress({ dispatch }) {
    await dispatch('earn/setBalance', 0, { root: true });
    await dispatch('updateRoleAndNotify', 0);
  },
  async updateRoleAndNotify({ state, rootState, dispatch }, newPreycoinCount) {
    const userId = rootState.auth.user?.uid;
    if (!userId) {
      console.warn('progress.js: User not authorized for status update');
      return;
    }

    const newMilestone = state.milestones.find(
      (m) => newPreycoinCount >= m.preycoins && newPreycoinCount < (state.milestones[state.milestones.indexOf(m) + 1]?.preycoins || Infinity)
    ) || state.milestones[0];

    if (newMilestone && newMilestone.name !== rootState.profile.profile.role) {
      console.log(`progress.js: Reached milestone ${newMilestone.name} at ${newPreycoinCount} Preycoins, updating role`);
      await dispatch('profile/updateRole', { userId, role: newMilestone.name }, { root: true });
      toast.success(`Congratulations! You reached the ${newMilestone.name} role with ${newPreycoinCount} Preycoins!`);
    }
  },
  async updateRoleBasedOnCard({ rootState, dispatch }, role) {
    const userId = rootState.auth.user?.uid;
    if (!userId) {
      console.warn('progress.js: User not authorized for role update');
      return;
    }
    await dispatch('profile/updateRole', { userId, role }, { root: true });
    console.log(`progress.js: Role updated to ${role} based on activated card`);
  },
  initializeProgress({ dispatch, state, rootState }) {
    const userId = rootState.auth.user?.uid;
    if (userId) {
      const currentMilestone = state.milestones.find(
        (m) => rootState.earn.userBalance >= m.preycoins && rootState.earn.userBalance < (state.milestones[state.milestones.indexOf(m) + 1]?.preycoins || Infinity)
      ) || state.milestones[0];
      if (currentMilestone && currentMilestone.name !== rootState.profile.profile.role) {
        dispatch('profile/updateRole', { userId, role: currentMilestone.name }, { root: true });
      }
    }
  },
};

const getters = {
  getProgress(state, getters, rootState) {
    const currentBalance = rootState.earn.userBalance || 0;
    const currentMilestone = state.milestones.find(
      (m) => currentBalance >= m.preycoins && currentBalance < (state.milestones[state.milestones.indexOf(m) + 1]?.preycoins || Infinity)
    ) || state.milestones[0];
    const nextMilestone = state.milestones[state.milestones.indexOf(currentMilestone) + 1];

    if (!nextMilestone) return 100;

    const preycoinsInRange = currentBalance - currentMilestone.preycoins;
    const totalRange = nextMilestone.preycoins - currentMilestone.preycoins;
    const positionRange = nextMilestone.position - currentMilestone.position;

    const progressInRange = (preycoinsInRange / totalRange) * positionRange;
    return Math.min(currentMilestone.position + progressInRange, 100);
  },
  getCurrentMilestone(state, getters, rootState) {
    const currentBalance = rootState.earn.userBalance || 0;
    const next = state.milestones.find((m) => currentBalance < m.preycoins) || state.milestones[state.milestones.length - 1];
    return state.milestones[state.milestones.indexOf(next) - 1] || state.milestones[0];
  },
  getNextMilestone(state, getters, rootState) {
    const currentBalance = rootState.earn.userBalance || 0;
    return state.milestones.find((m) => currentBalance < m.preycoins) || state.milestones[state.milestones.length - 1];
  },
  getMilestones(state) {
    return state.milestones;
  },
  getPreycoinBalance(state, getters, rootState) {
    return rootState.earn.userBalance || 0;
  },
  getMilestoneProgress: (state, getters, rootState) => (index) => {
    if (index >= state.milestones.length - 1) return 100;

    const currentMilestone = state.milestones[index];
    const nextMilestone = state.milestones[index + 1];
    const preycoinsInRange = rootState.earn.userBalance - currentMilestone.preycoins;
    const totalRange = nextMilestone.preycoins - currentMilestone.preycoins;

    return Math.min(Math.max((preycoinsInRange / totalRange) * 100, 0), 100);
  },
  canAccessUniqueCategories: (state, getters, rootState) => {
    const userRole = rootState.profile.profile?.role || 'New User';
    const isAuthenticated = !!rootState.auth.user;
    const allowedRoles = ['User', 'Moderator', 'Teacher', 'Administrator'];
    return isAuthenticated && allowedRoles.includes(userRole);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};