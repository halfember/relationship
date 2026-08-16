<template>
  <view class="invite-page">
    <view v-if="!invite" class="form-wrap">
      <text class="eyebrow">创建双人空间</text>
      <text class="title">先告诉我你们的关系</text>
      <text class="sub">称呼和关系类型只用于你的个人记录。</text>

      <view class="field"><view class="label"><text>对方称呼</text><text>仅自己可见</text></view><input v-model="form.displayName" maxlength="32" placeholder="例如：小雨" /></view>
      <view class="field"><view class="label"><text>我与对方的关系</text><text>仅自己可见</text></view><picker :range="types" range-key="label" @change="changeType"><view class="picker-row"><text>{{ currentType.label }}</text><text>›</text></view></picker></view>
      <view class="field"><view class="label"><text>共同空间名称</text><text>双方可见</text></view><input v-model="form.spaceName" maxlength="64" placeholder="例如：我们的时光" /></view>
      <view class="field"><view class="label"><text>共同纪念日</text><text>选填</text></view><picker mode="date" @change="form.anniversaryDate = $event.detail.value"><view class="picker-row"><text :class="{ muted: !form.anniversaryDate }">{{ form.anniversaryDate || '选择日期' }}</text><text>›</text></view></picker></view>
      <view class="privacy"><text>◇</text><text>你的私人备注、标签、提醒和AI记录不会分享给对方。</text></view>
    </view>

    <view v-else class="result-wrap">
      <view class="pair-visual"><view class="avatar">我</view><view class="line"><text>共同空间</text></view><view class="avatar other">{{ form.displayName.slice(0,1) }}</view></view>
      <text class="result-title">邀请已准备好</text>
      <text class="result-sub">发送给 {{ form.displayName }}，对方接受后即可共同记录。</text>
      <view class="code-card"><text class="code">{{ invite.token }}</text><text>备用邀请码 · 7天内有效</text></view>
      <view class="privacy"><text>✓</text><text>接受邀请不会公开双方已有的私人记录。</text></view>
    </view>

    <view class="submit-bar">
      <button v-if="!invite" class="primary-button" :disabled="submitting" :loading="submitting" @tap="generate">生成邀请</button>
      <button v-else class="primary-button" open-type="share">发送给微信好友</button>
      <button v-if="invite" class="copy-button" @tap="copy">复制邀请码</button>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { spaceApi } from '@/api/space.js';

const invite = ref(null);
const submitting = ref(false);
const typeIndex = ref(0);
const types = [{ label:'朋友', value:'朋友' },{ label:'家人', value:'家人' },{ label:'恋人', value:'恋人' },{ label:'同事', value:'同事' },{ label:'同学', value:'同学' },{ label:'其他', value:'其他' }];
const currentType = computed(() => types[typeIndex.value]);
const form = reactive({ displayName:'', spaceName:'', anniversaryDate:'', relationshipId:undefined });
onLoad(options => {
  if (!store.isLogin) return uni.reLaunch({ url:'/pages/login/login' });
  form.displayName = decodeURIComponent(options?.name || '');
  form.spaceName = form.displayName ? `我和${form.displayName}的时光` : '';
  if (options?.relationshipId) form.relationshipId = Number(options.relationshipId);
});
const changeType = event => { typeIndex.value = Number(event.detail.value); };
const generate = async () => {
  if (submitting.value) return;
  if (!form.displayName.trim() || !form.spaceName.trim()) return uni.showToast({ title:'请完善称呼和空间名称', icon:'none' });
  submitting.value = true;
  try {
    invite.value = await spaceApi.createPairInvite({
      displayName:form.displayName.trim(), relationshipType:currentType.value.value, spaceName:form.spaceName.trim(),
      ...(form.anniversaryDate ? { anniversaryDate:form.anniversaryDate } : {}),
      ...(form.relationshipId ? { relationshipId:form.relationshipId } : {}),
    });
  } finally { submitting.value = false; }
};
const copy = () => uni.setClipboardData({ data:invite.value.token });
onShareAppMessage(() => ({
  title:`${store.userInfo?.nickname || '一位朋友'}邀请你一起记录重要时刻`,
  path:invite.value?.path || '/pages/space/list',
}));
</script>

<style scoped>
.invite-page{min-height:100vh;padding:30rpx 28rpx 180rpx;background:#f7f7f5}.form-wrap,.result-wrap{display:flex;flex-direction:column}.eyebrow{color:#315c4d;font-size:28rpx;font-weight:600}.title{margin-top:12rpx;font-size:42rpx;font-weight:700}.sub{margin-top:8rpx;color:#858c87;font-size:32rpx}.field{margin-top:28rpx}.label{margin-bottom:10rpx;display:flex;justify-content:space-between;font-size:32rpx;font-weight:600}.label text:last-child{color:#8b918d;font-size:26rpx;font-weight:400}.field input,.picker-row{height:88rpx;padding:0 22rpx;display:flex;align-items:center;background:#fff;border:1rpx solid #dfe2dd;border-radius:10rpx;font-size:32rpx}.picker-row{justify-content:space-between}.picker-row text:last-child{color:#9ca29e;font-size:32rpx}.muted{color:#8b918d}.privacy{margin-top:24rpx;padding:20rpx;display:flex;gap:14rpx;border-radius:13rpx;background:#e4ece7;color:#555e58;font-size:28rpx;line-height:1.6}.privacy text:first-child{color:#315c4d;font-size:32rpx}.submit-bar{position:fixed;left:0;right:0;bottom:0;padding:18rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));background:#fff;border-top:1rpx solid #dedfd9}.copy-button{height:88rpx;line-height:88rpx;margin-top:10rpx;background:#fff;color:#315c4d;font-size:32rpx}.pair-visual{margin:90rpx 0 36rpx;display:flex;align-items:center;justify-content:center}.avatar{width:118rpx;height:118rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#ffe1d5;color:#795548;font-size:38rpx;font-weight:700;border:6rpx solid #fff}.avatar.other{background:#f0dfeb;color:#7a526a}.line{position:relative;width:140rpx;height:4rpx;background:#b9cec3}.line text{position:absolute;left:50%;top:-17rpx;transform:translateX(-50%);padding:5rpx 10rpx;background:#e4ece7;color:#315c4d;border-radius:10rpx;font-size:26rpx;white-space:nowrap}.result-wrap{text-align:center}.result-title{font-size:34rpx;font-weight:700}.result-sub{margin:12rpx 30rpx;color:#858c87;font-size:32rpx;line-height:1.6}.code-card{margin-top:36rpx;padding:28rpx;display:flex;flex-direction:column;background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx}.code{color:#315c4d;font-size:48rpx;font-weight:700;letter-spacing:6rpx}.code-card text:last-child{margin-top:8rpx;color:#8b918d;font-size:26rpx}
</style>
