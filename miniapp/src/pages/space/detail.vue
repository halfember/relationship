<template>
  <view v-if="space" class="space-detail family">
    <view class="hero">
      <view class="hero-top"><text class="switch-label">家庭空间</text><text class="settings" @tap="goSettings">设置</text></view>
      <view class="identity">
        <view class="identity-copy"><text class="space-title">{{ space.name }}</text><text class="space-sub">{{ memberSummary }}</text></view>
        <view class="avatars"><view v-for="(member,index) in space.members.slice(0,3)" :key="member.id" :class="['avatar',`tone-${index%4}`]">{{ member.displayName.slice(0,1) }}</view></view>
      </view>
      <view v-if="nextEvent" class="next-event" @tap="goCalendar"><view class="date-box"><text>{{ day(occurrence(nextEvent)) }}</text><text>{{ month(occurrence(nextEvent)) }}月</text></view><view><text>{{ nextEvent.title }}</text><text>{{ countdown(occurrence(nextEvent)) }}</text></view><text class="arrow">›</text></view>
    </view>

    <view class="actions">
      <view @tap="goMembers"><text class="action-icon green">＋</text><text>添加家人</text></view>
      <view @tap="goEventCreate"><text class="action-icon coral">◇</text><text>纪念日</text></view>
      <view @tap="goMemoryCreate"><text class="action-icon blue">▣</text><text>共同回忆</text></view>
    </view>

    <view class="section-row"><text class="section-heading">家庭成员</text><text @tap="goMembers">查看全部 ›</text></view>
    <scroll-view scroll-x class="member-scroll"><view class="member-strip"><view v-for="(member,index) in space.members" :key="member.id" class="member-chip"><view :class="['member-avatar',`tone-${index%4}`]">{{ member.displayName.slice(0,1) }}</view><text>{{ member.displayName }}</text><text>{{ member.userId ? '已加入' : '仅档案' }}</text></view></view></scroll-view>

    <view class="section-row"><text class="section-heading">近期纪念日</text><text @tap="goCalendar">全部 ›</text></view>
    <view v-if="space.events.length" class="content-list">
      <view v-for="event in space.events.slice(0,3)" :key="event.id" class="content-row" @longpress="removeEvent(event)"><view class="date-box small"><text>{{ day(occurrence(event)) }}</text><text>{{ month(occurrence(event)) }}月</text></view><view class="content-copy"><text>{{ event.title }}</text><text>{{ event.repeatType || '不重复' }} · {{ event.createdBy?.nickname || '成员' }}添加</text></view><text class="day-pill">{{ countdown(occurrence(event)) }}</text></view>
    </view>
    <view v-else class="empty-row" @tap="goEventCreate">还没有共同纪念日，点击添加</view>

    <view class="section-row"><text class="section-heading">最近共同回忆</text><text @tap="goMemories">更多 ›</text></view>
    <view v-if="space.memories.length" class="memory-list"><view v-for="memory in space.memories.slice(0,3)" :key="memory.id" class="memory-row" @tap="previewMemory(memory)"><image v-if="memory.imageUrl" :src="memory.imageUrl" mode="aspectFill"/><view v-else class="memory-placeholder">文</view><view><text>{{ memory.content || '一张共同照片' }}</text><text>{{ memory.createdBy?.nickname || '成员' }} · {{ formatDate(memory.memoryDate || memory.createdAt) }}</text></view></view></view>
    <view v-else class="empty-row" @tap="goMemoryCreate">还没有共同回忆，点击记录</view>

    <view class="space-nav"><view @tap="reload"><text>⌂</text><text>空间</text></view><view @tap="goMembers"><text>人</text><text>成员</text></view><view @tap="goCalendar"><text>◇</text><text>日历</text></view><view @tap="goMemories"><text>▣</text><text>回忆</text></view></view>
  </view>
  <view v-else class="loading">{{ error || '正在加载共同空间...' }}</view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { spaceApi } from '@/api/space.js';
