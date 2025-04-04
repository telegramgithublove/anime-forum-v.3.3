// earn.js
import { createStore } from 'vuex'

export default {
  namespaced: true,
  state() {
    return {
      userBalance: 0 // Начальный баланс пользователя
    }
  },
  mutations: {
    SET_BALANCE(state, amount) {
      state.userBalance = amount
    },
    DECREASE_BALANCE(state, amount) {
      state.userBalance -= amount
    },
    INCREASE_BALANCE(state, amount) {
      state.userBalance += amount
    }
  },
  actions: {
    activateCard({ commit, state }, card) {
      if (state.userBalance >= card.cost) {
        commit('DECREASE_BALANCE', card.cost)
        alert(`Карточка ${card.title} успешно активирована!`)
        // Здесь можно добавить дополнительную логику активации
      } else {
        alert('Недостаточно Preycoin для активации!')
      }
    },
    addPreycoin({ commit }, amount) {
      commit('INCREASE_BALANCE', amount)
    }
  },
  getters: {
    userBalance(state) {
      return state.userBalance
    }
  }
};