<template>
  <view class="detail-page">
    <block v-if="relationship">
      <!-- 关系信息卡片 -->
      <view class="info-card">
        <view class="info-header">
          <view class="info-avatar">
            <image v-if="relationship.avatar" :src="relationship.avatar" mode="aspectFill" />
            <text v-else class="info-emoji">{{ relationship.name.slice(0, 1) }}</text>
          </view>
          <view class="info-main">
            <text class="info-name">{{ relationship.name }}</text>
            <text class="info-type">{{ relationship.type }}</text>
          </view>
          <view class="info-actions">
            <text class="action-share" @tap="goShare">共</text>
            <text class="action-export" @tap="goExport">卡</text>
            <text class="action-edit" @tap="goEdit">编</text>
            <text class="action-del" @tap="handleDelete">删</text>
          </view>
        </view>

        <view class="info-details">
          <view v-if="relationship.birthday" class="detail-row">
            <text class="detail-icon">生日</text>
            <text class="detail-text">生日：{{ formatDate(relationship.birthday) }}</text>
          </view>
          <view v-if="relationship.remark" class="detail-row">
            <text class="detail-icon">备注</text>
            <text class="detail-text">{{ relationship.remark }}</text>
          </view>
          <view v-if="relationship.tags && relationship.tags.length" class="detail-row">
            <text class="detail-icon">标签</text>
            <view class="detail-tags">
              <text v-for="t in relationship.tags" :key="t" class="detail-tag">{{ t }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- AI 快捷入口 -->
      <view class="ai-actions">
        <view class="ai-action-item" @tap="goAIBlessing">
          <text class="ai-action-icon">祝</text>
          <text class="ai-action-text">生成祝福语</text>
        </view>
        <view class="ai-action-item" @tap="goAIMemory">
          <text class="ai-action-icon">文</text>
          <text class="ai-action-text">生成纪念文案</text>
        </view>
        <view class="ai-action-item" @tap="goAIGift">
          <text class="ai-action-icon">礼</text>
          <text class="ai-action-text">送礼建议</text>
        </view>
      </view>

      <!-- 纪念日 -->
      <view class="section-wrap">
        <view class="section-header">
          <text class="section-title">重要日</text>
          <text class="section-add" @tap="goCreateEvent">+ 添加</text>
        </view>
        <view v-if="events.length > 0" class="event-list">
          <view v-for="e in events" :key="e.id" class="event-item" @tap="goEditEvent(e.id)">
            <view class="event-left">
              <text class="event-title">{{ e.title }}</text>
              <text class="event-date">{{ formatDate(e.eventDate) }}</text>
              <text v-if="e.repeatType" class="event-repeat">{{ e.repeatType }}</text>
            </view>
            <text class="event-del" @tap.stop="handleDeleteEvent(e.id)">×</text>
          </view>
        </view>
        <view v-else class="empty-block">
          <text>还没有纪念日，点击添加</text>
        </view>
      </view>

      <!-- 回忆 -->
      <view class="section-wrap">
        <view class="section-header">
          <text class="section-title">共同回忆</text>
          <text class="section-add" @tap="goCreateMemory">+ 添加</text>
        </view>
        <view v-if="memories.length > 0" class="memory-list">
          <view v-for="m in memories" :key="m.id" class="memory-item">
            <image
              v-if="m.imageUrl"
              :src="m.imageUrl"
              class="memory-img"
              mode="aspectFill"
            />
            <view class="memory-info">
              <text class="memory-content">{{ m.content || '无文字内容' }}</text>
              <text class="memory-date">{{ formatDate(m.memoryDate || m.createdAt) }}</text>
            </view>
            <text class="memory-del" @tap="handleDeleteMemory(m.id)">×</text>
          </view>
        </view>
        <view v-else class="empty-block">
          <text>还没有回忆，点击添加</text>
        </view>
      </view>

      <view v-if="connection" class="connection-section">
        <view><text>联系人连接</text><text>{{ connection.sharedSpace ? '已关联共同空间' : `已与 ${connection.otherUser?.nickname || '对方'} 连接` }}</text></view>
        <button v-if="connection.sharedSpace" @tap="goConnectedSpace">查看共同空间</button>
        <button v-else class="disconnect" @tap="handleDisconnect">解除连接</button>
      </view>
    </block>

    <!-- 加载中 -->
    <view v-else-if="loadError" class="loading-page error-page">
      <text>{{ loadError }}</text><button @tap="loadDetail">重新加载</button>
    </view>
    <view v-else class="loading-page">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { relationshipApi } from '@/api/relationship.js';
import { eventApi } from '@/api/event.js';
import { memoryApi } from '@/api/memory.js';
import { contactApi } from '@/api/contact.js';

const relationship = ref(null);
const events = ref([]);
const memories = ref([]);
const connection = ref(null);
const relationshipId = ref(0);
const loadError = ref('');

onLoad((options) => {
  relationshipId.value = Number(options.id) || 0;
});
onShow(() => { if (relationshipId.value) loadDetail(); });

const loadDetail = async () => {
  const id = relationshipId.value;
  loadError.value = '';
  try {
    const [detail, eventList, memoryList, connections] = await Promise.all([
      relationshipApi.detail(id),
      eventApi.list(id),
      memoryApi.list(id),
      contactApi.list().catch(() => []),
    ]);
    relationship.value = detail;
    events.value = eventList || [];
    memories.value = memoryList || [];
    connection.value = connections.find((item) => item.relationship?.id === id) || null;
  } catch {
    relationship.value = null;
    loadError.value = '关系资料暂时无法加载';
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const goEdit = () => {
  uni.navigateTo({ url: `/pages/relationship/create?id=${relationship.value.id}` });
};

const goEditEvent = (eventId) => {
  uni.navigateTo({ url: `/pages/event/create?id=${eventId}&relationshipId=${relationship.value.id}` });
};

const handleDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: '删除后将不可恢复，确认删除？',
    success: async (res) => {
      if (res.confirm) {
        await relationshipApi.remove(relationship.value.id);
        uni.showToast({ title: '删除成功', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 800);
      }
    },
  });
};

const handleDisconnect = () => {
  uni.showModal({
    title: '解除联系人连接',
    content: '解除后双方不再保持连接，但各自的联系人资料、事件和回忆都会保留。',
    success: async ({ confirm }) => {
      if (!confirm) return;
      await contactApi.disconnect(connection.value.id);
      connection.value = null;
      uni.showToast({ title: '已解除连接', icon: 'success' });
    },
  });
};

const goConnectedSpace = () => {
  uni.navigateTo({ url: `/pages/space/detail?id=${connection.value.sharedSpace.id}` });
};

const handleDeleteEvent = (eventId) => {
  uni.showModal({
    title: '删除纪念日',
    content: '确认删除该纪念日？',
    success: async (res) => {
      if (res.confirm) {
        await eventApi.remove(eventId);
        events.value = events.value.filter((e) => e.id !== eventId);
        uni.showToast({ title: '删除成功', icon: 'success' });
      }
    },
  });
};

const handleDeleteMemory = (memoryId) => {
  uni.showModal({
    title: '删除回忆',
    content: '确认删除该回忆？',
    success: async (res) => {
      if (res.confirm) {
        await memoryApi.remove(memoryId);
        memories.value = memories.value.filter((m) => m.id !== memoryId);
        uni.showToast({ title: '删除成功', icon: 'success' });
      }
    },
  });
};

const goCreateEvent = () => {
  uni.navigateTo({ url: `/pages/event/create?relationshipId=${relationship.value.id}` });
};

const goCreateMemory = () => {
  uni.navigateTo({ url: `/pages/memory/create?relationshipId=${relationship.value.id}` });
};

const goAIBlessing = () => {
  uni.navigateTo({ url: `/pages/ai/blessing?relationshipId=${relationship.value.id}` });
};

const goAIMemory = () => {
  uni.navigateTo({ url: `/pages/ai/memory-text?relationshipId=${relationship.value.id}` });
};

const goAIGift = () => {
  uni.navigateTo({ url: `/pages/ai/gift?relationshipId=${relationship.value.id}` });
};

const goShare = () => {
  uni.navigateTo({
    url: relationship.value.sharedSpaceId
      ? `/pages/space/detail?id=${relationship.value.sharedSpaceId}`
      : `/pages/space/invite-create?relationshipId=${relationship.value.id}&name=${encodeURIComponent(relationship.value.name)}`,
  });
};

const goExport = () => {
  uni.navigateTo({
    url: `/pages/export/card?relationId=${relationship.value.id}`,
  });
};
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  padding-bottom: 40rpx;
  background: #f7f7f5;
}

