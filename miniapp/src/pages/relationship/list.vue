<template>
  <view class="page-shell contacts-page">
    <view class="page-head">
      <view><text class="page-title">联系人</text><text class="page-meta">{{ list.length }} 个重要的人</text></view>
      <button aria-label="添加联系人" @tap="add">＋</button>
    </view>

    <view v-if="attentionPeople.length" class="attention-section">
      <view class="section-head"><text>近期需要留意</text><text>{{ attentionPeople.length }} 人</text></view>
      <scroll-view class="attention-scroll" scroll-x :show-scrollbar="false">
        <view class="attention-track">
          <view v-for="(item,index) in attentionPeople" :key="item.id" class="attention-item" @tap="goDetail(item.id)">
            <view class="attention-avatar" :class="`tone-${index%4}`">{{ item.name.slice(0,1) }}</view>
            <view><text>{{ item.name }}</text><text>{{ nextFor(item.id).eventTitle }}</text></view>
            <view class="attention-days"><text>{{ eventDays(nextFor(item.id))===0?'今天':eventDays(nextFor(item.id)) }}</text><text v-if="eventDays(nextFor(item.id))!==0">天后</text></view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="search-box"><text>⌕</text><input v-model="keyword" placeholder="搜索姓名" confirm-type="search"/><text v-if="keyword" @tap="keyword=''">×</text></view>
    <scroll-view class="filters" scroll-x :show-scrollbar="false"><view class="filter-track"><view v-for="item in filterRows" :key="item.label" :class="{active:type===item.label}" @tap="type=item.label"><text>{{item.label}}</text><text>{{item.count}}</text></view></view></scroll-view>

    <view v-if="loading" class="loading-list"><view v-for="item in 4" :key="item"><text></text><text></text></view></view>
    <view v-else-if="groupedVisible.length" class="contact-groups">
      <view v-for="group in groupedVisible" :key="group.type" class="contact-group">
        <view class="group-head"><text>{{group.type}}</text><text>{{group.items.length}}</text></view>
        <view class="group-list">
          <view v-for="(item,index) in group.items" :key="item.id" class="contact-row" @tap="goDetail(item.id)">
            <view class="contact-avatar" :class="`tone-${index%4}`">{{item.name.slice(0,1)}}</view>
            <view class="contact-copy"><view class="contact-name"><text>{{item.name}}</text><text v-if="connectionMap[item.id]" class="connected-badge">已连接</text></view><text>{{item._count?.memories||0}} 条回忆 · {{item._count?.events||0}} 个重要日</text></view>
            <view v-if="nextFor(item.id)" class="contact-next"><text>{{dayLabel(eventDays(nextFor(item.id)))}}</text><text>{{nextFor(item.id).eventTitle}}</text></view>
            <text v-else class="arrow">›</text>
          </view>
        </view>
      </view>
    </view>
    <view v-else class="empty-state"><view>人</view><text>{{keyword||type!=='全部'?'没有找到联系人':'还没有联系人'}}</text><text>{{keyword||type!=='全部'?'试试其他姓名或关系类型':'从一个重要的人开始记录'}}</text><button v-if="!keyword&&type==='全部'" @tap="add">添加联系人</button></view>

    <BottomNav v-if="store.isLogin" active="relationships" :reminder-count="todayReminders.length" />
  </view>
</template>

