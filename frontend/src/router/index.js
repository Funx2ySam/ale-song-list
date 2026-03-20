import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'index',
      component: () => import('../views/IndexPage.vue')
    },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      beforeEnter: (to, from, next) => {
        const token = sessionStorage.getItem('admin_token')
        if (!token) {
          next('/')
        } else {
          next()
        }
      },
      children: [
        { path: '', name: 'admin-overview', component: () => import('../views/admin/OverviewPage.vue') },
        { path: 'profile', name: 'admin-profile', component: () => import('../views/admin/ProfilePage.vue') },
        { path: 'tags', name: 'admin-tags', component: () => import('../views/admin/TagsPage.vue') },
        { path: 'songs', name: 'admin-songs', component: () => import('../views/admin/SongsPage.vue') },
        { path: 'site-settings', name: 'admin-site-settings', component: () => import('../views/admin/SiteSettingsPage.vue') },
        { path: 'security', name: 'admin-security', component: () => import('../views/admin/SecurityPage.vue') }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

export default router
