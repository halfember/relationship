<template>
  <view class="share-page">
    <!-- 邀请码弹层 -->
    <view class="invite-modal" v-if="step === 'showCode'">
      <view class="modal-card">
        <view class="modal-icon">🔗</view>
        <text class="modal-title">分享邀请</text>
        <text class="modal-sub">将关系「{{ relName }}」邀请给对方查看</text>

        <view class="token-box">
          <text class="token-text">{{ token }}</text>
          <text class="token-hint">分享码</text>
        </view>

        <view class="modal-actions">
          <button class="btn-copy" @tap="copyToken">复制分享码</button>
          <button class="btn-cancel" @tap="goBack">完成</button>
        </view>

        <text class="expire-hint">分享码 7 天内有效，仅可使用一次</text>
      </view>
    </view>

    <!-- 接受邀请 -->
    <view class="accept-section" v-if="step === 'accept'">
      <view class="accept-card">
        <text class="accept-icon">📥</text>
        <text class="accept-title">接受共享</text>
        <text class="accept-desc">输入对方分享的邀请码，查看对方的关系</text>

        <view class="input-wrap">
          <input
            class="token-input"
            v-model="inputToken"
            placeholder="输入 6 位分享码"
            maxlength="6"
            placeholder-class="input-placeholder"
          />
        </view>

        <button
          class="accept-btn"
          :disabled="accepting || inputToken.length < 6"
          :loading="accepting"
          @tap="handleAccept"
        >
          {{ accepting ? '接受中...' : '接受邀请' }}
        </button>
      </view>
    </view>

    <!-- 已共享给我的列表 -->
    <view class="shared-list" v-if="step === 'sharedWithMe'">
      <view class="section-top">
        <text class="section-title">分享给我的</text>
        <text class="section-count" v-if="sharedToMe.length">{{ sharedToMe.length }} 条</text>
      </view>

      <view v-if="loading" class="loading-tip">加载中...</view>

      <block v-else-if="sharedToMe.length === 0">
        <view class="empty-state">
          <text class="empty-icon">📭</text>
          <text class="empty-text">暂无分享给我的关系</text>
          <button class="empty-btn" @tap="step = 'accept'">输入邀请码</button>
        </view>
      </block>

      <view v-else class="shared-cards">
        <view v-for="item in sharedToMe" :key="item.id" class="shared-card" @tap="goSharedDetail(item)">
          <view class="sc-left">
            <text class="sc-emoji">{{ getTypeEmoji(item.relationship?.type || '') }}</text>
          </view>
          <view class="sc-mid">
            <text class="sc-name">{{ item.relationship?.name || '未知' }}</text>
            <text class="sc-owner">来自 {{ item.owner?.nickname || '用户' }}</text>
            <text class="sc-date">{{ formatDate(item.acceptedAt) }}</text>
          </view>
          <view class="sc-right">
            <text class="sc-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 底部分享给我的列表页也有接受按钮 -->
      <view class="bottom-accept">
        <button class="bottom-btn" @tap="step = 'accept'">🔗 输入邀请码</button>
      </view>
    </view>

    <!-- 我分享的列表 -->
    <view class="shared-list" v-if="step === 'sharedByMe'">
      <view class="section-top">
        <text class="section-title">我分享的</text>
        <text class="section-count" v-if="sharedByMeData.length">{{ sharedByMeData.length }} 条</text>
      </view>

      <view v-if="loading2" class="loading-tip">加载中...</view>

      <block v-else-if="sharedByMeData.length === 0">
        <view class="empty-state">
          <text class="empty-icon">📤</text>
          <text class="empty-text">还没有分享过关系</text>
        </view>
      </block>

      <view v-else class="shared-cards">
        <view v-for="item in sharedByMeData" :key="item.id" class="shared-card">
          <view class="sc-left">
            <text class="sc-emoji">{{ getTypeEmoji(item.relationship?.type || '') }}</text>
          </view>
          <view class="sc-mid">
            <text class="sc-name">{{ item.relationship?.name || '未知' }}</text>
            <text class="sc-owner">分享给 {{ item.viewer?.nickname || '用户' }}</text>
            <text class="sc-date">{{ formatDate(item.acceptedAt) }}</text>
          </view>
          <view class="sc-right">
            <text class="sc-remove" @tap.stop="handleRemove(item.id)">移除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部 Tab 切换 -->
    <view class="tab-bar" v-if="step === 'sharedWithMe' || step === 'sharedByMe'">
      <view class="tab-item" :class="{ active: step === 'sharedWithMe' }" @tap="switchTab('sharedWithMe')">
        <text>分享给我</text>
      </view>
      <view class="tab-item" :class="{ active: step === 'sharedByMe' }" @tap="switchTab('sharedByMe')">
        <text>我分享的</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { shareApi } from '@/api/share.js';

