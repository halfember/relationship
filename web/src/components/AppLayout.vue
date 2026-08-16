<template>
  <t-layout class="h-screen">
    <!-- Sidebar -->
    <t-aside :width="sidebarCollapsed ? '64px' : '220px'" class="sidebar-transition">
      <div class="flex flex-col h-full bg-white border-r border-gray-100">
        <!-- Logo -->
        <div class="flex items-center h-16 px-4 border-b border-gray-100 gap-3" :class="sidebarCollapsed ? 'justify-center' : ''">
          <span class="brand-mark flex-shrink-0">与</span>
          <span v-if="!sidebarCollapsed" class="text-lg font-bold whitespace-nowrap text-gray-800">与你桌面版</span>
        </div>

        <!-- Menu -->
        <div class="flex-1 py-3 px-2">
          <div
            v-for="item in menuItems"
            :key="item.path"
            class="menu-item"
            :class="{ active: isActive(item.path) }"
            @click="navigate(item.path)"
          >
            <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <component :is="item.iconComp" />
            </span>
            <span v-if="!sidebarCollapsed" class="ml-3 whitespace-nowrap">{{ item.title }}</span>
          </div>
        </div>

        <!-- Collapse Button -->
        <div class="p-3 border-t border-gray-100">
          <t-button
            variant="text"
            shape="square"
            size="medium"
            block
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <template #icon>
              <ChevronLeftIcon v-if="!sidebarCollapsed" />
              <ChevronRightIcon v-else />
            </template>
          </t-button>
        </div>
      </div>
    </t-aside>

    <!-- Main Content -->
    <t-layout>
      <!-- Header -->
      <t-header class="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-semibold text-gray-800">{{ currentTitle }}</h2>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">用户 {{ userId }}</span>
            <t-button variant="text" shape="square" title="退出登录" @click="logout"><LogoutIcon /></t-button>
          </div>
        </div>
      </t-header>

      <!-- Page Content -->
      <t-content class="p-6 overflow-auto flex-1 bg-gray-50">
        <router-view />
      </t-content>
    </t-layout>
  </t-layout>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  DashboardIcon,
  UsergroupIcon,
  CalendarIcon,
  BookmarkIcon,
  NotificationIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogoutIcon,
} from 'tdesign-icons-vue-next'
import { clearAccessToken, requireCurrentUserId } from '@/auth/session'

const router = useRouter()
const route = useRoute()

const sidebarCollapsed = ref(false)
const userId = requireCurrentUserId()

const menuItems = [
  { path: 'dashboard', title: '数据总览', iconComp: DashboardIcon },
  { path: 'relationships', title: '关系管理', iconComp: UsergroupIcon },
  { path: 'events', title: '纪念日', iconComp: CalendarIcon },
  { path: 'memories', title: '回忆记录', iconComp: BookmarkIcon },
  { path: 'reminders', title: '提醒列表', iconComp: NotificationIcon },
]

const currentTitle = computed(() => {
  const r = menuItems.find((m) => route.path.includes(m.path))
  return r ? r.title : '与你桌面版'
})

function isActive(path: string) {
  return route.path.includes(path)
}

function navigate(path: string) {
  router.push(`/${path}`)
}

function logout() {
  clearAccessToken()
  router.replace('/login')
}
</script>

<style scoped>
.sidebar-transition {
  transition: width 0.25s ease;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  color: #555;
  font-size: 14px;
  transition: all 0.15s ease;
}

.menu-item:hover {
  background: #f0f5f2;
  color: #315c4d;
}

.menu-item.active {
  background: #e7f0eb;
  color: #315c4d;
  font-weight: 600;
}

.brand-mark {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #315c4d;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}
</style>
