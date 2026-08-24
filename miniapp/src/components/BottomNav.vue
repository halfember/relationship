<template>
  <view class="bottom-nav">
    <view v-for="item in items" :key="item.key" class="nav-item" :class="{ active: active === item.key }" @tap="go(item)">
      <view class="nav-glyph">
        <text>{{ item.icon }}</text>
        <text v-if="item.badge" class="nav-badge">{{ item.badge }}</text>
      </view>
      <text class="nav-label">{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { openContactCreationMenu } from '@/utils/contactCreation.js';

const props = defineProps({
  active: { type: String, default: 'home' },
  reminderCount: { type: Number, default: 0 },
});
const items = computed(() => [
  { key: 'home', label: '此刻', icon: '今', url: '/pages/index/index' },
  { key: 'relationships', label: '关系', icon: '人', url: '/pages/relationship/list' },
  { key: 'create', label: '添加', icon: '＋' },
  { key: 'reminders', label: '日历', icon: '日', url: '/pages/reminder/list', badge: props.reminderCount > 99 ? '99+' : props.reminderCount || '' },
  { key: 'profile', label: '我的', icon: '我', url: '/pages/profile/index' },
]);
const navigating = ref(false);
const go = item => {
  if (navigating.value) return;
  if (item.key === 'create') return openContactCreationMenu();
  const pages = getCurrentPages();
  if (`/${pages[pages.length - 1]?.route}` === item.url) return;
  // 主导航需要清理旧页面栈，避免真机调试时页面栈状态导致 wx://not-found。
  navigating.value = true;
  uni.reLaunch({ url: item.url, fail: () => { navigating.value = false; } });
};
</script>

<style scoped>
.bottom-nav { position:fixed;z-index:50;left:0;right:0;bottom:0;height:calc(128rpx + env(safe-area-inset-bottom));padding:8rpx 10rpx env(safe-area-inset-bottom);display:grid;grid-template-columns:repeat(5,1fr);background:rgba(255,255,255,.98);border-top:1rpx solid #e2e4df;box-sizing:border-box; }
.nav-item { position:relative;height:112rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8a908c; }.nav-glyph { position:relative;width:52rpx;height:52rpx;display:flex;align-items:center;justify-content:center;font-size:34rpx;font-weight:650; }.nav-label { margin-top:4rpx;font-size:26rpx;line-height:34rpx; }.nav-item.active { color:#315c4d; }.nav-item.active::before { content:'';position:absolute;top:2rpx;width:6rpx;height:6rpx;border-radius:50%;background:#315c4d; }.nav-badge { position:absolute;top:-7rpx;right:-18rpx;min-width:30rpx;height:30rpx;padding:0 6rpx;border:3rpx solid #fff;border-radius:15rpx;background:#c76755;color:#fff;font-size:26rpx;line-height:30rpx;text-align:center; }
.nav-item:nth-child(3) .nav-glyph { width:72rpx;height:72rpx;border-radius:50%;background:#315c4d;color:#fff;font-size:40rpx;box-shadow:0 6rpx 16rpx rgba(49,92,77,.18); }
.nav-item:nth-child(3) .nav-label { margin-top:0; }
</style>