const spaceId=ref(0);const space=ref(null);const error=ref('');const justCreated=ref(false);let prompted=false;
const memberSummary=computed(()=>`${space.value?.members.length || 0}位家人 · ${(space.value?.members || []).filter(item=>item.userId).length}位已加入`);
const nextEvent=computed(()=>space.value?.events?.find(item=>item.nextOccurrence));
onLoad(options=>{spaceId.value=Number(options.id);justCreated.value=options.created==='1';});
onShow(()=>{if(spaceId.value)reload();});
const reload=async()=>{try{const detail=await spaceApi.detail(spaceId.value);if(detail.type!=='FAMILY'){space.value=null;error.value='该空间已不再支持';return;}space.value=detail;error.value='';if(justCreated.value&&!prompted){prompted=true;setTimeout(()=>uni.showModal({title:'家庭空间已创建',content:'先添加一位家人档案，让这个空间真正属于你们。',confirmText:'添加家人',success:r=>{if(r.confirm)goMemberCreate();}}),300);}}catch(e){error.value=e?.message||'空间加载失败';}};
const occurrence=item=>item.nextOccurrence||item.eventDate;const formatDate=value=>{const d=new Date(value);return `${d.getMonth()+1}月${d.getDate()}日`;};const day=value=>String(new Date(value).getDate()).padStart(2,'0');const month=value=>new Date(value).getMonth()+1;
const countdown=value=>{const target=new Date(value);const now=new Date();target.setHours(0,0,0,0);now.setHours(0,0,0,0);const days=Math.round((target-now)/86400000);return days===0?'今天':days>0?`还有${days}天`:`已过去${Math.abs(days)}天`;};
const goMembers=()=>uni.navigateTo({url:`/pages/space/members?id=${spaceId.value}&type=${space.value.type}`});const goMemberCreate=()=>uni.navigateTo({url:`/pages/space/member-create?id=${spaceId.value}`});
const goEventCreate=()=>uni.navigateTo({url:`/pages/space/event-create?id=${spaceId.value}`});const goMemoryCreate=()=>uni.navigateTo({url:`/pages/space/memory-create?id=${spaceId.value}`});
const goCalendar=()=>uni.navigateTo({url:`/pages/space/calendar?id=${spaceId.value}`});const goMemories=()=>uni.navigateTo({url:`/pages/space/memories?id=${spaceId.value}`});const goSettings=()=>uni.navigateTo({url:`/pages/space/settings?id=${spaceId.value}`});
const previewMemory=memory=>memory.imageUrl&&uni.previewImage({urls:[memory.imageUrl]});
const removeEvent=event=>uni.showModal({title:'删除纪念日',content:`确认删除“${event.title}”？`,confirmColor:'#c76755',success:async r=>{if(r.confirm){await spaceApi.removeEvent(spaceId.value,event.id);reload();}}});
</script>

