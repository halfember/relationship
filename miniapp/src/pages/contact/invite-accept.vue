<template>
  <view class="page">
    <view v-if="loading" class="state">正在读取联系人邀请...</view>
    <view v-else-if="error" class="state"><text class="state-title">邀请无法打开</text><text>{{ error }}</text><button @tap="goHome">返回首页</button></view>
    <block v-else>
      <view class="visual"><view class="avatar">我</view><view class="line"><text>联系人</text></view><view class="avatar other">{{ inviterName.slice(0, 1) }}</view></view>
      <text class="from">来自 {{ inviterName }}</text>
      <text class="title">邀请你成为联系人</text>
      <view v-if="preview.message" class="message">“{{ preview.message }}”</view>
      <view class="form-card">
        <view class="field"><text>我怎么称呼 TA</text><input v-model="displayName" maxlength="32" placeholder="输入联系人称呼" /></view>
        <view class="field"><text>TA 和我的关系</text><picker :range="relationshipTypes" range-key="label" @change="relationshipTypeIndex=Number($event.detail.value)"><view class="picker-row"><text>{{ relationshipTypes[relationshipTypeIndex].label }}</text><text>›</text></view></picker></view>
      </view>
      <view class="privacy"><text>✓</text><text>接受后，你们各自保留自己的备注、标签、事件和回忆，不会自动创建共同空间。</text></view>
      <text class="expire">{{ stateText }}</text>
    </block>
    <view v-if="preview && !error" class="submit-bar">
      <button class="primary" :disabled="preview.state !== 'PENDING' || accepting" :loading="accepting" @tap="accept">接受并添加联系人</button>
      <button class="later" @tap="goHome">暂不接受</button>
      <button v-if="preview.state === 'PENDING'" class="reject" :disabled="accepting" @tap="reject">拒绝邀请</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { contactApi } from '@/api/contact.js';
import { store } from '@/store/index.js';

const token = ref(''); const preview = ref(null); const loading = ref(true); const accepting = ref(false); const error = ref('');
const displayName = ref(''); const relationshipTypeIndex = ref(0);
const relationshipTypes = [{label:'朋友',value:'朋友'},{label:'家人',value:'家人'},{label:'恋人',value:'恋人'},{label:'同事',value:'同事'},{label:'同学',value:'同学'},{label:'其他',value:'其他'}];
const inviterName = computed(() => preview.value?.inviter?.nickname || '一位朋友');
const stateText = computed(() => ({ PENDING: '邀请7天内有效', EXPIRED: '邀请已过期', ACCEPTED: '邀请已被接受', REJECTED: '邀请已被拒绝', REVOKED: '邀请已被撤回' }[preview.value?.state] || '邀请已失效'));
onLoad(async (options) => {
  token.value = String(options?.token || '').trim().toUpperCase();
  if (!token.value) { error.value = '缺少邀请码'; loading.value = false; return; }
  try { preview.value = await contactApi.invitePreview(token.value); displayName.value = inviterName.value; } catch (e) { error.value = e?.message || '邀请不存在或已失效'; } finally { loading.value = false; }
});
const accept = async () => {
  if (accepting.value) return;
  if (!store.isLogin) { uni.setStorageSync('pendingContactInviteToken', token.value); return uni.reLaunch({ url: '/pages/login/login' }); }
  if (!displayName.value.trim()) { uni.showToast({ title: '请填写联系人称呼', icon: 'none' }); return; }
  accepting.value = true;
  try { await contactApi.acceptInvite({ token: token.value, displayName: displayName.value.trim(), relationshipType: relationshipTypes[relationshipTypeIndex.value].value }); uni.removeStorageSync('pendingContactInviteToken'); uni.showToast({ title: '已添加联系人', icon: 'success' }); setTimeout(() => uni.reLaunch({ url: '/pages/relationship/list' }), 600); } finally { accepting.value = false; }
};
const reject = () => {
  if (!store.isLogin) { uni.setStorageSync('pendingContactInviteToken', token.value); uni.reLaunch({ url: '/pages/login/login' }); return; }
  uni.showModal({ title: '拒绝邀请', content: `确认拒绝 ${inviterName.value} 的联系人邀请？`, success: async ({ confirm }) => { if (!confirm) return; accepting.value = true; try { await contactApi.rejectInvite({ token: token.value }); uni.removeStorageSync('pendingContactInviteToken'); uni.showToast({ title: '已拒绝邀请', icon: 'success' }); setTimeout(goHome, 600); } finally { accepting.value = false; } } });
};
const goHome = () => { uni.removeStorageSync('pendingContactInviteToken'); uni.reLaunch({ url: '/pages/index/index' }); };
</script>

<style scoped>
.page{min-height:100vh;padding:50rpx 28rpx 250rpx;display:flex;flex-direction:column;align-items:center;background:#f7f7f5;text-align:center;color:#202522}.visual{margin:36rpx 0 32rpx;display:flex;align-items:center}.avatar{width:116rpx;height:116rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e1e9e4;color:#315c4d;font-size:38rpx;font-weight:700;border:6rpx solid #fff}.avatar.other{background:#f0dfeb;color:#7d536c}.line{position:relative;width:140rpx;height:4rpx;background:#b9cec3}.line text{position:absolute;left:50%;top:-17rpx;transform:translateX(-50%);padding:5rpx 10rpx;border-radius:10rpx;background:#e4ece7;color:#315c4d;font-size:26rpx;white-space:nowrap}.from{color:#315c4d;font-size:28rpx;font-weight:600}.title{margin-top:18rpx;font-size:42rpx;line-height:1.45;font-weight:700}.message{width:100%;margin-top:22rpx;color:#737a75;font-size:30rpx;line-height:1.55}.form-card{width:100%;margin-top:28rpx;padding:6rpx 26rpx;box-sizing:border-box;background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx;text-align:left}.field{padding:22rpx 0;border-bottom:1rpx solid #ecece8}.field:last-child{border-bottom:0}.field>text{display:block;margin-bottom:14rpx;color:#737a75;font-size:27rpx}.field input,.picker-row{height:58rpx;font-size:32rpx;color:#202522}.picker-row{display:flex;align-items:center;justify-content:space-between}.privacy{width:100%;margin-top:20rpx;padding:20rpx;box-sizing:border-box;border-radius:13rpx;background:#e4ece7;color:#555e58;font-size:28rpx;line-height:1.6}.privacy text:first-child{margin-right:10rpx;color:#315c4d;font-weight:700}.expire{margin-top:24rpx;color:#8b918d;font-size:26rpx}.submit-bar{position:fixed;left:0;right:0;bottom:0;padding:18rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));background:#fff;border-top:1rpx solid #dedfd9}.primary,.later,.reject{height:88rpx;line-height:88rpx;border-radius:9rpx;font-size:30rpx}.primary{background:#315c4d;color:#fff}.later{margin-top:10rpx;background:#fff;color:#737a75}.reject{margin-top:6rpx;background:#fff;color:#a34e45}.state{margin:auto;display:flex;flex-direction:column;align-items:center;color:#8b918d;font-size:32rpx}.state-title{margin-bottom:12rpx;color:#202522;font-size:32rpx;font-weight:700}.state button{margin-top:24rpx;color:#315c4d;background:#fff}
</style>
