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
    // Активация карточки вручную
    activateCard({ commit, state, dispatch }, card) {
      if (state.userBalance >= card.cost) {
        commit('DECREASE_BALANCE', card.cost)
        alert(`Карточка ${card.title} успешно активирована!`)
        // Связываем с progress.js для обновления роли
        dispatch('progress/updateRoleBasedOnCard', card.title, { root: true })
      } else {
        alert('Недостаточно Preycoin для активации!')
      }
    },
    // Добавление Preycoin и проверка активации карточек
    addPreycoin({ commit, state, dispatch }, amount) {
      commit('INCREASE_BALANCE', amount)
      dispatch('checkAndActivateCards')
    },
    // Проверка и активация карточек автоматически
    checkAndActivateCards({ state, commit, dispatch }) {
      const cardMilestones = [
        { title: 'User', cost: 200, role: 'User' },
        { title: 'Moderator', cost: 700, role: 'Moderator' },
        { title: 'Teacher', cost: 1000, role: 'Teacher' },
        { title: 'Administrator', cost: 1800, role: 'Administrator' }
      ]

      for (const card of cardMilestones) {
        if (state.userBalance >= card.cost) {
          commit('DECREASE_BALANCE', card.cost)
          alert(`Карточка ${card.title} автоматически активирована за ${card.cost} Preycoin!`)
          dispatch('progress/updateRoleBasedOnCard', card.role, { root: true })
          break // Активируем только одну карточку за раз
        }
      }
    }
  },
  getters: {
    userBalance(state) {
      return state.userBalance
    }
  }
}