const step = ref('sharedWithMe');
const token = ref('');
const inputToken = ref('');
const relName = ref('');
const accepting = ref(false);
const loading = ref(false);
const loading2 = ref(false);
const sharedToMe = ref([]);
const sharedByMeData = ref([]);

// 从关系详情页传入的关系信息
let pendingRelId = 0;
let pendingRelName = '';

const getTypeEmoji = (type) => {
  const map = { family: '👨‍👩‍👧‍👦', friend: '🤝', lover: '💕', colleague: '💼', other: '😊' };
  return map[type] || '😊';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const goBack = () => {
  uni.navigateBack();
};

const switchTab = (tab) => {
  step.value = tab;
  if (tab === 'sharedWithMe') loadSharedWithMe();
  if (tab === 'sharedByMe') loadSharedByMe();
};

const loadSharedWithMe = async () => {
  loading.value = true;
  try {
    sharedToMe.value = await shareApi.sharedWithMe(store.userId);
  } catch (e) {
    // 静默
  } finally {
    loading.value = false;
  }
};

const loadSharedByMe = async () => {
  loading2.value = true;
  try {
    sharedByMeData.value = await shareApi.sharedByMe(store.userId);
  } catch (e) {
    // 静默
  } finally {
    loading2.value = false;
  }
};

const handleInvite = async (relId, name) => {
  pendingRelId = relId;
  pendingRelName = name;
  try {
    const res = await shareApi.invite(store.userId, relId);
    relName.value = res.relationshipName;
    token.value = res.token;
    step.value = 'showCode';
  } catch (e) {
    uni.showToast({ title: '生成失败', icon: 'none' });
  }
};

const copyToken = () => {
  uni.setClipboardData({
    data: token.value,
    success: () => {
      uni.showToast({ title: '已复制', icon: 'success' });
    },
  });
};

const handleAccept = async () => {
  if (inputToken.value.length < 6) return;
  accepting.value = true;
  try {
    const res = await shareApi.accept(store.userId, inputToken.value.toUpperCase());
    uni.showToast({ title: `已接受「${res.relationshipName}」的共享`, icon: 'success' });
    inputToken.value = '';
    step.value = 'sharedWithMe';
    await loadSharedWithMe();
  } catch (e) {
    uni.showToast({ title: e.message || '接受失败', icon: 'none' });
  } finally {
    accepting.value = false;
  }
};

const handleRemove = async (id) => {
  const res = await uni.showModal({ title: '确认移除', content: '将撤销此共享，对方将无法继续查看' });
  if (!res.confirm) return;

  try {
    await shareApi.removeAccess(id, store.userId);
    uni.showToast({ title: '已移除', icon: 'success' });
    loadSharedByMe();
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

const goSharedDetail = (item) => {
  uni.navigateTo({
    url: `/pages/share/detail?accessId=${item.id}&relId=${item.relationshipId}`,
  });
};

// 暴露给关系详情页面调用
defineExpose({ handleInvite });

onLoad((options) => {
  if (options?.relId) {
    handleInvite(Number(options.relId), options.relName || '');
  } else {
    loadSharedWithMe();
  }
});
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  background: #f7f7f5;
  padding-bottom: calc(144rpx + env(safe-area-inset-bottom));
}

/* 邀请码弹层 */
.invite-modal {
  display: flex;
  justify-content: center;
  padding-top: 120rpx;
}

.modal-card {
  background: #fff;
  border: 1rpx solid #dedfd9;
  border-radius: 12rpx;
  padding: 48rpx 40rpx;
  width: 600rpx;
  text-align: center;

}

.modal-icon {
  font-size: 64rpx;
  margin-bottom: 20rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #303833;
  display: block;
  margin-bottom: 8rpx;
}

.modal-sub {
  font-size:28rpx;
  color: #8b918d;
  display: block;
  margin-bottom: 32rpx;
}

.token-box {
  background: #315c4d;
  border-radius: 16rpx;
  padding: 28rpx 0;
  margin-bottom: 32rpx;
}

.token-text {
  font-size: 56rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 12rpx;
  display: block;
}

.token-hint {
  font-size:28rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-top: 6rpx;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.btn-copy {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  background: #315c4d;
  color: #fff;
  border-radius: 12rpx;
  font-size:32rpx;
  border: none;
}

.btn-cancel {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  background: #e2e5e0;
  color: #737a75;
  border-radius: 12rpx;
  font-size:32rpx;
  border: none;
}

.expire-hint {
  font-size:28rpx;
  color: #929894;
}

/* 接受邀请 */
.accept-section {
  display: flex;
  justify-content: center;
  padding-top: 120rpx;
}

.accept-card {
  background: #fff;
  border: 1rpx solid #dedfd9;
  border-radius: 12rpx;
  padding: 48rpx 40rpx;
  width: 600rpx;
  text-align: center;

}

.accept-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.accept-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #303833;
  display: block;
  margin-bottom: 8rpx;
}

.accept-desc {
  font-size:32rpx;
  color: #8b918d;
  display: block;
  margin-bottom: 40rpx;
}

.input-wrap {
  margin-bottom: 32rpx;
}

.token-input {
  width: 100%;
  height: 96rpx;
  text-align: center;
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 16rpx;
  background: #f7f7f5;
  border-radius: 16rpx;
  text-transform: uppercase;
}

.input-placeholder {
  font-size:32rpx;
  color: #9ca29e;
  letter-spacing: 2rpx;
  font-weight: 400;
}

.accept-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #315c4d;
  color: #fff;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
}

.accept-btn[disabled] {
  opacity: 0.5;
}

/* 共享列表 */
.shared-list {
  padding: 30rpx;
}

.section-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #303833;
}

