<template>
  <view class="event-create">
    <view class="form-card"><text class="label">纪念日名称</text><input v-model="form.title" maxlength="64" placeholder="例如：第一次旅行"/></view>
    <view class="form-card"><text class="label">日期</text><picker mode="date" @change="form.eventDate=$event.detail.value"><view class="picker-row"><text :class="{muted:!form.eventDate}">{{ form.eventDate||'选择日期' }}</text><text>›</text></view></picker></view>
    <view class="form-card"><text class="label">重复方式</text><view class="repeat-grid"><view v-for="item in repeats" :key="item.value" :class="['repeat-item',{active:form.repeatType===item.value}]" @tap="form.repeatType=item.value">{{ item.label }}</view></view></view>
    <view class="form-card"><text class="label">提醒时间</text><view class="remind-grid"><view v-for="item in remindOptions" :key="item.value" :class="['remind-item',{active:form.remindDays.includes(item.value)}]" @tap="toggleRemind(item.value)">{{ item.label }}</view></view></view>
    <view class="visibility">◇ 发布后，空间内的成员都能看到这个纪念日</view>
    <button class="primary-button" :disabled="submitting" :loading="submitting" @tap="save">保存共同纪念日</button>
  </view>
</template>

<script setup>
import { reactive,ref } from 'vue';import { onLoad } from '@dcloudio/uni-app';import { spaceApi } from '@/api/space.js';import{requestReminderSubscription}from'@/utils/reminderSubscription.js';
const spaceId=ref(0);const submitting=ref(false);const form=reactive({title:'',eventDate:'',repeatType:'每年',remindDays:[7,1]});const repeats=[{label:'不重复',value:''},{label:'每年',value:'每年'},{label:'每月',value:'每月'},{label:'每周',value:'每周'}];const remindOptions=[{label:'当天',value:0},{label:'提前1天',value:1},{label:'提前3天',value:3},{label:'提前7天',value:7}];onLoad(o=>spaceId.value=Number(o.id));
const toggleRemind=value=>{const i=form.remindDays.indexOf(value);i>=0?form.remindDays.splice(i,1):form.remindDays.push(value);};
const save=async()=>{if(submitting.value)return;if(!form.title.trim()||!form.eventDate)return uni.showToast({title:'请填写名称和日期',icon:'none'});submitting.value=true;try{const subscribed=form.remindDays.length?await requestReminderSubscription():false;await spaceApi.createEvent(spaceId.value,{title:form.title.trim(),eventDate:form.eventDate,...(form.repeatType?{repeatType:form.repeatType}:{}),remindDays:form.remindDays});uni.showToast({title:subscribed?'已获1次微信提醒':form.remindDays.length?'已保存，日程内提醒':'已保存',icon:'success'});setTimeout(()=>uni.navigateBack(),500);}finally{submitting.value=false;}};
</script>

<style scoped>
.event-create{min-height:100vh;padding:24rpx 28rpx;background:#f7f7f5}.form-card{margin-bottom:18rpx;padding:22rpx 24rpx;border-radius:10rpx;background:#fff;border:1rpx solid #dedfd9}.label{display:block;margin-bottom:15rpx;font-size:32rpx;font-weight:600}.form-card input{height:88rpx;font-size:32rpx}.picker-row{height:88rpx;display:flex;align-items:center;justify-content:space-between;font-size:32rpx}.picker-row text:last-child{color:#9ca29e;font-size:32rpx}.muted{color:#8b918d}.repeat-grid,.remind-grid{display:flex;flex-wrap:wrap;gap:12rpx}.repeat-item,.remind-item{min-height:72rpx;display:flex;align-items:center;padding:11rpx 20rpx;border-radius:22rpx;background:#edf0ec;color:#737a75;font-size:28rpx}.repeat-item.active,.remind-item.active{min-height:72rpx;display:flex;align-items:center;background:#e4ece7;color:#315c4d}.visibility{margin:24rpx 0;padding:20rpx;border-radius:13rpx;background:#e4ece7;color:#555e58;font-size:28rpx}.primary-button{margin-top:30rpx}
</style>
