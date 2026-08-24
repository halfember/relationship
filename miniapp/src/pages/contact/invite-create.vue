<template>
  <view class="page contact-create-page">
    <view class="intro">
      <text class="eyebrow">联系人连接</text>
      <text class="title">邀请对方成为联系人</text>
      <text class="sub">这只是建立联系人关系，不会创建共同空间，也不会公开你的私人记录。</text>
    </view>
    <view class="form">
      <view class="field"><text>对方称呼</text><input v-model="form.displayName" maxlength="32" placeholder="例如：小雨" /></view>
      <view class="field"><text>我与对方的关系</text><picker :range="types" range-key="label" @change="typeIndex = Number($event.detail.value)"><view class="picker"><text>{{ types[typeIndex].label }}</text><text>›</text></view></picker></view>
      <view class="field"><text>邀请留言</text><textarea v-model="form.message" maxlength="160" placeholder="告诉对方你是谁，可选" /></view>
    </view>
    <view class="privacy"><text>✓</text><text>双方接受后各自保留自己的备注、标签、事件和回忆。</text></view>
    <view v-if="pendingInvites.length" class="pending-section">
      <view class="section-title"><text>待对方接受</text><text>{{ pendingInvites.length }}</text></view>
      <view v-for="item in pendingInvites" :key="item.id" class="pending-row">
        <view><text>{{ item.displayName }}</text><text>{{ item.relationshipType }} · {{ item.token }}</text></view>
        <button @tap="revoke(item)">撤回</button>
      </view>
    </view>
    <view class="submit-bar"><button class="primary" :loading="submitting" :disabled="submitting" @tap="submit">生成联系人邀请</button><button v-if="invite" class="secondary" open-type="share">发送给微信好友</button></view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app';
import { contactApi } from '@/api/contact.js';
import { store } from '@/store/index.js';

const types = [{ label: '朋友', value: '朋友' }, { label: '家人', value: '家人' }, { label: '恋人', value: '恋人' }, { label: '同事', value: '同事' }, { label: '同学', value: '同学' }, { label: '其他', value: '其他' }];
const typeIndex = ref(0); const submitting = ref(false); const invite = ref(null);
const pendingInvites = ref([]);
const form = reactive({ displayName: '', message: '' });
const loadPending = async () => { pendingInvites.value = await contactApi.listSentInvites().catch(() => []); };
onLoad((options) => { form.displayName = decodeURIComponent(options?.name || ''); loadPending(); });
const submit = async () => {
  if (submitting.value) return;
  if (!form.displayName.trim()) return uni.showToast({ title: '请输入对方称呼', icon: 'none' });
  submitting.value = true;
  try { invite.value = await contactApi.createInvite({ displayName: form.displayName.trim(), relationshipType: types[typeIndex.value].value, message: form.message.trim() || undefined }); await loadPending(); } finally { submitting.value = false; }
};
const revoke = (item) => uni.showModal({ title: '撤回邀请', content: `撤回发给“${item.displayName}”的邀请？`, success: async ({ confirm }) => { if (!confirm) return; await contactApi.revokeInvite(item.id); if (invite.value?.id === item.id) invite.value = null; await loadPending(); uni.showToast({ title: '邀请已撤回', icon: 'success' }); } });
onShareAppMessage(() => ({ title: `${store.userInfo?.nickname || '一位朋友'}邀请你成为联系人`, path: invite.value?.path || '/pages/index/index' }));
</script>

<style scoped>
.page{min-height:100vh;padding:34rpx 28rpx 210rpx;background:#f7f7f5;color:#202522}.intro{display:flex;flex-direction:column}.eyebrow{color:#315c4d;font-size:28rpx;font-weight:600}.title{margin-top:12rpx;font-size:42rpx;font-weight:700}.sub{margin-top:10rpx;color:#858c87;font-size:30rpx;line-height:1.6}.form{margin-top:34rpx;border-top:1rpx solid #dfe2dd}.field{min-height:122rpx;display:flex;flex-direction:column;justify-content:center;border-bottom:1rpx solid #dfe2dd}.field>text{margin-bottom:12rpx;color:#68706b;font-size:28rpx}.field input,.picker, .field textarea{width:100%;box-sizing:border-box;padding:0 18rpx;background:#fff;border:1rpx solid #dfe2dd;border-radius:10rpx;font-size:32rpx}.field input,.picker{height:84rpx;display:flex;align-items:center}.picker{justify-content:space-between}.picker text:last-child{color:#9ca29e}.field textarea{height:150rpx;padding-top:16rpx;line-height:1.5}.privacy{margin-top:24rpx;padding:20rpx;display:flex;gap:12rpx;border-radius:12rpx;background:#e4ece7;color:#555e58;font-size:27rpx;line-height:1.6}.privacy text:first-child{color:#315c4d;font-weight:700}.pending-section{margin-top:32rpx;border-top:1rpx solid #dfe2dd}.section-title,.pending-row{display:flex;align-items:center;justify-content:space-between}.section-title{height:86rpx;font-size:32rpx;font-weight:700}.section-title text:last-child{color:#8b918d;font-size:27rpx}.pending-row{min-height:112rpx;border-top:1rpx solid #e3e5e1}.pending-row>view{display:flex;flex-direction:column}.pending-row>view text:first-child{font-size:31rpx;font-weight:650}.pending-row>view text:last-child{margin-top:6rpx;color:#858c87;font-size:27rpx}.pending-row button{width:112rpx;height:66rpx;margin:0;border:1rpx solid #d7dcd8;background:transparent;color:#6d746f;line-height:64rpx;font-size:27rpx}.submit-bar{position:fixed;left:0;right:0;bottom:0;padding:18rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));background:#fff;border-top:1rpx solid #dedfd9}.primary,.secondary{height:86rpx;line-height:86rpx;border-radius:9rpx;font-size:30rpx}.primary{background:#315c4d;color:#fff}.secondary{margin-top:10rpx;background:#fff;color:#315c4d}
</style>
