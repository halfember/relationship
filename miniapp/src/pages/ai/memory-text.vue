<template>
  <view class="ai-page">
    <view class="input-card">
      <text class="card-title">纪念日文案</text>
      <text class="card-desc">把你们的故事交给 AI，生成一段自然的纪念文字</text>
      <view class="preset-section"><text class="preset-label">快捷场景</text><view class="preset-list"><view v-for="item in presets" :key="item" class="preset-item" @tap="prompt = item">{{ item }}</view></view></view>
      <textarea class="prompt-input" v-model="prompt" placeholder="描述你们的纪念日背景，例如：我们恋爱三周年，想写一段甜蜜的纪念日文案…" :maxlength="500" :auto-height="true" />
    </view>
    <view class="privacy-tip">内容仅用于本次生成，不会公开展示。请避免输入身份证号、联系方式等敏感信息。</view>
    <button class="gen-btn" :loading="loading" :disabled="loading" @tap="handleGenerate">生成文案</button>
    <view v-if="error" class="error-state"><text>{{ error }}</text><button @tap="handleGenerate">重新生成</button></view>
    <view v-if="result" class="result-section"><view class="result-card"><view class="result-header"><text class="result-title">生成结果</text><text class="result-copy" @tap="copyResult">复制</text></view><text class="result-text">{{ result }}</text></view></view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { aiApi } from '@/api/ai.js';
import { trackEvent } from '@/utils/analytics.js';

const presets = ['恋爱三周年纪念文案', '结婚一周年纪念文案', '相识十年纪念文案', '友情纪念日文案'];
const prompt = ref(''); const result = ref(''); const loading = ref(false); const error = ref(''); const relationshipId = ref(0);

onLoad((options) => {
  if (!store.isLogin) return uni.reLaunch({ url: '/pages/login/login' });
  relationshipId.value = Number(options?.relationshipId) || 0;
});

const handleGenerate = async () => {
  if (loading.value) return;
  if (!prompt.value.trim()) return uni.showToast({ title: '请输入纪念日背景', icon: 'none' });
  loading.value = true; error.value = '';
  try {
    const data = await aiApi.generate({ userId: store.userId, type: 'memory', relationshipId: relationshipId.value || undefined, prompt: prompt.value.trim() });
    result.value = data.result;
    trackEvent('ai_generated', { type: 'memory', hasRelationship: Boolean(relationshipId.value) });
  } catch (requestError) {
    error.value = requestError?.message || '生成失败，请检查网络后重试';
  } finally { loading.value = false; }
};

const copyResult = () => uni.setClipboardData({ data: result.value, success: () => uni.showToast({ title: '已复制', icon: 'success' }) });
</script>

<style scoped>
.ai-page{min-height:100vh;padding:30rpx;background:#f7f7f5}.input-card,.result-card{background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx;padding:30rpx;font-weight:700;color:#303833;display:block}.card-desc{font-size:28rpx;color:#8b918d;margin-top:8rpx;display:block;line-height:1.5}.preset-section{margin-top:24rpx}.preset-label{font-size:28rpx;color:#8b918d;margin-bottom:12rpx;display:block}.preset-list{display:flex;flex-wrap:wrap;gap:12rpx}.preset-item{min-height:72rpx;padding:10rpx 20rpx;display:flex;align-items:center;background:#fff0f3;color:#c76755;border-radius:8rpx;font-size:28rpx}.prompt-input{width:100%;min-height:160rpx;background:#f7f7f5;border-radius:12rpx;padding:20rpx;font-size:30rpx;margin-top:24rpx;box-sizing:border-box;line-height:1.6}.privacy-tip{margin:18rpx 0;padding:18rpx 20rpx;border-radius:10rpx;background:#eaf6ee;color:#526b5a;font-size:26rpx;line-height:1.55}.gen-btn{width:100%;height:88rpx;line-height:88rpx;background:#c76755;color:#fff;border-radius:10rpx;font-size:32rpx;font-weight:500;border:none}.error-state{margin-top:18rpx;padding:22rpx;border:1rpx solid #f0cfc9;border-radius:10rpx;background:#fff7f5;color:#b54f43;font-size:28rpx;line-height:1.5}.error-state button{display:block;margin-top:14rpx;height:78rpx;line-height:78rpx;padding:0 20rpx;border-radius:10rpx;background:#fff;color:#315c4d;border:1rpx solid #dfe2dd;font-size:28rpx}.result-section{margin-top:24rpx}.result-card{border-left:6rpx solid #c76755}.result-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16rpx}.result-title{font-size:32rpx;font-weight:700;color:#303833}.result-copy{min-height:64rpx;padding:12rpx 0 12rpx 20rpx;display:flex;align-items:center;font-size:28rpx;color:#c76755}.result-text{font-size:30rpx;color:#444;line-height:1.8;white-space:pre-wrap}
</style>
