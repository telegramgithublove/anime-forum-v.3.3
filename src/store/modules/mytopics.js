import { database } from '@/plugins/firebase';
import { ref, get, push, set, remove } from 'firebase/database';

export default {
  namespaced: true,
  state: {
    userPosts: []
  },
  mutations: {
    SET_USER_POSTS(state, posts) {
      state.userPosts = posts;
    },
    ADD_USER_POST(state, post) {
      state.userPosts.push(post);
    },
    REMOVE_USER_POST(state, postId) {
      state.userPosts = state.userPosts.filter(post => post.id !== postId);
    }
  },
  actions: {
    async createUserPost({ commit, rootState }, postData) {
      try {
        const userId = rootState.auth.user?.uid;
        if (!userId) throw new Error('Пользователь не авторизован');
    
        const postsRef = ref(database, 'posts');
        const newPostRef = push(postsRef);
        const postId = newPostRef.key;
    
        const post = {
          ...postData,
          id: postId,
          authorId: userId,
          userId,
          createdAt: postData.createdAt || new Date().toISOString(),
          authorName: postData.authorName, // Используем переданный authorName
          authorAvatar: postData.authorAvatar || '/image/empty_avatar.png',
          likes: postData.likes || {},
          likesCount: postData.likesCount || 0,
          views: postData.views || 0,
          comments: postData.comments || {}
        };
    
        await set(newPostRef, post);
        commit('ADD_USER_POST', post);
        console.log('mytopics.js - Пост создан:', post);
        return postId;
      } catch (error) {
        console.error('mytopics.js - Ошибка при создании поста:', error);
        throw error;
      }
    },
    async fetchUserPosts({ commit, rootState }) {
      try {
        const userId = rootState.auth.user?.uid;
        if (!userId) throw new Error('Пользователь не авторизован');

        const postsRef = ref(database, 'posts');
        const snapshot = await get(postsRef);

        console.log('mytopics.js - Данные из Firebase:', snapshot.val());

        if (snapshot.exists()) {
          const allPosts = snapshot.val();
          const userPosts = Object.keys(allPosts)
            .filter(postId => allPosts[postId].userId === userId)
            .map(postId => ({
              id: postId,
              ...allPosts[postId]
            }));
          
          console.log('mytopics.js - Отфильтрованные посты пользователя:', userPosts);
          const posts = userPosts.reverse();
          console.log('Fetched user posts:', posts);
          commit('SET_USER_POSTS', posts);
        } else {
          console.log('mytopics.js - Постов не найдено');
          commit('SET_USER_POSTS', []);
        }
      } catch (error) {
        console.error('mytopics.js - Ошибка при загрузке постов:', error);
        throw error;
      }
    },
    async deleteUserPost({ commit }, postId) {
      try {
        const postRef = ref(database, `posts/${postId}`);
        await remove(postRef);
        commit('REMOVE_USER_POST', postId);
      } catch (error) {
        console.error('Ошибка при удалении поста:', error);
        throw error;
      }
    }
  },
  getters: {
    getUserPosts(state) {
      return state.userPosts;
    }
  }
};