import { createRouter, createWebHistory } from 'vue-router'
import { hasValidAccessToken } from '@/auth/session'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/Login.vue'),
      meta: { public: true, title: '登录' },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/',
      component: () => import('@/components/AppLayout.vue'),
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/pages/Dashboard.vue'),
          meta: { title: '数据总览', icon: 'dashboard' },
        },
        {
          path: 'relationships',
          name: 'Relationships',
          component: () => import('@/pages/relationships/List.vue'),
          meta: { title: '关系管理', icon: 'usergroup' },
        },
        {
          path: 'relationships/:id',
          name: 'RelationshipDetail',
          component: () => import('@/pages/relationships/Detail.vue'),
          meta: { title: '关系详情', hidden: true },
        },
        {
          path: 'events',
          name: 'Events',
          component: () => import('@/pages/events/List.vue'),
          meta: { title: '纪念日', icon: 'calendar' },
        },
        {
          path: 'memories',
          name: 'Memories',
          component: () => import('@/pages/memories/List.vue'),
          meta: { title: '回忆记录', icon: 'bookmark' },
        },
        {
          path: 'reminders',
          name: 'Reminders',
          component: () => import('@/pages/reminders/List.vue'),
          meta: { title: '提醒列表', icon: 'notification' },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const authenticated = hasValidAccessToken()
  if (to.meta.public) return authenticated ? '/dashboard' : true
  if (!authenticated) return { path: '/login', query: { redirect: to.fullPath } }
  return true
})

export default router
