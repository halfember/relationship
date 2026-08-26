<template>
  <view class="login-page">
    <view class="brand-row">
      <view class="brand-mark"><view></view><view></view></view>
      <text>与你</text>
    </view>

    <view class="preview-stage">
      <view class="preview-copy">
        <text>记得重要的日子，</text>
        <text>也记得日子里的人。</text>
      </view>
      <view class="memory-sheet sheet-back">
        <text>9月 03</text><text>我们的纪念日</text><view>还有 18 天</view>
      </view>
      <view class="memory-sheet sheet-middle">
        <text>8月 28</text><text>和爸爸吃顿饭</text><view>还有 12 天</view>
      </view>
      <view class="memory-sheet sheet-front">
        <view class="sheet-date"><text>21</text><text>八月</text></view>
        <view class="sheet-person"><view>妈</view><text>妈妈的生日</text><text>下周五</text></view>
        <text class="sheet-arrow">›</text>
      </view>
    </view>

    <view class="auth-panel">
      <text class="auth-title">开始记录重要的人</text>
      <text class="auth-subtitle">生日、纪念日和共同回忆，会安全同步到你的账号。</text>

      <button class="wechat-button" :loading="loading" :disabled="loading" @tap="handleLogin">
        <view class="wechat-symbol"><view></view><view></view></view>
        <text>{{ loading ? '正在登录' : '微信快捷登录' }}</text>
      </button>
      <text v-if="loginError" class="login-error">{{ loginError }}</text>

      <view class="agreement-row" @tap="agreed = !agreed">
        <view class="check" :class="{ checked: agreed }">{{ agreed ? '✓' : '' }}</view>
        <text>我已阅读并同意</text><text class="privacy-link" @tap.stop="openPrivacy">《隐私保护指引》</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { userApi } from '@/api/user.js';
import { trackEvent } from '@/utils/analytics.js';

const loading = ref(false);
const agreed = ref(false);
const loginError = ref('');
const pendingContactInvite = ref('');
const useMockLogin = __USE_MOCK_LOGIN__;

onShow(() => {
  pendingContactInvite.value = uni.getStorageSync('pendingContactInviteToken') || '';
  if (store.isLogin) routeAfterLogin(store.userInfo);
});

const routeAfterLogin = (user) => {
  if (!user?.nickname) return uni.reLaunch({ url: '/pages/onboarding/index' });
  if (pendingContactInvite.value) return uni.reLaunch({ url: `/pages/contact/invite-accept?token=${pendingContactInvite.value}` });
  return uni.reLaunch({ url: '/pages/index/index' });
};

const handleLogin = () => {
  if (!agreed.value) return uni.showToast({ title: '请先阅读并同意隐私保护指引', icon: 'none' });
  loading.value = true;
  loginError.value = '';

  if (useMockLogin) {
    loginWithCode('dev_miniapp_local');
    return;
  }

  uni.login({
    provider: 'weixin',
    success: ({ code }) => loginWithCode(code),
    fail: () => {
      loading.value = false;
      loginError.value = '未能获取微信登录凭证，请重试';
    },
  });
};

const loginWithCode = async (code) => {
  try {
    const user = await userApi.login(code);
    store.setUserInfo(user);
    trackEvent('login_succeeded');
    routeAfterLogin(user);
  } catch (error) {
    loginError.value = error?.message || '暂时无法登录，请稍后重试';
  } finally {
    loading.value = false;
  }
};

const openPrivacy = () => {
  if (typeof uni.openPrivacyContract === 'function') return uni.openPrivacyContract();
  uni.showModal({ title: '隐私保护指引', content: '我们仅使用微信身份完成登录，并同步你主动记录的关系、日期和回忆。', showCancel: false });
};
</script>

