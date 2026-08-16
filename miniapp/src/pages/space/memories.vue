<template>
  <view class="memories-page">
    <view class="tabs"><view v-for="item in tabs" :key="item.key" :class="['tab',{active:filter===item.key}]" @tap="filter=item.key">{{ item.label }}</view></view>
    <view v-if="visible.length" class="memory-grid"><view v-for="item in visible" :key="item.id" class="memory-card" @tap="open(item)" @longpress="remove(item)"><image v-if="item.imageUrl" :src="item.imageUrl" mode="aspectFill"/><view v-else class="text-art">{{ (item.content||'回忆').slice(0,12) }}</view><view class="copy"><text>{{ item.content||'一张共同照片' }}</text><text>{{ item.createdBy?.nickname||'成员' }} · {{ formatDate(item.memoryDate||item.createdAt) }}</text></view></view></view>
    <view v-else class="empty">还没有符合条件的共同回忆</view>
    <button class="fab" @tap="add">＋</button>
  </view>
</template>

<script setup>
import { computed,ref } from 'vue';import { onLoad,onShow } from '@dcloudio/uni-app';import { spaceApi } from '@/api/space.js';
const spaceId=ref(0);const memories=ref([]);const filter=ref('all');const tabs=[{key:'all',label:'全部'},{key:'photo',label:'照片'},{key:'text',label:'故事'}];const visible=computed(()=>filter.value==='all'?memories.value:filter.value==='photo'?memories.value.filter(i=>i.imageUrl):memories.value.filter(i=>!i.imageUrl));onLoad(o=>spaceId.value=Number(o.id));onShow(async()=>{if(spaceId.value)memories.value=await spaceApi.memories(spaceId.value)||[];});
const formatDate=v=>{const d=new Date(v);return `${d.getMonth()+1}月${d.getDate()}日`;};const open=item=>item.imageUrl&&uni.previewImage({urls:[item.imageUrl]});const add=()=>uni.navigateTo({url:`/pages/space/memory-create?id=${spaceId.value}`});
const remove=item=>uni.showModal({title:'删除共同回忆',content:'只有发布人或空间管理员可以删除。确认继续？',confirmColor:'#d85858',success:async r=>{if(r.confirm){await spaceApi.removeMemory(spaceId.value,item.id);memories.value=memories.value.filter(m=>m.id!==item.id);}}});
</script>

<style scoped>
.memories-page{min-height:100vh;padding:24rpx 28rpx 130rpx;background:#f7f7f5}.tabs{padding:6rpx;display:grid;grid-template-columns:repeat(3,1fr);background:#e9ece8;border-radius:10rpx}.tab{height:76rpx;display:flex;align-items:center;justify-content:center;color:#737a75;font-size:28rpx;border-radius:10rpx}.tab.active{background:#fff;color:#202522;font-weight:600}.memory-grid{margin-top:22rpx;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14rpx}.memory-card{overflow:hidden;background:#fff;border:1rpx solid #dedfd9;border-radius:10rpx}.memory-card image,.text-art{width:100%;height:220rpx}.text-art{padding:24rpx;display:flex;align-items:flex-end;background:#eaf1f8;color:#4e6b82;font-size:32rpx;font-weight:600;word-break:break-all}.memory-card:nth-child(3n+2) .text-art{background:#f5e2df;color:#7c5751}.memory-card:nth-child(3n) .text-art{background:#e2f1e7;color:#52735d}.copy{padding:16rpx;display:flex;flex-direction:column}.copy text:first-child{font-size:28rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.copy text:last-child{margin-top:6rpx;color:#8b918d;font-size:26rpx}.empty{margin-top:120rpx;text-align:center;color:#8b918d}.fab{position:fixed;right:28rpx;bottom:calc(28rpx + env(safe-area-inset-bottom));width:88rpx;height:88rpx;line-height:88rpx;padding:0;border-radius:50%;background:#315c4d;color:#fff;font-size:40rpx;box-shadow:0 12rpx 26rpx rgba(49,92,77,.18)}
</style>
