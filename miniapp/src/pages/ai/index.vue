<template>
  <view class="page-shell ai-home">
    <view class="assistant-hero">
      <view class="robot">
        <view class="antenna"></view><view class="robot-head"><view class="robot-screen"><text>•</text><text>•</text><view class="smile"></view></view></view><view class="robot-body">AI</view>
      </view>
      <text class="hero-title">Hi，我是你的关系助手</text>
      <text class="hero-subtitle">我可以帮你更好地维系重要关系</text>
    </view>
    <view class="tool-grid">
      <view v-for="item in tools" :key="item.title" class="tool-card" @tap="go(item.url)">
        <view class="tool-icon" :style="{background:item.bg,color:item.color}">{{ item.icon }}</view>
        <text class="tool-title">{{ item.title }}</text><text class="tool-desc">{{ item.desc }}</text>
      </view>
    </view>
    <text class="section-heading recent-title">最近使用</text>
    <view v-if="records.length" class="recent-list">
      <view v-for="item in records.slice(0,3)" :key="item.id" class="recent-row"><view class="recent-icon">✦</view><view><text class="recent-name">{{ recordTitle(item.type) }}</text><text class="recent-desc">{{ item.prompt }}</text></view><text class="recent-time">最近</text></view>
    </view>
    <view v-else class="recent-row"><view class="recent-icon">✦</view><view><text class="recent-name">开始第一次 AI 创作</text><text class="recent-desc">选择上方工具，生成贴心内容</text></view></view>
  </view>
</template>
<script setup>
import { ref } from 'vue';import { onShow } from '@dcloudio/uni-app';import { store } from '@/store/index.js';import { aiApi } from '@/api/ai.js';
const records=ref([]);const tools=[{title:'祝福语生成',desc:'为重要日子生成祝福',icon:'✿',bg:'#eeeaff',color:'#7560e7',url:'/pages/ai/blessing'},{title:'纪念日文案',desc:'生成纪念日文案',icon:'♥',bg:'#ffe6ef',color:'#e76592',url:'/pages/ai/memory-text'},{title:'送礼建议',desc:'智能推荐合适礼物',icon:'♙',bg:'#fff0dd',color:'#ec9b2b',url:'/pages/ai/gift'},{title:'聊天话术',desc:'提供聊天建议',icon:'◌',bg:'#e8f7ef',color:'#48aa76',url:'/pages/ai/blessing'}];
onShow(async()=>{if(!store.isLogin)return uni.reLaunch({url:'/pages/login/login'});try{const data=await aiApi.records(store.userId,1,5);records.value=data?.list||[];}catch{records.value=[];}});const go=url=>uni.navigateTo({url});const recordTitle=type=>({blessing:'祝福语生成',memory:'纪念日文案',gift:'送礼建议'})[type]||'AI 助手';
</script>
<style scoped>
.ai-home{padding-top:30rpx}.assistant-hero{display:flex;flex-direction:column;align-items:center;padding:12rpx 0 38rpx}.robot{position:relative;width:150rpx;height:156rpx;margin-bottom:20rpx}.antenna{position:absolute;left:73rpx;top:0;width:5rpx;height:24rpx;background:#708699}.antenna::before{content:'';position:absolute;left:-6rpx;top:-8rpx;width:17rpx;height:17rpx;border-radius:50%;background:#ff8c69}.robot-head{position:absolute;top:22rpx;left:15rpx;width:120rpx;height:88rpx;border-radius:34rpx;background:#f9fbfd;border:5rpx solid #dce5eb;box-shadow:0 10rpx 25rpx rgba(55,86,106,.16)}.robot-screen{position:absolute;inset:14rpx 16rpx;border-radius:12rpx;background:#75d9df;color:#126d78;display:flex;align-items:center;justify-content:center;gap:28rpx;font-size:28rpx}.smile{position:absolute;bottom:14rpx;width:26rpx;height:10rpx;border-bottom:3rpx solid #126d78;border-radius:50%}.robot-body{position:absolute;left:40rpx;bottom:0;width:72rpx;height:58rpx;border-radius:18rpx 18rpx 28rpx 28rpx;background:#8ce3df;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26rpx;font-weight:700}.hero-title{font-size:32rpx;font-weight:700}.hero-subtitle{margin-top:8rpx;color:#858c87;font-size:28rpx}.tool-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16rpx}.tool-card{min-height:170rpx;padding:22rpx;background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx;display:flex;flex-direction:column}.tool-icon{width:50rpx;height:50rpx;margin-bottom:14rpx;border-radius:13rpx;display:flex;align-items:center;justify-content:center;font-size:32rpx}.tool-title{font-size:32rpx;font-weight:600}.tool-desc{margin-top:6rpx;color:#8b918d;font-size:26rpx}.recent-title{display:block;margin:34rpx 0 14rpx}.recent-list{display:flex;flex-direction:column;gap:12rpx}.recent-row{min-height:128rpx;padding:18rpx 20rpx;background:#fff;border:1rpx solid #dedfd9;border-radius:10rpx;display:flex;align-items:center}.recent-icon{width:46rpx;height:46rpx;margin-right:14rpx;border-radius:12rpx;background:#e4ece7;color:#315c4d;display:flex;align-items:center;justify-content:center}.recent-row>view:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column}.recent-name{font-size:32rpx;font-weight:600}.recent-desc{max-width:480rpx;margin-top:5rpx;color:#8b918d;font-size:26rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.recent-time{color:#9ca29e;font-size:26rpx}
</style>
