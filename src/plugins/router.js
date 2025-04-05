import { createRouter, createWebHistory } from 'vue-router';
import { getAuth } from 'firebase/auth';
import store from '../store/store';

// Импорты компонентов (оставляем без изменений)
import AddTopic from '../views/AddTopic.vue';
import CategoryPosts from '../views/CategoryPosts.vue';
import PostList from '../views/PostList.vue';
import Thread from '../views/Thread.vue';
import AdminSetup from '../views/AdminSetup.vue';
import TopicDetails from '../views/TopicDetails.vue';
import ThreadCard from '../views/ThreadCard.vue';
import ThreadList from '../views/ThreadList.vue';
import AdminPanel from '../views/AdminPanel.vue';
import UserManagement from '../views/UserManagement.vue';
import ContentManagement from '../views/ContentManagement.vue';
import Reports from '../views/Reports.vue';
import PostDetails from '../views/PostDetails.vue';
import Settings from '../views/Settings.vue';
import FavoritesPosts from '../views/FavoritesPosts.vue';
import Security from '../views/Security.vue';
import MyTopics from '../views/MyTopics.vue';
import PopularPosts from '../views/PopularPosts.vue';
import LikedPosts from '../views/LikedPosts.vue';
import Registration from '../views/auth/Registration.vue';
import Notification from '../views/auth/Notification.vue';
import VeryfyEmail from '../views/auth/VeryfyEmail.vue';
import SendEmailVerification from '../views/auth/SendEmailVerification.vue';
import EmailVerificationHandler from '../views/auth/EmailVerificationHandler.vue';
import Notifications from '../views/Notifications.vue';
import CreatePost from '../views/CreatePost.vue';
import DiscussedPosts from '../views/DiscussedPosts.vue';
import EarnMoney from '../views/EarnMoney.vue';
const Profile = () => import('../views/profile/Profile.vue');
const CategoryList = () => import('../views/CategoryList.vue');

const routes = [
  {
    path: '/security',
    name: 'Security',
    component: Security,
    meta: { requiresAuth: true, title: 'Безопасность' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Registration',
    component: Registration,
    meta: { requiresGuest: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true, requiresEmailVerified: true, title: 'Настройки' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true, title: 'Профиль пользователя' }
  },
  {
    path: '/favorites',
    name: 'FavoritesPosts',
    component: FavoritesPosts,
    meta: { requiresAuth: true, title: 'Избранные посты' }
  },
  {
    path: '/my-topics',
    name: 'MyTopics',
    component: MyTopics,
    meta: { requiresAuth: true, title: 'Мои темы' }
  },
  {
    path: '/popular-posts',
    name: 'PopularPosts',
    component: PopularPosts,
    meta: { requiresAuth: true, title: 'Популярные посты' }
  },
  {
    path: '/most-discussed-posts',
    name: 'DiscussedPosts',
    component: DiscussedPosts,
    meta: { requiresAuth: true, title: 'Отвеченные посты' }
  },
  {
    path: '/earn',
    name: 'EarnMoney',
    component: EarnMoney,
    meta: { requiresAuth: true, title: 'Заработать деньги' }
  },
  {
    path: '/most-liked-posts',
    name: 'LikedPosts',
    component: LikedPosts,
    meta: { requiresAuth: true, title: 'Понравившиеся посты' }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: Notifications,
    meta: { requiresAuth: true, title: 'Уведомления' }
  },
  {
    path: '/profile/edit',
    name: 'EditProfile',
    component: () => import('../views/profile/EditProfile.vue'),
    meta: { requiresAuth: true, title: 'Редактировать профиль' }
  },
  {
    path: '/profile/settings',
    name: 'ProfileSettings',
    component: () => import('../views/profile/Settings.vue'),
    meta: { requiresAuth: true, title: 'Настройки профиля' }
  },
  {
    path: '/profile/friends',
    name: 'Friends',
    component: () => import('../views/profile/Friends.vue'),
    meta: { requiresAuth: true, title: 'Друзья' }
  },
  {
    path: '/',
    name: 'CategoryList',
    component: CategoryList,
    meta: { requiresAuth: false }
  },
  {
    path: '/category/:categoryId',
    name: 'CategoryPosts',
    component: CategoryPosts,
    props: true,
  },
  {
    path: '/topics/:id',
    name: 'TopicDetails',
    component: TopicDetails,
    props: true,
  },
  {
    path: '/category/:id/addtopic',
    name: 'AddTopic',
    component: AddTopic,
    props: true,
  },
  {
    path: '/post/:id',
    name: 'post-details',
    component: PostDetails,
    meta: { requiresAuth: true, title: 'Просмотр поста' }
  },
  {
    path: '/post/:id/details',
    name: 'PostDetails',
    component: PostDetails,
    props: true,
  },
  {
    path: '/new-post',
    name: 'NewPost',
    component: PostList,
  },
  {
    path: '/post-list',
    name: 'PostList',
    component: PostList,
  },
  {
    path: '/thread',
    name: 'Thread',
    component: Thread,
  },
  {
    path: '/thread-card',
    name: 'ThreadCard',
    component: ThreadCard,
  },
  {
    path: '/thread-list',
    name: 'ThreadList',
    component: ThreadList,
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: UserManagement,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/content-management',
    name: 'ContentManagement',
    component: ContentManagement,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: Reports,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/send-verification',
    name: 'SendVerification',
    component: SendEmailVerification,
    meta: { requiresAuth: true }
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VeryfyEmail
  },
  {
    path: '/email-verification',
    name: 'EmailVerificationHandler',
    component: EmailVerificationHandler,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin-setup',
    name: 'AdminSetup',
    component: AdminSetup
  },
  {
    path: '/friends',
    name: 'Friends',
    component: () => import('../views/Friends.vue'),
    meta: { requiresAuth: true, title: 'Друзья' }
  },
  {
    path: '/category/:categoryId/create',
    name: 'create-post',
    component: () => import('../views/CreatePost.vue'),
    meta: { requiresAuth: true, title: 'Создать пост' }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const auth = getAuth();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  // Ждем инициализации Firebase Auth
  await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });

  const currentUser = auth.currentUser;
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  const isSuperUser = store.getters['auth/isSuperUser'];
  const userRole = localStorage.getItem('userRole');

  console.log('Navigation Guard:', { isAuthenticated, isSuperUser, userRole, path: to.path });

  // Обработка суперпользователя
  if (requiresAdmin && isSuperUser && isAuthenticated) {
    next();
    return;
  }

  // Общая проверка аутентификации
  if (requiresAuth && !currentUser && !isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
    return;
  }

  // Проверка для админских маршрутов
  if (requiresAdmin && !isSuperUser && userRole !== 'admin') {
    next('/');
    return;
  }

  // Если пользователь авторизован и пытается зайти на /login
  if (to.path === '/login' && isAuthenticated) {
    if (isSuperUser) {
      next('/admin');
    } else {
      next('/');
    }
    return;
  }

  next();
});

export default router;