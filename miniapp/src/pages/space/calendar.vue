<template>
  <view class="calendar-page">
    <view class="tabs"><view :class="['tab',{active:mode==='upcoming'}]" @tap="mode='upcoming'">即将到来</view><view :class="['tab',{active:mode==='all'}]" @tap="mode='all'">全部</view></view>
    <view v-if="loading" class="empty">正在加载...</view>
    <block v-else v-for="group in groups" :key="group.month">
      <text class="month-title">{{ group.month }}月</text>
      <view class="timeline"><view v-for="item in group.items" :key="item.id" class="event-card" @longpress="remove(item)"><text class="date">{{ formatDate(occurrence(item)) }} · {{ countdown(occurrence(item)) }}</text><text class="title">{{ item.title }}</text><text class="meta">{{ item.repeatType||'不重复' }} · {{ item.createdBy?.nickname||'成员' }}添加</text></view></view>
    </block>
    <view v-if="!loading&&!filtered.length" class="empty">还没有共同纪念日</view>
    <button class="fab" @tap="add">＋</button>
  </view>
</template>

<script setup>
import { computed,ref } from 'vue';import { onLoad,onShow } from '@dcloudio/uni-app';import { spaceApi } from '@/api/space.js';
const spaceId=ref(0);const events=ref([]);const loading=ref(true);const mode=ref('upcoming');onLoad(o=>spaceId.value=Number(o.id));onShow(async()=>{if(!spaceId.value)return;loading.value=true;try{events.value=await spaceApi.events(spaceId.value)||[];}finally{loading.value=false;}});
const occurrence=item=>item.nextOccurrence||item.eventDate;const filtered=computed(()=>mode.value==='all'?events.value:events.value.filter(item=>item.nextOccurrence));const groups=computed(()=>{const map={};filtered.value.forEach(item=>{const m=new Date(occurrence(item)).getMonth()+1;(map[m]||(map[m]=[])).push(item);});return Object.entries(map).map(([month,items])=>({month,items}));});
const formatDate=v=>{const d=new Date(v);return `${d.getMonth()+1}月${d.getDate()}日`;};const countdown=v=>{const d=new Date(v);const now=new Date();d.setHours(0,0,0,0);now.setHours(0,0,0,0);const n=Math.round((d-now)/86400000);return n===0?'今天':n>0?`还有${n}天`:`已过去${Math.abs(n)}天`;};const add=()=>uni.navigateTo({url:`/pages/space/event-create?id=${spaceId.value}`});
const remove=item=>uni.showModal({title:'删除纪念日',content:`确认删除“${item.title}”？`,confirmColor:'#d85858',success:async r=>{if(r.confirm){await spaceApi.removeEvent(spaceId.value,item.id);events.value=events.value.filter(e=>e.id!==item.id);}}});
</script>

<style scoped>
.calendar-page{min-height:100vh;padding:24rpx 28rpx 130rpx;background:#f7f7f5}.tabs{padding:6rpx;display:grid;grid-template-columns:1fr 1fr;background:#e9ece8;border-radius:10rpx}.tab{height:76rpx;display:flex;align-items:center;justify-content:center;color:#737a75;font-size:28rpx;border-radius:10rpx}.tab.active{background:#fff;color:#202522;font-weight:600}.month-title{display:block;margin:30rpx 0 12rpx;font-size:32rpx;font-weight:700}.timeline{margin-left:20rpx;padding-left:28rpx;border-left:2rpx solid #dfe2dd}.event-card{position:relative;margin-bottom:14rpx;padding:20rpx 22rpx;display:flex;flex-direction:column;background:#fff;border:1rpx solid #dedfd9;border-radius:10rpx}.event-card::before{content:'';position:absolute;left:-36rpx;top:36rpx;width:14rpx;height:14rpx;border-radius:50%;background:#e96d68;border:4rpx solid #f7f7f5}.date{color:#e96d68;font-size:26rpx;font-weight:600}.title{margin-top:8rpx;font-size:32rpx;font-weight:600}.meta{margin-top:5rpx;color:#8b918d;font-size:26rpx}.empty{margin-top:100rpx;text-align:center;color:#8b918d}.fab{position:fixed;right:28rpx;bottom:calc(28rpx + env(safe-area-inset-bottom));width:88rpx;height:88rpx;line-height:88rpx;padding:0;border-radius:50%;background:#315c4d;color:#fff;font-size:40rpx;box-shadow:0 12rpx 26rpx rgba(49,92,77,.18)}
</style>