<style scoped>
.login-page { min-height: 100vh; padding: 26rpx 36rpx calc(38rpx + env(safe-area-inset-bottom)); display: flex; flex-direction: column; background: #f7f7f5; color: #202522; }
.brand-row { display:flex;align-items:center;gap:14rpx;font-size:34rpx;font-weight:750; }.brand-mark { position:relative;width:48rpx;height:40rpx; }.brand-mark view { position:absolute;width:30rpx;height:36rpx;border:3rpx solid #315c4d;border-radius:50% 50% 45% 45%;transform:rotate(-28deg); }.brand-mark view:last-child { left:17rpx;transform:rotate(28deg);border-color:#c76755; }
.preview-stage { position:relative;flex:1;min-height:650rpx;padding-top:70rpx;overflow:hidden; }.preview-copy { display:flex;flex-direction:column;font-size:48rpx;line-height:1.34;font-weight:750; }.preview-copy text:last-child { color:#315c4d; }
.memory-sheet { position:absolute;left:0;right:0;height:156rpx;padding:0 26rpx;border:1rpx solid #dedfd9;border-radius:12rpx;background:#fff; }.memory-sheet:not(.sheet-front) { display:flex;align-items:center;color:#737a75;font-size:28rpx; }.memory-sheet:not(.sheet-front) text:first-child { width:112rpx;color:#303733;font-size:32rpx;font-weight:650; }.memory-sheet:not(.sheet-front) text:nth-child(2) { flex:1; }.memory-sheet:not(.sheet-front) view { color:#a06a4f; }
.sheet-back { top:320rpx;left:50rpx;right:10rpx;transform:rotate(4deg);background:#e6ece7; }.sheet-middle { top:372rpx;left:15rpx;right:38rpx;transform:rotate(-3deg);background:#f4ead9; }.sheet-front { top:438rpx;height:188rpx;display:flex;align-items:center; }.sheet-date { width:84rpx;height:100rpx;margin-right:20rpx;border-right:1rpx solid #e0e2dd;display:flex;flex-direction:column;justify-content:center; }.sheet-date text:first-child { font-family:Georgia,serif;font-size:44rpx;line-height:48rpx; }.sheet-date text:last-child { margin-top:4rpx;color:#858c87;font-size:26rpx; }.sheet-person { flex:1;min-width:0;display:grid;grid-template-columns:64rpx 1fr;grid-template-rows:1fr 1fr;align-items:center; }.sheet-person view { grid-row:1/3;width:58rpx;height:58rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#ecd6ca;color:#6c4e41;font-size:28rpx;font-weight:700; }.sheet-person text:nth-child(2) { font-size:34rpx;font-weight:650; }.sheet-person text:last-child { color:#8c938e;font-size:28rpx; }.sheet-arrow { color:#9ba19d;font-size:38rpx; }
.auth-panel { padding-top:28rpx;border-top:1rpx solid #dedfd9; }.invite-note { min-height:104rpx;margin-bottom:20rpx;padding:14rpx 16rpx;display:flex;align-items:center;border-radius:10rpx;background:#f2e7d3; }.invite-note > text { width:52rpx;height:52rpx;margin-right:14rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff;color:#8b6b31;font-size:26rpx;font-weight:700; }.invite-note > view { display:flex;flex-direction:column; }.invite-note > view text:first-child { font-size:30rpx;font-weight:650; }.invite-note > view text:last-child { margin-top:3rpx;color:#857d6e;font-size:26rpx; }
.auth-title { display:block;font-size:34rpx;font-weight:750; }.auth-subtitle { display:block;max-width:640rpx;margin-top:8rpx;color:#777e79;font-size:28rpx;line-height:1.6; }.wechat-button { height:100rpx;margin-top:24rpx;border-radius:10rpx;display:flex;align-items:center;justify-content:center;background:#315c4d;color:#fff;font-size:34rpx;font-weight:650;line-height:100rpx; }.wechat-button[disabled] { opacity:.68; }.wechat-symbol { position:relative;width:44rpx;height:36rpx;margin-right:14rpx; }.wechat-symbol view { position:absolute;width:31rpx;height:27rpx;border:2rpx solid #fff;border-radius:50%; }.wechat-symbol view:last-child { left:15rpx;top:9rpx;width:28rpx;height:24rpx;background:#315c4d; }.login-error { display:block;margin-top:12rpx;color:#b54f43;font-size:28rpx;text-align:center; }
.agreement-row { min-height:80rpx;display:flex;align-items:center;justify-content:center;color:#858c87;font-size:26rpx; }.check { width:32rpx;height:32rpx;margin-right:10rpx;border:1rpx solid #aeb4b0;border-radius:5rpx;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26rpx; }.check.checked { border-color:#315c4d;background:#315c4d; }.privacy-link { color:#315c4d; }
</style>