.loading-page {
  display: flex;
  justify-content: center;
  padding-top: 200rpx;
  color: #8b918d;
}

.connection-section {
  min-height: 112rpx;
  margin: 28rpx;
  padding: 20rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1rpx solid #dfe2dd;
  border-bottom: 1rpx solid #dfe2dd;
}

.connection-section > view {
  display: flex;
  flex-direction: column;
}

.connection-section > view text:first-child {
  font-size: 31rpx;
  font-weight: 650;
}

.connection-section > view text:last-child {
  margin-top: 6rpx;
  color: #858c87;
  font-size: 27rpx;
}

.connection-section button {
  height: 68rpx;
  margin: 0;
  padding: 0 20rpx;
  border: 1rpx solid #d7dcd8;
  background: transparent;
  color: #315c4d;
  line-height: 66rpx;
  font-size: 27rpx;
}

.connection-section button.disconnect {
  color: #a34e45;
}

/* 信息卡片 */
.info-card {
  margin: 20rpx 28rpx;
  background: #fff;
  border: 1rpx solid #dedfd9;
  border-radius: 12rpx;
  padding: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(35,43,38,0.04);
}

.info-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.info-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #e4ece7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.info-emoji {
  font-size: 44rpx;
}

.info-main {
  flex: 1;
}

