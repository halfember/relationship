<template>
  <view class="onboarding-page">
    <view class="progress"><view :class="{ active: step >= 1 }"></view><view :class="{ active: step >= 2 }"></view></view>

    <view v-if="step === 1" class="step-panel">
      <text class="step-count">1 / 2</text>
      <text class="step-title">先认识一下你</text>
      <text class="step-desc">这些信息只用于你的个人空间。</text>

      <button class="avatar-picker" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
        <image v-if="avatarPreview" :src="avatarPreview" mode="aspectFill" />
        <text v-else>＋</text>
        <view>更换头像</view>
      </button>
      <view class="field">
        <text>你的称呼</text>
        <input v-model="nickname" type="nickname" maxlength="32" placeholder="输入昵称" focus />
      </view>
      <button class="primary-action" :loading="saving" @tap="saveProfile">继续</button>
    </view>

    <view v-else class="step-panel">
      <text class="step-count">2 / 2</text>
      <text class="step-title">从一个重要的人开始</text>
      <text class="step-desc">先记下姓名和关系，其他内容可以以后补充。</text>

      <view class="field name-field">
        <text>TA 的姓名</text>
        <input v-model="relationship.name" maxlength="32" placeholder="输入姓名" focus />
      </view>
      <text class="field-label">你们的关系</text>
      <view class="type-selector">
        <view v-for="item in relationTypes" :key="item" :class="{ active: relationship.type === item }" @tap="relationship.type = item">{{ item }}</view>
      </view>
      <view class="field date-field">
        <text>生日（选填）</text>
        <picker mode="date" :value="relationship.birthday" @change="relationship.birthday = $event.detail.value">
          <view :class="{ placeholder: !relationship.birthday }">{{ relationship.birthday || '选择日期' }} <text>›</text></view>
        </picker>
      </view>

      <button class="primary-action" :loading="creating" @tap="createFirstRelationship">创建并开始</button>
      <button class="secondary-action" @tap="finish">稍后再说</button>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { store } from '@/store/index.js';
import { userApi } from '@/api/user.js';
import { memoryApi } from '@/api/memory.js';
import { relationshipApi } from '@/api/relationship.js';
import { requestReminderSubscription } from '@/utils/reminderSubscription.js';

const step = ref(1);
const nickname = ref(store.userInfo?.nickname || '');
const avatarPreview = ref(store.userInfo?.avatar || '');
const selectedAvatar = ref('');
const saving = ref(false);
const creating = ref(false);
const relationTypes = ['家人', '朋友', '恋人', '同事', '同学', '其他'];
const relationship = reactive({ name: '', type: '家人', birthday: '' });

const onChooseAvatar = ({ detail }) => { selectedAvatar.value = detail.avatarUrl; avatarPreview.value = detail.avatarUrl; };
const saveProfile = async () => {
  const name = nickname.value.trim();
  if (!name) return uni.showToast({ title: '请输入你的称呼', icon: 'none' });
  saving.value = true;
  try {
    let avatar = store.userInfo?.avatar || '';
    if (selectedAvatar.value) avatar = (await memoryApi.uploadImage(selectedAvatar.value)).url;
    const updated = await userApi.updateProfile(store.userId, { nickname: name, ...(avatar ? { avatar } : {}) });
    store.setUserInfo({ ...store.userInfo, ...updated, accessToken: store.userInfo.accessToken });
    const pendingContactToken = uni.getStorageSync('pendingContactInviteToken');
    if (pendingContactToken) return uni.reLaunch({ url: `/pages/contact/invite-accept?token=${pendingContactToken}` });
    step.value = 2;
  } catch (error) {
    uni.showToast({ title: error?.message || '资料保存失败，请重试', icon: 'none' });
  } finally { saving.value = false; }
};
const createFirstRelationship = async () => {
  const name = relationship.name.trim();
  if (!name) return uni.showToast({ title: '请输入姓名', icon: 'none' });
  creating.value = true;
  try {
    if (relationship.birthday) await requestReminderSubscription();
    await relationshipApi.create({ userId: store.userId, name, type: relationship.type, birthday: relationship.birthday || undefined });
    finish();
  } catch (error) {
    uni.showToast({ title: error?.message || '联系人创建失败，请重试', icon: 'none' });
  } finally { creating.value = false; }
};
const finish = () => uni.reLaunch({ url: '/pages/index/index' });
</script>

<style scoped>
.onboarding-page { min-height:100vh;padding:28rpx 36rpx calc(34rpx + env(safe-area-inset-bottom));background:#f7f7f5;color:#202522; }.progress { height:6rpx;display:grid;grid-template-columns:1fr 1fr;gap:8rpx; }.progress view { background:#dedfd9; }.progress view.active { background:#315c4d; }.step-panel { padding-top:52rpx; }.step-count { color:#8b918d;font-size:26rpx; }.step-title { display:block;margin-top:12rpx;font-size:44rpx;line-height:1.35;font-weight:750; }.step-desc { display:block;margin-top:10rpx;color:#777e79;font-size:30rpx;line-height:1.6; }
.avatar-picker { width:184rpx;height:218rpx;margin:60rpx auto 40rpx;padding:0;overflow:visible;display:flex;flex-direction:column;align-items:center;background:transparent;color:#315c4d;line-height:1; }.avatar-picker image,.avatar-picker > text { width:158rpx;height:158rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e1e8e3;color:#315c4d;font-size:42rpx; }.avatar-picker image { border:1rpx solid #d5dad6; }.avatar-picker view { margin-top:16rpx;font-size:28rpx; }
.field { min-height:136rpx;padding:16rpx 0;border-bottom:1rpx solid #d9ddd9;display:flex;flex-direction:column;justify-content:center; }.field > text,.field-label { color:#747b76;font-size:28rpx; }.field input { height:68rpx;margin-top:5rpx;font-size:34rpx; }.primary-action { height:100rpx;margin-top:40rpx;border-radius:10rpx;background:#315c4d;color:#fff;line-height:100rpx;font-size:34rpx;font-weight:650; }
.name-field { margin-top:48rpx; }.field-label { display:block;margin-top:32rpx; }.type-selector { margin-top:14rpx;display:grid;grid-template-columns:repeat(3,1fr);gap:10rpx; }.type-selector view { height:76rpx;border:1rpx solid #d9ddd9;border-radius:8rpx;display:flex;align-items:center;justify-content:center;background:#fff;color:#68706b;font-size:30rpx; }.type-selector view.active { border-color:#315c4d;background:#e4ece7;color:#315c4d;font-weight:650; }.date-field { margin-top:22rpx;display:grid;grid-template-columns:1fr 1fr;align-items:center; }.date-field picker { text-align:right;font-size:32rpx; }.date-field .placeholder { color:#a2a8a4; }.date-field view text { margin-left:8rpx;color:#8b918d;font-size:32rpx; }.secondary-action { height:80rpx;margin-top:10rpx;background:transparent;color:#747b76;line-height:80rpx;font-size:30rpx; }
</style>
