import { createStore } from 'vuex';

export default {
  namespaced: true,
  state() {
    return {
      userBalance: 0 // Initial user balance
    };
  },
  mutations: {
    SET_BALANCE(state, amount) {
      state.userBalance = amount;
    },
    DECREASE_BALANCE(state, amount) {
      state.userBalance -= amount;
    },
    INCREASE_BALANCE(state, amount) {
      state.userBalance += amount;
    },
  },
  actions: {
    setBalance({ commit }, amount) {
      commit('SET_BALANCE', amount);
    },
    activateCard({ commit, state, dispatch }, card) {
      if (state.userBalance >= card.cost) {
        commit('DECREASE_BALANCE', card.cost);
        dispatch('progress/updateRoleBasedOnCard', card.title, { root: true });
      } else {
        alert('Not enough Preycoin to activate!');
      }
    },
    addPreycoinForPost({ commit, rootState }, { isUniqueCategory }) {
      const userRole = rootState.profile.profile.role || 'New User';
      let preycoinAmount;

      switch (userRole) {
        case 'New User':
          preycoinAmount = 1; // Only 1 Preycoin for New User, regardless of category
          break;
        case 'User':
          preycoinAmount = isUniqueCategory ? 20 : 10;
          break;
        case 'Moderator':
          preycoinAmount = isUniqueCategory ? 30 : 20;
          break;
        case 'Teacher':
          preycoinAmount = isUniqueCategory ? 40 : 30;
          break;
        default: // Other roles (e.g., Administrator)
          preycoinAmount = isUniqueCategory ? 40 : 30; // Same as Teacher
          break;
      }

      commit('INCREASE_BALANCE', preycoinAmount);
    },
  },
  getters: {
    userBalance(state) {
      return state.userBalance;
    },
  },
};