<style scoped>
.space-detail{min-height:100vh;padding:0 28rpx 170rpx;background:#f7f7f5}.hero{margin:0 -28rpx;padding:24rpx 28rpx 28rpx;background:#e4ece7;border-bottom:1rpx solid #d5e0da}.space-detail.family .hero{background:#edf6f0;border-color:#dcecdf}.hero-top,.identity,.section-row,.next-event,.content-row,.memory-row{display:flex;align-items:center}.hero-top{justify-content:space-between}.switch-label{font-size:28rpx;font-weight:600;color:#315c4d}.family .switch-label{color:#4f8c64}.settings{color:#737a75;font-size:28rpx}.identity{margin-top:24rpx;justify-content:space-between}.identity-copy{flex:1;min-width:0;display:flex;flex-direction:column}.space-title{font-size:42rpx;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.space-sub{margin-top:7rpx;color:#858c87;font-size:28rpx}.avatars{display:flex;margin-left:15rpx}.avatar{width:76rpx;height:76rpx;margin-left:-18rpx;border-radius:50%;border:4rpx solid #fff;display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:700}.avatars .avatar:first-child{margin-left:0}.tone-0{background:#ffe1d5;color:#785448}.tone-1{background:#efdfeb;color:#7a526a}.tone-2{background:#dceaf8;color:#4e6b82}.tone-3{background:#e1f2e7;color:#4f735b}.next-event{margin-top:24rpx;padding:18rpx;background:#fff;border:1rpx solid #dfe2dd;border-radius:10rpx}.date-box{width:68rpx;height:68rpx;margin-right:16rpx;border-radius:10rpx;background:#fff0ee;color:#e96d68;display:flex;flex-direction:column;align-items:center;justify-content:center}.date-box text:first-child{font-size:32rpx;font-weight:700}.date-box text:last-child{font-size:26rpx}.next-event>view:nth-child(2){flex:1;display:flex;flex-direction:column}.next-event>view:nth-child(2) text:first-child{font-size:32rpx;font-weight:600}.next-event>view:nth-child(2) text:last-child{margin-top:5rpx;color:#8b918d;font-size:26rpx}.arrow{color:#9ca29e;font-size:32rpx}.actions{margin-top:22rpx;display:grid;grid-template-columns:repeat(3,1fr);gap:12rpx}.actions>view{height:128rpx;border-radius:10rpx;background:#fff;border:1rpx solid #dedfd9;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:28rpx}.action-icon{width:54rpx;height:54rpx;margin-bottom:8rpx;border-radius:10rpx;display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:700}.green{background:#e8f5ec;color:#4f9b6d}.coral{background:#fff0ee;color:#e96d68}.blue{background:#eaf1f8;color:#4e79a7}.section-row{margin:32rpx 0 14rpx;justify-content:space-between}.section-row>text:last-child{color:#858c87;font-size:28rpx}.member-strip{display:flex;gap:22rpx}.member-chip{width:82rpx;flex-shrink:0;display:flex;flex-direction:column;align-items:center}.member-avatar{width:76rpx;height:76rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:700}.member-chip>text:nth-child(2){max-width:82rpx;margin-top:7rpx;font-size:26rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.member-chip>text:last-child{margin-top:3rpx;color:#8b918d;font-size:26rpx}.content-list,.memory-list{overflow:hidden;background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx}.content-row{min-height:128rpx;padding:16rpx 18rpx;border-bottom:1rpx solid #e2e5e0}.content-row:last-child{border:0}.date-box.small{width:64rpx;height:64rpx}.date-box.small text:first-child{font-size:32rpx}.content-copy{flex:1;min-width:0;display:flex;flex-direction:column}.content-copy text:first-child{font-size:32rpx;font-weight:600}.content-copy text:last-child{margin-top:5rpx;color:#8b918d;font-size:26rpx}.day-pill{padding:8rpx 12rpx;border-radius:10rpx;background:#fff3df;color:#d9922e;font-size:26rpx}.memory-row{min-height:128rpx;padding:14rpx;border-bottom:1rpx solid #e2e5e0}.memory-row:last-child{border:0}.memory-row image,.memory-placeholder{width:76rpx;height:76rpx;margin-right:15rpx;border-radius:10rpx}.memory-placeholder{background:#eaf1f8;color:#4e79a7;display:flex;align-items:center;justify-content:center}.memory-row>view:last-child{flex:1;min-width:0;display:flex;flex-direction:column}.memory-row>view:last-child text:first-child{font-size:32rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.memory-row>view:last-child text:last-child{margin-top:6rpx;color:#8b918d;font-size:26rpx}.empty-row{padding:34rpx;text-align:center;border-radius:10rpx;background:#fff;border:1rpx solid #dedfd9;color:#8b918d;font-size:28rpx}.space-nav{position:fixed;left:0;right:0;bottom:0;height:calc(128rpx + env(safe-area-inset-bottom));padding:8rpx 20rpx env(safe-area-inset-bottom);display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border-top:1rpx solid #e2e5e0}.space-nav>view{min-height:112rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8b918d;font-size:26rpx}.space-nav>view>text:first-child{color:#315c4d;font-size:34rpx}.loading{padding:180rpx 28rpx;text-align:center;color:#8b918d}
</style>
