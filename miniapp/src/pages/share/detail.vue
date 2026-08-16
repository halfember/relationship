<template>
  <view class="shared-detail-page">
    <view class="detail-header">
      <view class="dh-icon">{{ getTypeEmoji(rel.type) }}</view>
      <view class="dh-info">
        <text class="dh-name">{{ rel.name }}</text>
        <text class="dh-type">{{ typeLabel(rel.type) }}</text>
      </view>
      <view class="dh-label">
        <text class="dh-label-text">共享查看</text>
      </view>
    </view>

    <view class="detail-body">
      <view v-if="loading" class="loading-tip">加载中...</view>

      <block v-else>
        <!-- 事件记录 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">📅 纪念日</text>
          </view>
          <view v-if="rel.events?.length">
            <view v-for="evt in rel.events" :key="evt.id" class="event-item">
              <text class="evt-title">{{ evt.title }}</text>
              <text class="evt-date">{{ formatDate(evt.eventDate) }}</text>
            </view>
          </view>
          <view v-else class="no-data">暂无纪念日</view>
        </view>

        <!-- 回忆 -->
        <view class="section">
          <view class="section-header">
            <text class="section-title">💝 回忆</text>
          </view>
          <view v-if="rel.memories?.length">
            <view v-for="mem in rel.memories" :key="mem.id" class="memory-item">
              <image v-if="mem.imageUrl" :src="mem.imageUrl" mode="aspectFill" class="mem-image" />
              <text class="mem-content">{{ mem.content || '无描述' }}</text>
            </view>
          </view>
          <view v-else class="no-data">暂无回忆</view>
        </view>
      </block>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { shareApi } from '@/api/share.js';

const rel = ref({ name: '', type: '', events: [], memories: [] });
const loading = ref(true);
let accessId = 0;

const getTypeEmoji = (type) => {
  const map = { family: '👨‍👩‍👧‍👦', friend: '🤝', lover: '💕', colleague: '💼', other: '😊' };
  return map[type] || '😊';
};

const typeLabel = (type) => {
  const map = { family: '家人', friend: '朋友', lover: '恋人', colleague: '同事', other: '其他' };
  return map[type] || '其他';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

onLoad((options) => {
  accessId = Number(options.accessId) || 0;
  load();
});

const load = async () => {
  loading.value = true;
  try {
    rel.value = await shareApi.sharedDetail(accessId, store.userId);
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.shared-detail-page {
  min-height: 100vh;
  background: #f7f7f5;
}

.detail-header {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.dh-icon { font-size: 56rpx; margin-right: 20rpx; }
.dh-info { flex: 1; }
.dh-name { font-size: 36rpx; font-weight: 700; color: #303833; display: block; }
.dh-type { font-size:32rpx; color: #8b918d; margin-top: 4rpx; display: block; }
.dh-label { background: #e4ece7; border-radius: 12rpx; padding: 8rpx 16rpx; }
.dh-label-text { font-size:28rpx; color: #315c4d; }

.detail-body { padding: 0 30rpx; }
.loading-tip { text-align: center; padding: 80rpx 0; color: #8b918d; }

.section { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.section-header { margin-bottom: 16rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #303833; }

.event-item {min-height:120rpx;
  display: flex; justify-content: space-between; align-items: center;
  padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0;
}
.event-item:last-child {min-height:120rpx; border-bottom: none; }
.evt-title { font-size:32rpx; color: #555; }
.evt-date { font-size:32rpx; color: #8b918d; }

.memory-item {
  display: flex; align-items: flex-start;
  padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0;
}
.memory-item:last-child { border-bottom: none; }
.mem-image { width: 100rpx; height: 100rpx; border-radius: 12rpx; margin-right: 16rpx; flex-shrink: 0; }
.mem-content { font-size:28rpx; color: #555; line-height: 1.6; flex: 1; }

.no-data { text-align: center; padding: 40rpx 0; color: #9ca29e; font-size:28rpx; }
</style>
