<template>
  <view v-if="space" class="settings-page">
    <view class="form-card"><text class="label">空间名称</text><view class="name-row"><input v-model="name" maxlength="64"/><button :loading="saving" @tap="saveName">保存</button></view></view>
    <text class="group-title">成员与内容</text><view class="list"><view class="row" @tap="goMembers"><text>成员与档案</text><text>{{ space.members.length }} 位 ›</text></view><view class="row" @tap="goCalendar"><text>共同纪念日</text><text>{{ space._count.events }} 个 ›</text></view><view class="row" @tap="goMemories"><text>共同回忆</text><text>{{ space._count.memories }} 条 ›</text></view></view>
    <text class="group-title">我的隐私</text><view class="privacy">你的私人称呼、关系类型、备注、标签、提醒和AI记录不会显示在共同空间。</view>
    <text class="group-title">空间操作</text><view class="list"><view v-if="space.type==='FAMILY'" class="row" @tap="createInvite"><text>邀请家庭成员</text><text>›</text></view><view v-if="space.currentMember.role!=='OWNER'" class="row danger" @tap="leave"><text>退出空间</text><text>›</text></view><view v-else class="row danger" @tap="dissolve"><text>解散空间</text><text>›</text></view></view>
  </view><view v-else class="loading">正在加载...</view>
</template>

<script setup>
import { ref } from 'vue';import { onLoad } from '@dcloudio/uni-app';import { spaceApi } from '@/api/space.js';
const spaceId=ref(0);const space=ref(null);const name=ref('');const saving=ref(false);onLoad(async o=>{spaceId.value=Number(o.id);space.value=await spaceApi.detail(spaceId.value);name.value=space.value.name;});
const saveName=async()=>{if(!name.value.trim())return;saving.value=true;try{await spaceApi.update(spaceId.value,{name:name.value.trim()});space.value.name=name.value.trim();uni.showToast({title:'已保存',icon:'success'});}finally{saving.value=false;}};
const goMembers=()=>uni.navigateTo({url:`/pages/space/members?id=${spaceId.value}&type=${space.value.type}`});const goCalendar=()=>uni.navigateTo({url:`/pages/space/calendar?id=${spaceId.value}`});const goMemories=()=>uni.navigateTo({url:`/pages/space/memories?id=${spaceId.value}`});
const createInvite=()=>uni.navigateTo({url:`/pages/space/members?id=${spaceId.value}&type=${space.value.type}`});
const leave=()=>uni.showModal({title:'退出空间',content:'退出后将无法继续查看共同内容，私人记录不受影响。',confirmText:'确认退出',confirmColor:'#c76755',success:async r=>{if(r.confirm){await spaceApi.leave(spaceId.value);uni.reLaunch({url:'/pages/space/list'});}}});
const dissolve=()=>uni.showModal({title:'解散空间',content:'所有成员将无法继续访问，共同内容会保留为归档数据。',confirmText:'确认解散',confirmColor:'#c76755',success:async r=>{if(r.confirm){await spaceApi.dissolve(spaceId.value);uni.reLaunch({url:'/pages/space/list'});}}});
</script>

<style scoped>
.settings-page{min-height:100vh;padding:24rpx 28rpx;background:#f7f7f5}.form-card{padding:22rpx;background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx}.label{display:block;margin-bottom:14rpx;font-size:32rpx;font-weight:600}.name-row{display:flex;gap:12rpx}.name-row input{flex:1;height:88rpx;padding:0 16rpx;background:#f7f7f5;border-radius:11rpx;font-size:32rpx}.name-row button{width:120rpx;height:88rpx;line-height:88rpx;margin:0;padding:0;border-radius:11rpx;background:#315c4d;color:#fff;font-size:28rpx}.group-title{display:block;margin:30rpx 0 10rpx;color:#8b918d;font-size:28rpx}.list{overflow:hidden;background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx}.row{height:88rpx;padding:0 22rpx;display:flex;align-items:center;justify-content:space-between;border-bottom:1rpx solid #e2e5e0;font-size:32rpx}.row:last-child{border:0}.row text:last-child{color:#8b918d;font-size:28rpx}.row.danger,.row.danger text:last-child{color:#c76755}.privacy{padding:22rpx;border-radius:10rpx;background:#e4ece7;color:#555e58;font-size:28rpx;line-height:1.7}.loading{padding:160rpx;text-align:center;color:#8b918d}
</style>
