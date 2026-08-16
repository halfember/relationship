<template>
  <view class="member-create">
    <text class="eyebrow">家庭成员档案</text><text class="title">这位家人是谁？</text><text class="sub">先记录必要信息，生日和头像可以以后完善。</text>
    <view class="field"><text>姓名或家庭称呼</text><input v-model="form.displayName" maxlength="32" placeholder="例如：外婆"/></view>
    <view class="field"><text>TA和我的关系</text><picker :range="relations" range-key="label" @change="selectRelation"><view class="picker-row"><text>{{ relations[index].label }}</text><text>›</text></view></picker></view>
    <view class="field"><view class="label"><text>生日</text><text>选填</text></view><picker mode="date" @change="form.birthday=$event.detail.value"><view class="picker-row"><text :class="{muted:!form.birthday}">{{ form.birthday||'选择日期' }}</text><text>›</text></view></picker></view>
    <view class="profile-tip"><text>人</text><view><text>先建立家庭档案</text><text>不要求对方注册，稍后可以发送绑定邀请。</text></view></view>
    <button class="primary-button" :disabled="submitting" :loading="submitting" @tap="save">保存档案</button>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';import { onLoad } from '@dcloudio/uni-app';import { spaceApi } from '@/api/space.js';
const spaceId=ref(0);const submitting=ref(false);const index=ref(0);const relations=[{label:'妈妈',generation:'ELDER'},{label:'爸爸',generation:'ELDER'},{label:'外婆',generation:'ELDER'},{label:'外公',generation:'ELDER'},{label:'姐姐',generation:'PEER'},{label:'哥哥',generation:'PEER'},{label:'妹妹',generation:'PEER'},{label:'弟弟',generation:'PEER'},{label:'配偶',generation:'PEER'},{label:'女儿',generation:'YOUNGER'},{label:'儿子',generation:'YOUNGER'},{label:'其他家人',generation:'PEER'}];
const form=reactive({displayName:'',relationLabel:'妈妈',generation:'ELDER',birthday:''});onLoad(o=>spaceId.value=Number(o.id));
const selectRelation=e=>{index.value=Number(e.detail.value);form.relationLabel=relations[index.value].label;form.generation=relations[index.value].generation;if(!form.displayName)form.displayName=form.relationLabel;};
const save=async()=>{if(submitting.value)return;if(!form.displayName.trim())return uni.showToast({title:'请输入姓名或称呼',icon:'none'});submitting.value=true;try{await spaceApi.addProfile(spaceId.value,{displayName:form.displayName.trim(),relationLabel:form.relationLabel,generation:form.generation,...(form.birthday?{birthday:form.birthday}:{})});uni.showToast({title:'档案已添加',icon:'success'});setTimeout(()=>uni.navigateBack(),500);}finally{submitting.value=false;}};
</script>

<style scoped>
.member-create{min-height:100vh;padding:38rpx 28rpx;background:#f7f7f5}.eyebrow{color:#4f9b6d;font-size:28rpx;font-weight:600}.title{display:block;margin-top:12rpx;font-size:42rpx;font-weight:700}.sub{display:block;margin-top:8rpx;color:#858c87;font-size:28rpx}.field{margin-top:30rpx}.field>text,.label{display:block;margin-bottom:10rpx;font-size:32rpx;font-weight:600}.label{display:flex;justify-content:space-between}.label text:last-child{color:#8b918d;font-size:26rpx;font-weight:400}.field input,.picker-row{height:88rpx;padding:0 22rpx;display:flex;align-items:center;justify-content:space-between;background:#fff;border:1rpx solid #dfe2dd;border-radius:10rpx;font-size:32rpx}.picker-row text:last-child{color:#9ca29e;font-size:32rpx}.muted{color:#8b918d}.profile-tip{margin:28rpx 0;padding:22rpx;display:flex;align-items:center;background:#eaf6ee;border-radius:10rpx;color:#4f765d}.profile-tip>text{width:60rpx;height:60rpx;margin-right:16rpx;border-radius:10rpx;background:#d8eddf;display:flex;align-items:center;justify-content:center;font-size:32rpx}.profile-tip>view{display:flex;flex-direction:column}.profile-tip>view text:first-child{font-size:32rpx;font-weight:600}.profile-tip>view text:last-child{margin-top:5rpx;font-size:26rpx}.primary-button{margin-top:40rpx}
</style>