<script setup>
import {computed,ref} from 'vue';import{onHide,onShow,onUnload}from'@dcloudio/uni-app';import BottomNav from '@/components/BottomNav.vue';import{store}from'@/store/index.js';import{relationshipApi}from'@/api/relationship.js';import{eventApi}from'@/api/event.js';import{contactApi}from'@/api/contact.js';import{openContactCreationMenu}from'@/utils/contactCreation.js';
const list=ref([]),reminders=ref([]),todayReminders=ref([]),connections=ref([]),loading=ref(true),keyword=ref(''),type=ref('全部');const relationTypes=['家人','朋友','恋人','同事','同学','其他'];
const connectionMap=computed(()=>Object.fromEntries(connections.value.filter(item=>item.relationship?.id).map(item=>[item.relationship.id,item])));
const filterRows=computed(()=>[{label:'全部',count:list.value.length},...relationTypes.map(label=>({label,count:list.value.filter(item=>item.type===label).length})).filter(item=>item.count)]);
const visible=computed(()=>list.value.filter(item=>(type.value==='全部'||item.type===type.value)&&(!keyword.value.trim()||item.name.toLowerCase().includes(keyword.value.trim().toLowerCase()))));
const sortedVisible=computed(()=>[...visible.value].sort((a,b)=>{const nextA=nextFor(a.id),nextB=nextFor(b.id);if(nextA&&nextB)return eventDays(nextA)-eventDays(nextB);if(nextA)return-1;if(nextB)return 1;return a.name.localeCompare(b.name,'zh-CN');}));
const groupedVisible=computed(()=>relationTypes.map(groupType=>({type:groupType,items:sortedVisible.value.filter(item=>item.type===groupType)})).filter(group=>group.items.length));
const attentionPeople=computed(()=>[...list.value].filter(item=>nextFor(item.id)&&eventDays(nextFor(item.id))<=30).sort((a,b)=>eventDays(nextFor(a.id))-eventDays(nextFor(b.id))).slice(0,6));
let loadGeneration=0;const cancelPendingLoad=()=>{loadGeneration+=1;};onHide(cancelPendingLoad);onUnload(cancelPendingLoad);
onShow(async()=>{const generation=++loadGeneration;if(!store.isLogin){uni.reLaunch({url:'/pages/login/login'});return;}loading.value=true;try{const[people,occurrences,linked]=await Promise.all([relationshipApi.list(store.userId),eventApi.upcoming(90),contactApi.list().catch(()=>[])]);if(generation!==loadGeneration)return;list.value=people||[];connections.value=linked||[];reminders.value=occurrences||[];todayReminders.value=(occurrences||[]).filter(item=>eventDays(item)===0);}finally{if(generation===loadGeneration)loading.value=false;}});
const eventDays=item=>{if(item?.daysUntilEvent!==null&&item?.daysUntilEvent!==undefined&&Number.isFinite(Number(item.daysUntilEvent)))return Math.max(0,Number(item.daysUntilEvent));const target=new Date(item?.eventDate),today=new Date();target.setHours(0,0,0,0);today.setHours(0,0,0,0);return Number.isNaN(target.getTime())?0:Math.max(0,Math.round((target-today)/86400000));};const nextFor=id=>reminders.value.find(item=>item.relationshipId===id);const dayLabel=days=>days===0?'今天':`${days}天后`;const goDetail=id=>uni.navigateTo({url:`/pages/relationship/detail?id=${id}`});
const add=()=>openContactCreationMenu();
</script>

