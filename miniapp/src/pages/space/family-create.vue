<template>
  <view class="family-create">
    <view class="family-mark">家</view>
    <text class="title">创建家庭空间</text>
    <text class="sub">先建立一个空间，再慢慢添加家人、生日和共同回忆。</text>
    <view class="field"><text>空间名称</text><input v-model="name" maxlength="64" placeholder="例如：我们的家" /></view>
    <view class="preview"><view class="avatar">{{ (name || '家').slice(0,1) }}</view><view><text>{{ name || '我们的家' }}</text><text>你将成为空间创建者</text></view></view>
    <view class="tip">家人暂时不使用与你AI，也可以先为TA建立家庭档案。</view>
    <button class="primary-button" :disabled="submitting" :loading="submitting" @tap="create">创建并添加家人</button>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { store } from '@/store/index.js';
import { spaceApi } from '@/api/space.js';
const name=ref('我们的家'); const submitting=ref(false);
const create=async()=>{
  if(submitting.value)return;
  if(!store.isLogin)return uni.reLaunch({url:'/pages/login/login'});
  if(!name.value.trim())return uni.showToast({title:'请输入空间名称',icon:'none'});
  submitting.value=true;
  try{const space=await spaceApi.createFamily({name:name.value.trim()});uni.redirectTo({url:`/pages/space/detail?id=${space.id}&created=1`});}finally{submitting.value=false;}
};
</script>

<style scoped>
.family-create{min-height:100vh;padding:70rpx 28rpx;background:#f7f7f5;display:flex;flex-direction:column;align-items:center}.family-mark{width:124rpx;height:124rpx;border-radius:12rpx;background:#e4ece7;color:#315c4d;display:flex;align-items:center;justify-content:center;font-size:48rpx;font-weight:700}.title{margin-top:28rpx;font-size:42rpx;font-weight:700}.sub{max-width:580rpx;margin-top:12rpx;color:#858c87;font-size:32rpx;line-height:1.7;text-align:center}.field{width:100%;margin-top:50rpx}.field>text{display:block;margin-bottom:12rpx;font-size:32rpx;font-weight:600}.field input{height:88rpx;padding:0 22rpx;background:#fff;border:1rpx solid #dfe2dd;border-radius:9rpx;font-size:28rpx}.preview{width:100%;margin-top:20rpx;padding:22rpx;display:flex;align-items:center;background:#fff;border:1rpx solid #dedfd9;border-radius:9rpx}.preview .avatar{width:76rpx;height:76rpx;margin-right:18rpx;border-radius:9rpx;background:#e4ece7;color:#315c4d;display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:700}.preview>view:last-child{display:flex;flex-direction:column}.preview>view:last-child text:first-child{font-size:28rpx;font-weight:600}.preview>view:last-child text:last-child{margin-top:6rpx;color:#8b918d;font-size:26rpx}.tip{width:100%;margin:22rpx 0 34rpx;padding:20rpx;border-radius:9rpx;background:#e4ece7;color:#555e58;font-size:28rpx;line-height:1.6}.primary-button{width:100%;margin-top:auto}
</style>
