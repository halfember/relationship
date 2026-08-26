<template>
  <view class="page-shell space-list-page">
    <view class="page-head">
      <view><text class="page-title">家庭空间</text><text class="page-sub">与家人一起记录</text></view>
      <button class="head-add" @tap="add">＋</button>
    </view>

    <view class="tabs">
      <view v-for="item in tabs" :key="item.key" :class="['tab', { active: filter === item.key }]" @tap="filter = item.key">{{ item.label }}</view>
    </view>

    <view v-if="loading" class="state surface">正在加载...</view>
    <view v-else-if="visible.length" class="space-list">
      <view v-for="item in visible" :key="item.id" class="space-row" @tap="open(item)">
        <view :class="['space-avatar', item.type === 'FAMILY' ? 'family' : 'pair']">{{ avatarText(item) }}</view>
        <view class="space-copy">
          <view class="name-line"><text class="space-name">{{ item.name }}</text><text v-if="item.status === 'PENDING'" class="pending">待接受</text></view>
          <text class="space-meta">家庭空间 · {{ item.members?.length || 0 }} 位成员</text>
          <text class="space-count">{{ item._count?.events || 0 }} 个纪念日 · {{ item._count?.memories || 0 }} 条回忆</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
    <view v-else class="empty surface">
      <text class="empty-icon">◇</text>
      <text class="empty-title">还没有家庭空间</text>
      <text class="empty-desc">为家人创建一个共同记录的空间。</text>
      <button class="primary-button" @tap="add">开始创建</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { spaceApi } from '@/api/space.js';

const loading = ref(true);
const spaces = ref([]);
const filter = ref('all');
const tabs = [{ key: 'FAMILY', label: '家庭' }];
const visible = computed(() => spaces.value.filter(item => item.type === 'FAMILY'));

onShow(async () => {
  if (!store.isLogin) return uni.reLaunch({ url: '/pages/login/login' });
  loading.value = true;
  try { spaces.value = await spaceApi.list() || []; } finally { loading.value = false; }
});

const avatarText = item => (item.name || '家').slice(0, 1);
const open = item => {
  if (item.status !== 'PENDING') return uni.navigateTo({ url: `/pages/space/detail?id=${item.id}` });
  const invite = item.invites?.[0];
  if (!invite) return uni.showToast({ title: '邀请已经失效', icon: 'none' });
  uni.showActionSheet({ itemList: ['撤回邀请'], success: async () => {
    await spaceApi.revokeInvite(item.id, invite.id);
    spaces.value = spaces.value.filter(space => space.id !== item.id);
    uni.showToast({ title: '邀请已撤回', icon: 'success' });
  } });
};
const add = () => uni.navigateTo({ url: '/pages/space/family-create' });
</script>

<style scoped>
.space-list-page{padding-top:28rpx}.page-head{display:flex;align-items:center;justify-content:space-between}.page-head>view{display:flex;flex-direction:column}.page-sub{margin-top:6rpx;color:#858c87;font-size:28rpx}.head-add{width:88rpx;height:88rpx;line-height:88rpx;margin:0;padding:0;border-radius:50%;background:#315c4d;color:#fff;font-size:36rpx}.tabs{margin:28rpx 0 20rpx;padding:6rpx;display:grid;grid-template-columns:repeat(3,1fr);background:#e9ece8;border-radius:10rpx}.tab{height:76rpx;display:flex;align-items:center;justify-content:center;color:#737a75;font-size:32rpx;border-radius:10rpx}.tab.active{background:#fff;color:#202522;font-weight:600;flex-direction:column;gap:14rpx}.space-row{min-height:132rpx;padding:20rpx;display:flex;align-items:center;background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx}.space-avatar{width:78rpx;height:78rpx;margin-right:18rpx;border-radius:18rpx;display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:700}.space-avatar.pair{background:#e4ece7;color:#315c4d}.space-avatar.family{background:#e4f3e9;color:#4f8c64}.space-copy{flex:1;min-width:0;display:flex;flex-direction:column}.name-line{display:flex;align-items:center;gap:10rpx}.space-name{max-width:350rpx;font-size:32rpx;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pending{padding:4rpx 10rpx;border-radius:10rpx;background:#fff2dc;color:#d58e27;font-size:26rpx}.space-meta,.space-count{margin-top:6rpx;color:#9799a6;font-size:26rpx}.arrow{color:#9ca29e;font-size:34rpx}.state,.empty{margin-top:70rpx;padding:46rpx 30rpx;text-align:center}.empty{display:flex;flex-direction:column;align-items:center}.empty-icon{color:#315c4d;font-size:54rpx}.empty-title{margin-top:14rpx;font-size:32rpx;font-weight:600}.empty-desc{max-width:440rpx;margin:10rpx 0 24rpx;color:#8b918d;font-size:28rpx;line-height:1.6}.empty .primary-button{width:280rpx;height:88rpx;line-height:88rpx;font-size:32rpx}
.tabs{grid-template-columns:1fr}
</style>