.info-name {
  font-size:42rpx;
  font-weight: bold;
  color: #303833;
  display: block;
}

.info-type {
  font-size:32rpx;
  color: #315c4d;
  background: #e4ece7;
  padding: 2rpx 14rpx;
  border-radius: 6rpx;
  margin-top: 6rpx;
  display: inline-block;
}

.info-actions {
  display: flex;
  gap: 20rpx;
}

.action-share, .action-export, .action-edit, .action-del {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.info-details {
  border-top: 1rpx solid #e2e5e0;
  padding-top: 24rpx;
}

.detail-row {
  min-height: 56rpx;
  display: flex;
  align-items: flex-start;
  margin-bottom: 12rpx;
}

.detail-icon {
  font-size:32rpx;
  margin-right: 12rpx;
  width: 40rpx;
}

.detail-text {
  font-size:28rpx;
  color: #737a75;
  flex: 1;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.detail-tag {
  background: #e4ece7;
  color: #315c4d;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
  font-size:28rpx;
}

/* AI 快捷入口 */
.ai-actions {
  display: flex;
  margin: 20rpx 28rpx;
  gap: 16rpx;
}

.ai-action-item {
  flex: 1;
  min-height: 128rpx;
  background: #fff;
  border: 1rpx solid #dedfd9;
  border-radius: 12rpx;
  padding: 20rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.03);
}

.ai-action-icon {
  font-size: 36rpx;
  margin-bottom: 6rpx;
}

.ai-action-text {
  font-size:28rpx;
  color: #737a75;
}

/* 分区 */
.section-wrap {
  margin: 20rpx 28rpx;
  background: #fff;
  border: 1rpx solid #dedfd9;
  border-radius: 12rpx;
  padding: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #303833;
}

.section-add {
  padding: 12rpx 0 12rpx 20rpx;
  font-size:28rpx;
  color: #315c4d;
}

/* 事件列表 */
.event-item {min-height:120rpx;
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #e5e7e2;
}

.event-item:last-child {min-height:120rpx;
  border-bottom: none;
}

.event-left {
  flex: 1;
}

.event-title {
  font-size:32rpx;
  color: #303833;
  font-weight: 500;
  display: block;
}

.event-date {
  font-size:32rpx;
  color: #8b918d;
  margin-top: 6rpx;
}

.event-repeat {
  font-size:26rpx;
  color: #315c4d;
  margin-top: 4rpx;
  display: inline-block;
}

.event-del {
  min-width: 64rpx;
  min-height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #9ca29e;
  padding: 0 12rpx;
}

/* 回忆列表 */
.memory-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #e5e7e2;
}

