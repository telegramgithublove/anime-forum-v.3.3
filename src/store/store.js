// store/store.js
import { createStore } from 'vuex';
import authModule from './modules/auth.js';
import topicsModule from './modules/topics.js';
import pictureModule from './modules/picture.js';
import videoModule from './modules/video.js';
import musicModule from './modules/music.js';
import formatModule from './modules/format.js';
import categoriesModule from './modules/categories.js';
import profileModule from './modules/profile.js';
import emojiModule from './modules/emoji.js';
import createModule from './modules/create.js';
import postsModule from './modules/posts.js';
import tegsModule from './modules/tegs.js';
import progressModule from './modules/progress.js';
import commentsModule from './modules/comments.js';
import paginationModule from './modules/pagination.js';
import replyModule  from './modules/reply.js';
import favoritesModule from './modules/favorites.js';
import securityModule from './modules/security.js';
import mytopicsModule from './modules/mytopics.js';
import notificationsModule from './modules/notifications.js';



const store = createStore({
  modules: {
    auth: authModule,
    topics: topicsModule,
    picture: pictureModule,
    video: videoModule,
    music: musicModule,
    format: formatModule,
    categories: categoriesModule,
    profile: profileModule,
    emoji: emojiModule,
    create: createModule,
    posts: postsModule,
    tegs: tegsModule,
    progress: progressModule,
    comments: commentsModule,
    pagination: paginationModule,
    reply: replyModule,
    favorites: favoritesModule,
    security: securityModule,
    mytopics: mytopicsModule,
    notifications: notificationsModule
  }
});

export default store;