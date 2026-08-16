<template>
  <view class="memory-create">
    <view class="photo-picker" @tap="chooseImage">
      <image v-if="imagePath" :src="imagePath" mode="aspectFill"/>
      <view v-else><text>＋</text><text>添加照片</text><text>选填</text></view>
    </view>
    <view class="form-card"><text class="label">写下这段回忆</text><textarea v-model="content" maxlength="5000" placeholder="记录发生了什么、当时的心情..."/></view>
    <view class="form-card"><text class="label">回忆日期</text><picker mode="date" @change="memoryDate=$event.detail.value"><view class="picker-row"><text :class="{muted:!memoryDate}">{{ memoryDate||'选择日期（选填）' }}</text><text>›</text></view></picker></view>
    <view class="visibility">◇ 发布后，空间内的成员都能看到这条回忆</view>
    <button class="primary-button" :disabled="submitting" :loading="submitting" @tap="save">发布共同回忆</button>
  </view>
</template>

<script setup>
import { ref } from 'vue';import { onLoad } from '@dcloudio/uni-app';import { spaceApi } from '@/api/space.js';import { memoryApi } from '@/api/memory.js';
const spaceId=ref(0);const imagePath=ref('');const content=ref('');const memoryDate=ref('');const submitting=ref(false);onLoad(o=>spaceId.value=Number(o.id));
const chooseImage=()=>uni.chooseMedia({count:1,mediaType:['image'],sourceType:['album','camera'],success:r=>imagePath.value=r.tempFiles[0].tempFilePath});
const save=async()=>{if(submitting.value)return;if(!imagePath.value&&!content.value.trim())return uni.showToast({title:'请添加照片或文字',icon:'none'});submitting.value=true;try{let imageUrl='';if(imagePath.value)imageUrl=(await memoryApi.uploadImage(imagePath.value)).url;await spaceApi.createMemory(spaceId.value,{...(imageUrl?{imageUrl}:{}),...(content.value.trim()?{content:content.value.trim()}:{}),...(memoryDate.value?{memoryDate:memoryDate.value}:{})});uni.showToast({title:'共同回忆已发布',icon:'success'});setTimeout(()=>uni.navigateBack(),500);}finally{submitting.value=false;}};
</script>

<style scoped>
.memory-create{min-height:100vh;padding:24rpx 28rpx;background:#f7f7f5}.photo-picker{height:310rpx;margin-bottom:18rpx;overflow:hidden;border-radius:12rpx;background:#fff;border:1rpx dashed #d9dae4}.photo-picker image{width:100%;height:100%}.photo-picker>view{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8b918d}.photo-picker>view text:first-child{color:#315c4d;font-size:54rpx}.photo-picker>view text:nth-child(2){margin-top:8rpx;color:#303833;font-size:32rpx}.photo-picker>view text:last-child{margin-top:5rpx;font-size:26rpx}.form-card{margin-bottom:18rpx;padding:22rpx 24rpx;border-radius:10rpx;background:#fff;border:1rpx solid #dedfd9}.label{display:block;margin-bottom:14rpx;font-size:32rpx;font-weight:600}.form-card textarea{width:100%;height:190rpx;font-size:32rpx;line-height:1.7}.picker-row{height:88rpx;display:flex;align-items:center;justify-content:space-between;font-size:32rpx}.picker-row text:last-child{color:#9ca29e;font-size:32rpx}.muted{color:#8b918d}.visibility{margin:24rpx 0;padding:20rpx;border-radius:13rpx;background:#e4ece7;color:#555e58;font-size:28rpx}.primary-button{margin-top:28rpx}
</style>