.memory-item:last-child {
  border-bottom: none;
}

.memory-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 12rpx;
  margin-right: 16rpx;
  background: #e2e5e0;
}

.memory-info {
  flex: 1;
}

.memory-content {
  font-size:28rpx;
  color: #303833;
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.memory-date {
  font-size:28rpx;
  color: #8b918d;
  margin-top: 8rpx;
}

.memory-del {
  min-width: 64rpx;
  min-height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #9ca29e;
  padding: 0 12rpx;
}

.empty-block {
  text-align: center;
  padding: 40rpx 0;
  color: #9ca29e;
  font-size:28rpx;
}

/* V1.5 relationship workspace: one continuous surface organized by dividers. */
.detail-page { padding: 12rpx 28rpx 56rpx; }
.info-card { margin:0;padding:28rpx 0 24rpx;border:0;border-bottom:1rpx solid #dfe2dd;border-radius:0;background:transparent;box-shadow:none; }
.info-avatar { width:112rpx;height:112rpx;background:#e1e9e4;color:#315c4d;overflow:hidden; }
.info-avatar image { width:100%;height:100%; }
.info-emoji { font-size:38rpx;font-weight:700; }
.info-actions { gap:8rpx; }
.action-share,.action-export,.action-edit,.action-del { width:58rpx;height:58rpx;border:1rpx solid #d9ddd8;border-radius:50%;color:#59625d;font-size:25rpx; }
.action-del { color:#a34e45; }
.info-details { padding-top:18rpx; }
.detail-icon { width:68rpx;margin-right:10rpx;color:#858c87;font-size:25rpx; }
.ai-actions { margin:22rpx 0 8rpx;gap:0;border-top:1rpx solid #dfe2dd;border-bottom:1rpx solid #dfe2dd; }
.ai-action-item { min-height:108rpx;padding:16rpx 8rpx;border:0;border-right:1rpx solid #e2e5e0;border-radius:0;background:transparent;box-shadow:none; }
.ai-action-item:last-child { border-right:0; }
.ai-action-icon { width:44rpx;height:44rpx;margin-bottom:6rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e4ece7;color:#315c4d;font-size:24rpx;font-weight:700; }
.ai-action-text { color:#4f5853;font-size:27rpx; }
.section-wrap { margin:30rpx 0 0;padding:0;border:0;border-radius:0;background:transparent; }
.section-header { min-height:68rpx;margin-bottom:4rpx; }
.section-title { font-size:34rpx;color:#202522; }
.event-item,.memory-item { min-height:126rpx;border-bottom:1rpx solid #e1e4df; }
.empty-block { border-top:1rpx solid #e1e4df;border-bottom:1rpx solid #e1e4df; }
.connection-section { margin:30rpx 0 0; }
.error-page button { height:76rpx;margin-top:18rpx;padding:0 24rpx;border-radius:8rpx;background:#315c4d;color:#fff;line-height:76rpx;font-size:28rpx; }
</style>
