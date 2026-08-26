<template>
  <view class="page-shell records-page">
    <view class="page-head">
      <view><text class="page-title">记录</text><text class="intro">一张照片、一句话，把重要的时刻留下来。</text></view>
      <button class="add-button" aria-label="写一条记录" @tap="createMemory">＋</button>
    </view>

    <view class="toolbar">
      <view class="filters"><view v-for="item in filters" :key="item.key" :class="['filter', { active: filter === item.key }]" @tap="filter = item.key">{{ item.label }} <text>{{ item.count }}</text></view></view>
      <button class="view-toggle" :aria-label="gridView ? '切换为列表视图' : '切换为网格视图'" @tap="gridView = !gridView">{{ gridView ? '☷' : '▦' }}</button>
    </view>

    <view v-if="loading" class="records-grid loading-grid"><view v-for="item in 6" :key="item" class="skeleton-tile"></view></view>
    <view v-else-if="loadError" class="empty-state"><view class="empty-mark">!</view><text class="empty-title">记录暂时加载失败</text><text class="empty-desc">请检查网络后重试，已有记录不会丢失。</text><button class="primary-button" @tap="loadMemories">重新加载</button></view>
    <view v-else-if="visibleMemories.length" :class="['records-grid', { 'list-view': !gridView }]">
      <view v-for="(item, index) in visibleMemories" :key="item.id" class="memory-tile" @tap="openMemory(item)">
        <image v-if="item.imageUrl" class="memory-image" :src="item.imageUrl" mode="aspectFill" />
        <view v-else :class="['memory-art', `tone-${index % 4}`]"><text>{{ artLabel(item) }}</text></view>
        <view class="memory-copy"><text class="memory-title">{{ item.content || '未命名记录' }}</text><text class="memory-meta">{{ item.relationshipName || '重要的人' }} · {{ formatDate(item.memoryDate || item.createdAt) }}</text></view>
      </view>
    </view>
    <view v-else class="empty-state"><view class="empty-mark">＋</view><text class="empty-title">还没有记录</text><text class="empty-desc">从一张照片或一句话开始，保存你想记住的时刻。</text><button class="primary-button" @tap="createMemory">写下第一条记录</button></view>
    <BottomNav v-if="store.isLogin" active="records" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import BottomNav from '@/components/BottomNav.vue';
import { store } from '@/store/index.js';
import { memoryApi } from '@/api/memory.js';
import { relationshipApi } from '@/api/relationship.js';
import { openContactCreationMenu } from '@/utils/contactCreation.js';

const memories = ref([]); const relationships = ref([]); const loading = ref(false); const loadError = ref(false); const filter = ref('all'); const gridView = ref(true);
const filters = computed(() => [
  { key: 'all', label: '全部', count: memories.value.length },
  { key: 'photo', label: '照片', count: memories.value.filter((item) => Boolean(item.imageUrl)).length },
  { key: 'text', label: '文字', count: memories.value.filter((item) => !item.imageUrl).length },
]);
const visibleMemories = computed(() => filter.value === 'photo' ? memories.value.filter((item) => item.imageUrl) : filter.value === 'text' ? memories.value.filter((item) => !item.imageUrl) : memories.value);

const loadMemories = async () => {
  if (!store.isLogin) return uni.reLaunch({ url: '/pages/login/login' });
  loading.value = true; loadError.value = false;
  try {
    const [items, people] = await Promise.all([memoryApi.all(), relationshipApi.list(store.userId)]);
    memories.value = items || [];
    relationships.value = people || [];
  } catch {
    memories.value = []; loadError.value = true;
  } finally { loading.value = false; }
};
onShow(loadMemories);

const formatDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : `${date.getMonth() + 1}月${date.getDate()}日`; };
const artLabel = (item) => (item.content || '记录').slice(0, 8);
const openMemory = (item) => uni.navigateTo({ url: `/pages/memory/detail?id=${item.id}&relationshipId=${item.relationshipId}` });
const createMemory = () => {
  if (!relationships.value.length) return openContactCreationMenu();
  if (relationships.value.length === 1) return uni.navigateTo({ url: `/pages/memory/create?relationshipId=${relationships.value[0].id}` });
  uni.showActionSheet({ itemList: relationships.value.map((item) => item.name), success: ({ tapIndex }) => uni.navigateTo({ url: `/pages/memory/create?relationshipId=${relationships.value[tapIndex].id}` }) });
};
</script>

