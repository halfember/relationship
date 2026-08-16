<template>
  <view class="ai-page">
    <!-- 输入区 -->
    <view class="input-section">
      <view class="input-card">
        <text class="card-title">💝 纪念日文案</text>
        <text class="card-desc">AI 为你生成优美的纪念日文案和回忆描述</text>

        <!-- 预设场景 -->
        <view class="preset-section">
          <text class="preset-label">快捷场景</text>
          <view class="preset-list">
            <view
              v-for="p in presets"
              :key="p"
              class="preset-item"
              @tap="prompt = p"
            >{{ p }}</view>
          </view>
        </view>

        <textarea
          class="prompt-input"
          v-model="prompt"
          placeholder="描述你们的纪念日背景，如：我们恋爱三周年，想写一段甜蜜的纪念日文案..."
          :maxlength="500"
          :auto-height="true"
        />
      </view>
    </view>

    <!-- 生成按钮 -->
    <view class="action-section">
      <button class="gen-btn" :loading="loading" @tap="handleGenerate">
        ✨ 生成文案
      </button>
    </view>

    <!-- 结果区 -->
    <view v-if="result" class="result-section">
      <view class="result-card">
        <view class="result-header">
          <text class="result-title">生成结果</text>
          <text class="result-copy" @tap="copyResult">📋 复制</text>
        </view>
        <text class="result-text">{{ result }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { aiApi } from '@/api/ai.js';
import { trackEvent } from '@/utils/analytics.js';

const presets = [
  '恋爱三周年纪念文案',
  '结婚一周年纪念文案',
  '相识十年纪念文案',
  '友情纪念日文案',
];

const prompt = ref('');
const result = ref('');
const loading = ref(false);
const relationshipId = ref(0);

onLoad((options) => { relationshipId.value = Number(options?.relationshipId) || 0; });

const handleGenerate = async () => {
  if (!prompt.value.trim()) {
    uni.showToast({ title: '请输入纪念日背景', icon: 'none' });
    return;
  }

  loading.value = true;
  result.value = '';
  try {
    const data = await aiApi.generate({
      userId: store.userId,
      type: 'memory',
      relationshipId: relationshipId.value || undefined,
      prompt: prompt.value.trim(),
    });
    result.value = data.result;
    trackEvent('ai_generated', { type: 'memory', hasRelationship: Boolean(relationshipId.value) });
  } catch (e) {
    // 已处理
  } finally {
    loading.value = false;
  }
};

const copyResult = () => {
  uni.setClipboardData({
    data: result.value,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
  });
};
</script>

<style scoped>
.ai-page {
  min-height: 100vh;
  padding: 30rpx;
  background: #f7f7f5;
}

.input-card {
  background: #fff;
  border: 1rpx solid #dedfd9;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.card-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #303833;
  display: block;
}

.card-desc {
  font-size:32rpx;
  color: #8b918d;
  margin-top: 8rpx;
  display: block;
}

.preset-section {
  margin-top: 24rpx;
}

.preset-label {
  font-size:32rpx;
  color: #8b918d;
  margin-bottom: 12rpx;
  display: block;
}

.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.preset-item {
  min-height: 72rpx;
  padding: 10rpx 20rpx;
  display: flex;
  align-items: center;
  background: #FFF0F3;
  color: #c76755;
  border-radius: 8rpx;
  font-size:32rpx;
}

.prompt-input {
  width: 100%;
  min-height: 160rpx;
  background: #f7f7f5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size:32rpx;
  margin-top: 24rpx;
  box-sizing: border-box;
}

.action-section {
  margin-top: 30rpx;
}

.gen-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #c76755;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.result-section {
  margin-top: 30rpx;
}

.result-card {
  background: #fff;
  border: 1rpx solid #dedfd9;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  border-left: 6rpx solid #c76755;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.result-title {
  font-size:32rpx;
  font-weight: bold;
  color: #303833;
}

.result-copy {
  min-height: 64rpx;
  padding: 12rpx 0 12rpx 20rpx;
  display: flex;
  align-items: center;
  font-size:32rpx;
  color: #c76755;
}

.result-text {
  font-size:32rpx;
  color: #444;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
