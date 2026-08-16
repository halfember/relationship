<template>
  <view class="accept-page">
    <view v-if="loading" class="state">正在读取邀请...</view>
    <view v-else-if="error" class="state"><text class="state-title">邀请无法打开</text><text>{{ error }}</text><button @tap="goHome">返回首页</button></view>
    <block v-else>
      <view class="pair-visual"><view class="avatar">我</view><view class="line"><text>{{ preview.space.type === 'FAMILY' ? '家庭空间' : '共同空间' }}</text></view><view class="avatar other">{{ inviterName.slice(0,1) }}</view></view>
      <text class="from">来自 {{ inviterName }}</text>
      <text class="title">{{ headline }}</text>
      <text class="space-name">{{ preview.space.name }}</text>
      <view v-if="preview.space.type === 'PAIR' && preview.state === 'PENDING'" class="relationship-form">
        <view class="relationship-field"><text>我怎么称呼TA</text><input v-model="relationshipName" maxlength="32" placeholder="例如：小雨" /></view>
        <view class="relationship-field"><text>TA和我的关系</text><picker :range="relationshipTypes" range-key="label" @change="relationshipTypeIndex=Number($event.detail.value)"><view class="picker-row"><text>{{ relationshipTypes[relationshipTypeIndex].label }}</text><text>›</text></view></picker></view>
        <text class="private-tip">仅用于你的私人关系记录，对方不可见</text>
      </view>
      <view class="value-card">
        <view><text>✓</text><text>共同维护重要纪念日</text></view>
        <view><text>✓</text><text>保存只有空间成员可见的回忆</text></view>
        <view><text>✓</text><text>各自的私人备注仍然完全私密</text></view>
      </view>
      <view class="privacy">接受邀请不会公开你已有的关系、备注、提醒或AI记录。</view>
      <text class="expire">{{ stateText }}</text>
    </block>
    <view v-if="preview && !error" class="submit-bar">
      <button class="primary-button" :disabled="preview.state !== 'PENDING' || accepting" :loading="accepting" @tap="accept">{{ actionText }}</button>
      <button class="later" @tap="goHome">暂不接受</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { spaceApi } from '@/api/space.js';

const token = ref(''); const preview = ref(null); const loading = ref(true); const accepting = ref(false); const error = ref('');
const relationshipName = ref(''); const relationshipTypeIndex = ref(0);
const relationshipTypes = [{label:'朋友',value:'朋友'},{label:'家人',value:'家人'},{label:'恋人',value:'恋人'},{label:'同事',value:'同事'},{label:'同学',value:'同学'},{label:'其他',value:'其他'}];
const inviterName = computed(() => preview.value?.inviter?.nickname || '一位朋友');
const headline = computed(() => preview.value?.space?.type === 'FAMILY' ? '邀请你加入这个家庭空间' : '邀请你一起记录彼此的重要时刻');
const stateText = computed(() => ({ PENDING:'邀请7天内有效', EXPIRED:'邀请已过期', ACCEPTED:'邀请已被接受', REVOKED:'邀请已被撤回' })[preview.value?.state] || '邀请已失效');
const actionText = computed(() => preview.value?.state === 'PENDING' ? '接受并进入空间' : stateText.value);
onLoad(async options => {
  token.value = String(options?.token || '').trim().toUpperCase();
  if (!token.value) { error.value='缺少邀请码'; loading.value=false; return; }
  try { preview.value = await spaceApi.invitePreview(token.value); relationshipName.value = preview.value?.inviter?.nickname || ''; } catch (e) { error.value=e?.message || '邀请不存在或已失效'; } finally { loading.value=false; }
});
const accept = async () => {
  if (accepting.value) return;
  if (!store.isLogin) {
    uni.setStorageSync('pendingSpaceInviteToken', token.value);
    return uni.reLaunch({ url:'/pages/login/login' });
  }
  if (preview.value?.space?.type === 'PAIR' && !relationshipName.value.trim()) {
    return uni.showToast({ title:'请填写你对TA的称呼', icon:'none' });
  }
  accepting.value=true;
  try {
    const space=await spaceApi.acceptInvite({
      token:token.value,
      ...(preview.value?.space?.type === 'PAIR' ? {
        relationshipName:relationshipName.value.trim(),
        relationshipType:relationshipTypes[relationshipTypeIndex.value].value,
      } : {}),
    });
    uni.removeStorageSync('pendingSpaceInviteToken');
    uni.showToast({ title:'已加入共同空间', icon:'success' });
    setTimeout(()=>uni.reLaunch({ url:`/pages/space/detail?id=${space.id}` }),600);
  } finally { accepting.value=false; }
};
const goHome=()=>{uni.removeStorageSync('pendingSpaceInviteToken');uni.reLaunch({url:'/pages/index/index'});};
</script>

<style scoped>
.accept-page{min-height:100vh;padding:50rpx 28rpx 190rpx;display:flex;flex-direction:column;align-items:center;background:#f7f7f5;text-align:center}.pair-visual{margin:36rpx 0 32rpx;display:flex;align-items:center}.avatar{width:116rpx;height:116rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#ffe1d5;color:#7a5549;font-size:38rpx;font-weight:700;border:6rpx solid #fff}.avatar.other{background:#f0dfeb;color:#7d536c}.line{position:relative;width:140rpx;height:4rpx;background:#b9cec3}.line text{position:absolute;left:50%;top:-17rpx;transform:translateX(-50%);padding:5rpx 10rpx;border-radius:10rpx;background:#e4ece7;color:#315c4d;font-size:26rpx;white-space:nowrap}.from{color:#315c4d;font-size:28rpx;font-weight:600}.title{max-width:600rpx;margin-top:18rpx;font-size:42rpx;line-height:1.45;font-weight:700}.space-name{margin-top:12rpx;color:#858c87;font-size:28rpx}.relationship-form{width:100%;margin-top:26rpx;padding:20rpx 22rpx;background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx;text-align:left}.relationship-field{margin-bottom:18rpx}.relationship-field>text{display:block;margin-bottom:9rpx;font-size:28rpx;font-weight:600}.relationship-field input,.picker-row{height:88rpx;padding:0 16rpx;display:flex;align-items:center;justify-content:space-between;background:#f7f7f5;border-radius:11rpx;font-size:32rpx}.picker-row text:last-child{color:#a7a9b4;font-size:32rpx}.private-tip{color:#8b918d;font-size:26rpx}.value-card{width:100%;margin-top:34rpx;padding:8rpx 24rpx;background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx;text-align:left}.value-card view{height:76rpx;display:flex;align-items:center;border-bottom:1rpx solid #e2e5e0;color:#555e58;font-size:32rpx}.value-card view:last-child{border-bottom:0}.value-card view text:first-child{width:42rpx;color:#4f9b6d;font-weight:700}.privacy{width:100%;margin-top:20rpx;padding:20rpx;border-radius:13rpx;background:#e4ece7;color:#555e58;font-size:28rpx;line-height:1.6}.expire{margin-top:24rpx;color:#8b918d;font-size:26rpx}.submit-bar{position:fixed;left:0;right:0;bottom:0;padding:18rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));background:#fff;border-top:1rpx solid #dedfd9}.later{height:88rpx;line-height:88rpx;background:#fff;color:#737a75;font-size:28rpx}.state{margin:auto;display:flex;flex-direction:column;align-items:center;color:#8b918d;font-size:32rpx}.state-title{margin-bottom:12rpx;color:#202522;font-size:32rpx;font-weight:700}.state button{margin-top:24rpx;color:#315c4d;background:#fff}
</style>