<style scoped>
.records-page { min-height: 100vh; padding-top: 24rpx; }
.page-head,
.toolbar,
.filters,
.memory-copy,
.empty-state { display: flex; }

.page-head { align-items: flex-start; justify-content: space-between; }
.page-head > view,
.memory-copy,
.empty-state { flex-direction: column; }
.intro { margin-top: 6rpx; color: #858c87; font-size: 28rpx; line-height: 40rpx; }
.add-button { width: 80rpx; height: 80rpx; margin: 0; padding: 0; border-radius: 50%; background: #315c4d; color: #fff; line-height: 78rpx; font-size: 38rpx; }

.toolbar { min-height: 76rpx; margin-top: 28rpx; align-items: center; justify-content: space-between; }
.filters { min-width: 0; flex: 1; align-items: center; gap: 8rpx; overflow: hidden; }
.filter { height: 68rpx; padding: 0 20rpx; display: flex; flex: none; align-items: center; gap: 8rpx; border-radius: 8rpx; color: #747b76; font-size: 28rpx; line-height: 68rpx; white-space: nowrap; }
.filter text { color: #9ca29e; font-size: 26rpx; }
.filter.active { background: #e4ece7; color: #315c4d; font-weight: 650; }
.filter.active text { color: #315c4d; }
.view-toggle { width: 68rpx; height: 68rpx; margin: 0 0 0 12rpx; padding: 0; flex: none; border: 1rpx solid #dfe2dd; border-radius: 8rpx; background: #fff; color: #52605a; line-height: 64rpx; font-size: 34rpx; }

.records-grid { margin-top: 22rpx; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.memory-tile { min-width: 0; overflow: hidden; border: 1rpx solid #dedfd9; border-radius: 10rpx; background: #fff;  }
.memory-image,
.memory-art { width: 100%; height: 220rpx; }
.memory-image { display: block; background: #e9ece8; }
.memory-art { padding: 18rpx; display: flex; align-items: flex-end; background: #f1e7d4; color: #7a612d; font-family: Georgia, serif; font-size: 34rpx; line-height: 1.35; overflow: hidden; }
.tone-1 { background: #e4ece7; color: #315c4d; }
.tone-2 { background: #e9e0ed; color: #735a7b; }
.tone-3 { background: #f7dfd6; color: #915041; }
.memory-copy { min-width: 0; min-height: 122rpx; padding: 16rpx; justify-content: center; }
.memory-title { overflow: hidden; color: #303934; font-size: 30rpx; font-weight: 650; line-height: 42rpx; text-overflow: ellipsis; white-space: nowrap; }
.memory-meta { margin-top: 5rpx; overflow: hidden; color: #8b918d; font-size: 25rpx; line-height: 34rpx; text-overflow: ellipsis; white-space: nowrap; }

.list-view { grid-template-columns: 1fr; gap: 0; border-top: 1rpx solid #dfe2dd; border-bottom: 1rpx solid #dfe2dd; }
.list-view .memory-tile { min-height: 144rpx; display: flex; align-items: stretch; border: 0; border-bottom: 1rpx solid #e5e7e2; border-radius: 0;  }
.list-view .memory-tile:last-child { border-bottom: 0; }
.list-view .memory-image,
.list-view .memory-art { width: 144rpx; height: 144rpx; flex: none; }
.list-view .memory-art { padding: 14rpx; font-size: 26rpx; }
.list-view .memory-copy { min-height: 144rpx; padding: 18rpx 16rpx; }

.loading-grid { pointer-events: none; }
.skeleton-tile { height: 342rpx; border-radius: 10rpx; background: linear-gradient(90deg, #e8ece7 20%, #f2f4f1 50%, #e8ece7 80%); background-size: 200% 100%; }
.empty-state { min-height: 530rpx; align-items: center; justify-content: center; color: #89908c; text-align: center; }
.empty-mark { width: 88rpx; height: 88rpx; margin-bottom: 18rpx; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #e4ece7; color: #315c4d; font-size: 36rpx; }
.empty-title { color: #303934; font-size: 34rpx; font-weight: 700; line-height: 48rpx; }
.empty-desc { max-width: 540rpx; margin-top: 8rpx; color: #89908c; font-size: 28rpx; line-height: 42rpx; }
.empty-state .primary-button { min-width: 216rpx; height: 88rpx; margin-top: 22rpx; padding: 0 28rpx; border-radius: 9rpx; line-height: 88rpx; font-size: 30rpx; }
</style>