<style scoped>
.contacts-page{padding-top:24rpx}.page-head,.section-head,.attention-item,.search-box,.filter-track,.group-head,.contact-row{display:flex;align-items:center}.page-head,.section-head,.group-head{justify-content:space-between}.page-head>view{display:flex;flex-direction:column}.page-meta{margin-top:4rpx;color:#858c87;font-size:28rpx}.page-head button{width:80rpx;height:80rpx;margin:0;padding:0;border-radius:50%;background:#315c4d;color:#fff;line-height:78rpx;font-size:36rpx}.attention-section{margin-top:30rpx}.section-head text:first-child{font-size:34rpx;font-weight:700}.section-head text:last-child{color:#8b918d;font-size:28rpx}.attention-scroll{width:calc(100% + 28rpx);margin-top:14rpx}.attention-track{width:max-content;display:flex;gap:12rpx;padding-right:28rpx}.attention-item{width:430rpx;min-height:132rpx;padding:18rpx;border:1rpx solid #dedfd9;border-radius:10rpx;background:#fff}.attention-avatar,.contact-avatar{width:80rpx;height:80rpx;margin-right:16rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e1e9e4;color:#3e6658;font-size:30rpx;font-weight:700;flex:none}.attention-item>view:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column}.attention-item>view:nth-child(2) text:first-child{font-size:32rpx;font-weight:650}.attention-item>view:nth-child(2) text:last-child{margin-top:4rpx;color:#8b918d;font-size:28rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.attention-days{width:58rpx;display:flex;flex-direction:column;align-items:flex-end;color:#af5749}.attention-days text:first-child{font-size:28rpx;font-weight:700}.attention-days text:last-child{font-size:26rpx}
.search-box{height:92rpx;margin-top:30rpx;padding:0 20rpx;border:1rpx solid #dfe2dd;border-radius:10rpx;background:#fff}.search-box>text:first-child{margin-right:12rpx;color:#737b76;font-size:34rpx}.search-box input{flex:1;height:90rpx;font-size:32rpx}.search-box>text:last-child{width:44rpx;text-align:center;color:#9ba19d;font-size:34rpx}.filters{width:calc(100% + 28rpx);margin-top:14rpx}.filter-track{width:max-content;gap:8rpx;padding-right:28rpx}.filter-track>view{height:68rpx;padding:0 20rpx;display:flex;align-items:center;gap:8rpx;border-radius:8rpx;color:#747b76;font-size:28rpx}.filter-track>view text:last-child{color:#9ca29e;font-size:26rpx}.filter-track>view.active{background:#e4ece7;color:#315c4d;font-weight:650}.contact-groups{margin-top:24rpx}.contact-group{margin-bottom:26rpx}.group-head{margin-bottom:8rpx}.group-head text:first-child{font-size:34rpx;font-weight:700}.group-head text:last-child{color:#929894;font-size:28rpx}.group-list{border-top:1rpx solid #dfe2dd;border-bottom:1rpx solid #dfe2dd}.contact-row{min-height:140rpx;border-bottom:1rpx solid #e5e7e2}.contact-row:last-child{border-bottom:0}.contact-copy{flex:1;min-width:0;display:flex;flex-direction:column}.contact-copy text:first-child{font-size:32rpx;font-weight:650}.contact-copy text:last-child{margin-top:5rpx;color:#8b918d;font-size:28rpx}.contact-next{width:120rpx;display:flex;flex-direction:column;align-items:flex-end}.contact-next text:first-child{color:#a95648;font-size:28rpx;font-weight:650}.contact-next text:last-child{width:100%;margin-top:4rpx;color:#9ba19d;font-size:26rpx;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.arrow{color:#9ca29e;font-size:34rpx}.tone-1{background:#e9dfc9;color:#735e32}.tone-2{background:#dee5ec;color:#536676}.tone-3{background:#eadde5;color:#765264}.loading-list{margin-top:30rpx}.loading-list view{height:140rpx;display:flex;align-items:center;border-bottom:1rpx solid #e2e5e0}.loading-list text:first-child{width:80rpx;height:80rpx;margin-right:16rpx;border-radius:50%;background:#e7ebe7}.loading-list text:last-child{width:42%;height:20rpx;border-radius:3rpx;background:#e7ebe7}.empty-state{min-height:530rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#89908c}.empty-state>view{width:88rpx;height:88rpx;margin-bottom:18rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e4ece7;color:#315c4d;font-size:34rpx}.empty-state>text:nth-child(2){color:#303934;font-size:34rpx;font-weight:700}.empty-state>text:nth-child(3){margin-top:7rpx;font-size:28rpx}.empty-state button{height:88rpx;margin-top:22rpx;padding:0 28rpx;border-radius:9rpx;background:#315c4d;color:#fff;line-height:88rpx;font-size:30rpx}
</style>