.section-count {
  font-size:32rpx;
  color: #8b918d;
}

.shared-cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.shared-card {min-height:120rpx;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;

}

.sc-left {
  margin-right: 20rpx;
}

.sc-emoji {
  font-size: 40rpx;
}

.sc-mid {
  flex: 1;
  overflow: hidden;
}

.sc-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #303833;
  display: block;
}

.sc-owner {
  font-size:32rpx;
  color: #8b918d;
  display: block;
  margin-top: 4rpx;
}

.sc-date {
  font-size:28rpx;
  color: #929894;
  display: block;
  margin-top: 2rpx;
}

.sc-right {
  margin-left: 16rpx;
}

.sc-arrow {
  font-size: 40rpx;
  color: #9ca29e;
}

.sc-remove {
  font-size:32rpx;
  color: #c76755;
  padding: 8rpx 16rpx;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding-top: 120rpx;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size:32rpx;
  color: #929894;
  display: block;
  margin-bottom: 40rpx;
}

.empty-btn {
  width: 320rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: #315c4d;
  color: #fff;
  border-radius: 16rpx;
  font-size:32rpx;
  border: none;
  margin: 0 auto;
}

.loading-tip {
  text-align: center;
  padding: 60rpx;
  color: #8b918d;
  font-size:28rpx;
}

/* 底部接受按钮 */
.bottom-accept {
  padding: 30rpx 0;
  text-align: center;
}

.bottom-btn {
  width: 360rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size:28rpx;
  border: 2rpx solid #315c4d;
  color: #315c4d;
  background: #fff;
  border-radius: 16rpx;
}

/* Tab 栏 */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  border-top: 1rpx solid #eee;
  min-height: calc(112rpx + env(safe-area-inset-bottom));
  padding: 0 60rpx env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  min-height: 112rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24rpx 0;
  font-size:32rpx;
  color: #8b918d;
  border-bottom: 4rpx solid transparent;
  transition: all 0.2s;
}

.tab-item.active {
  color: #315c4d;
  font-weight: 600;
  border-bottom-color: #315c4d;
}
</style>
