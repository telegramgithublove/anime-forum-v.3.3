<template>
  <div class="auth-container">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Загрузка...</p>
    </div>
    <div v-else>
      <div v-if="currentUser" class="user-info">
        <h2>Добро пожаловать, {{ currentUser.email }}</h2>
        <div v-if="!currentUser.emailVerified" class="verification-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Ваш email не подтвержден</p>
          <SendEmailVerification />
        </div>
        <div v-else class="verification-success">
          <i class="fas fa-check-circle"></i>
          <p>Email подтвержден</p>
        </div>
        <button @click="handleLogout" class="logout-button">
          <i class="fas fa-sign-out-alt"></i>
          Выйти
        </button>
      </div>
      <div v-else>
        <component 
          :is="currentForm" 
          @switch-to-register="switchForm('RegisterForm')" 
          @switch-to-login="switchForm('LoginForm')" 
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { auth } from '../store/modules/auth'; // Используем auth из auth.js
import { getDatabase, ref as dbRef, update } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';
import LoginForm from '../auth/Login.vue';
import RegisterForm from '../auth/Registration.vue';
import SendEmailVerification from '../auth/SendEmailVerification.vue';

export default {
  name: 'GetAuth',
  components: {
    LoginForm,
    RegisterForm,
    SendEmailVerification
  },
  setup() {
    const store = useStore();
    const loading = ref(true);
    const currentForm = ref('LoginForm');
    const database = getDatabase();

    const currentUser = computed(() => store.getters['auth/currentUser']);
    const isEmailVerified = computed(() => store.getters['auth/isEmailVerified']);

    const updateUserStatus = async (user) => {
      if (!user?.uid) return;

      const updates = {
        lastLogin: new Date().toISOString(),
        emailVerified: user.emailVerified,
        status: 'online'
      };

      try {
        await update(dbRef(database, `users/${user.uid}`), updates);
        await axios.patch(
          `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${user.uid}.json`,
          updates
        );
        store.dispatch('auth/setUser', {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          ...updates
        });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    };

    onMounted(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          await user.reload();
          await updateUserStatus(user);
        } else {
          store.commit('auth/SET_USER', null);
          store.commit('auth/SET_AUTHENTICATED', false);
          store.commit('auth/SET_TOKEN', null);
        }
        loading.value = false;
      });

      return () => unsubscribe();
    });

    const handleLogout = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          await update(dbRef(database, `users/${user.uid}`), {
            status: 'offline',
            lastLogout: new Date().toISOString()
          });
        }
        await store.dispatch('auth/logout');
      } catch (error) {
        console.error('Ошибка при выходе:', error);
      }
    };

    const switchForm = (formName) => {
      currentForm.value = formName;
    };

    return {
      loading,
      currentUser,
      isEmailVerified,
      currentForm,
      handleLogout,
      switchForm
    };
  }
};
</script>

<style scoped>
.auth-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 20px;
  color: #2196F3;
}

.user-info {
  text-align: center;
}

.user-info h2 {
  color: #333;
  margin-bottom: 20px;
}

.verification-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 15px;
  margin: 15px 0;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.verification-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 15px;
  margin: 15px 0;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.verification-warning i,
.verification-success i {
  font-size: 24px;
  margin-bottom: 5px;
}

.logout-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.loading .fa-spinner {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>