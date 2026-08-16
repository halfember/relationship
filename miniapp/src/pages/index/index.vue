<template>
  <view class="page-shell home-page">
    <view class="home-head">
      <view><text class="date-label">{{ dateText }}</text><text class="home-title">{{ greeting }}</text></view>
      <view class="head-actions">
        <button aria-label="新建记录" @tap="openCreateMenu">＋</button>
        <view class="avatar" @tap="goProfile"><image v-if="store.userInfo?.avatar" :src="store.userInfo.avatar" mode="aspectFill" /><text v-else>{{ displayName.slice(0, 1) }}</text></view>
      </view>
    </view>

    <view v-if="loading" class="next-card loading-card"><view></view><view></view><view></view></view>
    <view v-else-if="nearestReminder" class="next-card" @tap="goReminder(nearestReminder)">
      <view class="next-date"><text>{{ dayNumber(nearestReminder.eventDate) }}</text><text>{{ monthLabel(nearestReminder.eventDate) }}</text></view>
      <view class="next-copy">
        <text class="next-kicker">下一件重要的事</text>
        <text class="next-title">{{ nearestReminder.eventTitle }}</text>
        <text class="next-person">{{ personName(nearestReminder) }} · {{ formatWeekDate(nearestReminder.eventDate) }}</text>
      </view>
      <view class="countdown"><text>{{ eventDays(nearestReminder) === 0 ? '今天' : eventDays(nearestReminder) }}</text><text v-if="eventDays(nearestReminder) !== 0">天后</text></view>
      <view class="next-actions">
        <button @tap.stop="openAI('blessing', nearestReminder)">写祝福</button>
        <button @tap.stop="openAI('gift', nearestReminder)">礼物建议</button>
      </view>
    </view>
    <view v-else class="next-card empty-next" @tap="addEvent">
      <view class="empty-date-mark">＋</view>
      <view><text>添加一个重要日</text><text>生日、纪念日或下一次见面</text></view>
      <text>›</text>
    </view>

    <view class="week-section">
      <view class="section-head"><text>未来一周</text><text @tap="goCalendar">查看日历</text></view>
      <view class="week-strip">
        <view v-for="day in weekDays" :key="day.key" :class="{ today: day.isToday, busy: day.count }" @tap="goCalendarDay(day.key)">
          <text>{{ day.weekday }}</text><text>{{ day.day }}</text><text class="day-dot"></text>
        </view>
      </view>
      <view v-if="weekReminders.length" class="agenda-list">
        <view v-for="item in weekReminders" :key="reminderKey(item)" class="agenda-row" @tap="goReminder(item)">
          <view class="agenda-avatar">{{ personName(item).slice(0, 1) }}</view>
          <view><text>{{ item.eventTitle }}</text><text>{{ personName(item) }}</text></view>
          <view class="agenda-when"><text>{{ eventDays(item) === 0 ? '今天' : `${eventDays(item)}天后` }}</text><text>{{ shortDate(item.eventDate) }}</text></view>
        </view>
      </view>
      <view v-else-if="!loading" class="quiet-empty">这一周没有需要准备的日子</view>
    </view>

    <view class="people-section">
      <view class="section-head"><text>最近关注</text><text @tap="goRelationships">全部联系人</text></view>
      <view v-if="focusPeople.length" class="people-list">
        <view v-for="(item,index) in focusPeople" :key="item.id" class="person-row" @tap="goDetail(item.id)">
          <view class="person-avatar" :class="`tone-${index % 4}`">{{ item.name.slice(0, 1) }}</view>
          <view class="person-copy"><text>{{ item.name }}</text><text>{{ item.type }} · {{ item._count?.memories || 0 }} 条回忆</text></view>
          <view v-if="nextFor(item.id)" class="person-next"><text>{{ eventDays(nextFor(item.id)) === 0 ? '今天' : `${eventDays(nextFor(item.id))}天后` }}</text><text>{{ nextFor(item.id).eventTitle }}</text></view>
          <text v-else class="row-arrow">›</text>
        </view>
      </view>
      <view v-else-if="!loading" class="add-person-row" @tap="goCreateRelationship"><text>＋</text><view><text>添加第一个联系人</text><text>从一个重要的人开始</text></view><text>›</text></view>
    </view>

    <view v-if="spaces.length" class="shared-row" @tap="chooseSpace"><view>共</view><view><text>{{ spaces[0].name }}</text><text>共同日历与回忆</text></view><text>›</text></view>
    <BottomNav v-if="store.isLogin" active="home" :reminder-count="todayReminders.length" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onHide, onShow, onUnload } from '@dcloudio/uni-app';
import BottomNav from '@/components/BottomNav.vue';
import { store } from '@/store/index.js';
import { relationshipApi } from '@/api/relationship.js';
import { eventApi } from '@/api/event.js';
import { spaceApi } from '@/api/space.js';
import { openContactCreationMenu } from '@/utils/contactCreation.js';
import { trackEvent } from '@/utils/analytics.js';

const relationships=ref([]),todayReminders=ref([]),upcomingReminders=ref([]),spaces=ref([]),loading=ref(true);
const displayName=computed(()=>store.userInfo?.nickname||'你');
const dateText=computed(()=>{const d=new Date(),days=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];return `${d.getMonth()+1}月${d.getDate()}日 · ${days[d.getDay()]}`;});
const greeting=computed(()=>{const hour=new Date().getHours(),name=store.userInfo?.nickname||'';return `${hour<11?'早上好':hour<18?'下午好':'晚上好'}${name?`，${name}`:''}`;});
const reminderKey=item=>`${item.sourceType||'RELATIONSHIP'}:${item.eventId||item.sharedEventId}:${item.eventDate}`;
const allReminders=computed(()=>{const map=new Map();for(const item of [...todayReminders.value,...upcomingReminders.value])if(!map.has(reminderKey(item)))map.set(reminderKey(item),item);return [...map.values()].sort((a,b)=>eventDays(a)-eventDays(b));});
const nearestReminder=computed(()=>allReminders.value[0]||null);
const weekReminders=computed(()=>allReminders.value.filter(item=>eventDays(item)<=7).slice(0,4));
const weekDays=computed(()=>Array.from({length:7},(_,index)=>{const date=new Date();date.setHours(0,0,0,0);date.setDate(date.getDate()+index);const key=toDateKey(date);return{key,day:date.getDate(),weekday:['日','一','二','三','四','五','六'][date.getDay()],isToday:index===0,count:allReminders.value.filter(item=>toDateKey(new Date(item.eventDate))===key).length};}));
const focusPeople=computed(()=>[...relationships.value].sort((a,b)=>{const nextA=nextFor(a.id),nextB=nextFor(b.id);if(nextA&&nextB)return eventDays(nextA)-eventDays(nextB);if(nextA)return-1;if(nextB)return 1;return Number(b._count?.memories||0)-Number(a._count?.memories||0);}).slice(0,4));

let loadGeneration=0;
const cancelPendingLoad=()=>{loadGeneration+=1;};
onHide(cancelPendingLoad);
onUnload(cancelPendingLoad);
onShow(async()=>{const generation=++loadGeneration;if(!store.isLogin){uni.reLaunch({url:'/pages/login/login'});return;}loading.value=true;try{const[people,occurrences,spaceList]=await Promise.all([relationshipApi.list(store.userId),eventApi.upcoming(90),spaceApi.list()]);if(generation!==loadGeneration)return;relationships.value=people||[];upcomingReminders.value=occurrences||[];todayReminders.value=(occurrences||[]).filter(item=>eventDays(item)===0);spaces.value=spaceList||[];trackEvent('home_viewed',{relationshipCount:relationships.value.length,upcomingCount:upcomingReminders.value.length});}finally{if(generation===loadGeneration)loading.value=false;}});
const eventDays=item=>{if(item?.daysUntilEvent!==null&&item?.daysUntilEvent!==undefined&&Number.isFinite(Number(item.daysUntilEvent)))return Math.max(0,Number(item.daysUntilEvent));const target=new Date(item?.eventDate),today=new Date();target.setHours(0,0,0,0);today.setHours(0,0,0,0);return Number.isNaN(target.getTime())?0:Math.max(0,Math.round((target-today)/86400000));};
const toDateKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const personName=item=>item.relationshipName||(item.sourceType==='SPACE'?'共同空间':'重要的人');
const nextFor=id=>allReminders.value.find(item=>item.relationshipId===id);
const dayNumber=value=>String(new Date(value).getDate()).padStart(2,'0');const monthLabel=value=>`${new Date(value).getMonth()+1}月`;const shortDate=value=>`${new Date(value).getMonth()+1}.${String(new Date(value).getDate()).padStart(2,'0')}`;
const formatWeekDate=value=>{const d=new Date(value);return['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];};
const goReminder=item=>{trackEvent('event_opened',{sourceType:item.sourceType||'RELATIONSHIP',daysUntil:eventDays(item)});uni.navigateTo({url:item.sourceType==='SPACE'?`/pages/space/detail?id=${item.sharedSpaceId}`:`/pages/relationship/detail?id=${item.relationshipId}`});};
const openAI=(type,item)=>uni.navigateTo({url:`/pages/ai/${type}?relationshipId=${item.relationshipId||''}`});
const goProfile=()=>uni.reLaunch({url:'/pages/profile/index'});const goCalendar=()=>uni.reLaunch({url:'/pages/reminder/list'});const goCalendarDay=date=>uni.reLaunch({url:`/pages/reminder/list?date=${date}`});const goRelationships=()=>uni.reLaunch({url:'/pages/relationship/list'});const goDetail=id=>uni.navigateTo({url:`/pages/relationship/detail?id=${id}`});const goCreateRelationship=()=>openContactCreationMenu();
const chooseRelationship=path=>{if(!relationships.value.length)return goCreateRelationship();uni.showActionSheet({itemList:relationships.value.map(item=>item.name),success:({tapIndex})=>uni.navigateTo({url:`${path}?relationshipId=${relationships.value[tapIndex].id}`})});};
const addEvent=()=>chooseRelationship('/pages/event/create');
const openCreateMenu=()=>uni.showActionSheet({itemList:['添加联系人','添加重要日','记录回忆'],success:({tapIndex})=>{if(tapIndex===0)goCreateRelationship();if(tapIndex===1)chooseRelationship('/pages/event/create');if(tapIndex===2)chooseRelationship('/pages/memory/create');}});
const chooseSpace=()=>uni.showActionSheet({itemList:[...spaces.value.map(item=>item.name),'管理共同空间'],success:({tapIndex})=>tapIndex<spaces.value.length?uni.navigateTo({url:`/pages/space/detail?id=${spaces.value[tapIndex].id}`}):uni.navigateTo({url:'/pages/space/list'})});
</script>

<style scoped>
.home-page{padding-top:24rpx}.home-head,.head-actions,.next-card,.empty-next,.section-head,.agenda-row,.person-row,.add-person-row,.shared-row{display:flex;align-items:center}.home-head,.section-head{justify-content:space-between}.home-head>view:first-child{display:flex;flex-direction:column}.date-label{color:#7b827d;font-size:28rpx;line-height:38rpx}.home-title{margin-top:4rpx;font-size:42rpx;line-height:56rpx;font-weight:750}.head-actions{gap:12rpx}.head-actions button{width:80rpx;height:80rpx;margin:0;padding:0;border-radius:50%;background:#fff;border:1rpx solid #dfe2dd;color:#315c4d;line-height:78rpx;font-size:36rpx}.avatar{width:80rpx;height:80rpx;overflow:hidden;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#ead3c7;color:#684d42;font-size:32rpx;font-weight:700}.avatar image{width:100%;height:100%}
.next-card{position:relative;min-height:248rpx;margin-top:26rpx;padding:28rpx 24rpx 82rpx;border:1rpx solid #dedfd9;border-radius:12rpx;background:#fff;box-shadow:0 9rpx 26rpx rgba(38,45,40,.045)}.next-date{width:96rpx;height:112rpx;margin-right:20rpx;border-right:1rpx solid #e1e3de;display:flex;flex-direction:column;justify-content:center}.next-date text:first-child{font-family:Georgia,serif;font-size:46rpx;line-height:50rpx}.next-date text:last-child{margin-top:4rpx;color:#858c87;font-size:28rpx}.next-copy{flex:1;min-width:0;display:flex;flex-direction:column}.next-kicker{color:#9a6d54;font-size:26rpx}.next-title{margin-top:7rpx;font-size:34rpx;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.next-person{margin-top:7rpx;color:#858c87;font-size:28rpx}.countdown{width:72rpx;margin-left:10rpx;display:flex;flex-direction:column;align-items:flex-end;color:#b65547}.countdown text:first-child{font-size:32rpx;font-weight:700}.countdown text:last-child{font-size:26rpx}.next-actions{position:absolute;left:24rpx;right:24rpx;bottom:16rpx;height:64rpx;display:flex;justify-content:flex-end;gap:10rpx}.next-actions button{height:64rpx;margin:0;padding:0 20rpx;border-radius:8rpx;background:#edf1ee;color:#315c4d;line-height:64rpx;font-size:28rpx}.next-actions button:last-child{background:#f3e9d8;color:#80652d}.empty-next{min-height:164rpx;padding:24rpx}.empty-date-mark{width:80rpx;height:80rpx;margin-right:18rpx;border-radius:10rpx;display:flex;align-items:center;justify-content:center;background:#e4ece7;color:#315c4d;font-size:34rpx}.empty-next>view:nth-child(2){flex:1;display:flex;flex-direction:column}.empty-next>view:nth-child(2) text:first-child{font-size:32rpx;font-weight:650}.empty-next>view:nth-child(2) text:last-child{margin-top:5rpx;color:#8b918d;font-size:28rpx}.empty-next>text{color:#9aa09c;font-size:34rpx}.loading-card{display:flex;flex-direction:column;align-items:flex-start;gap:13rpx}.loading-card view{height:18rpx;border-radius:3rpx;background:#e9ece8}.loading-card view:first-child{width:25%}.loading-card view:nth-child(2){width:60%;height:27rpx}.loading-card view:last-child{width:42%}
.week-section,.people-section{margin-top:34rpx}.section-head>text:first-child{font-size:34rpx;font-weight:700}.section-head>text:last-child{padding:12rpx 0 12rpx 20rpx;color:#315c4d;font-size:28rpx}.week-strip{height:136rpx;margin-top:12rpx;padding:8rpx 4rpx;display:grid;grid-template-columns:repeat(7,1fr);border-top:1rpx solid #e0e3de;border-bottom:1rpx solid #e0e3de}.week-strip>view{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8b918d}.week-strip>view text:first-child{font-size:26rpx}.week-strip>view text:nth-child(2){margin-top:7rpx;font-size:32rpx}.week-strip>view.today text:nth-child(2){width:58rpx;height:58rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#315c4d;color:#fff}.day-dot{position:absolute;bottom:2rpx;width:6rpx;height:6rpx;border-radius:50%}.week-strip>view.busy .day-dot{background:#c76755}.agenda-list,.people-list{margin-top:8rpx}.agenda-row,.person-row{min-height:136rpx;border-bottom:1rpx solid #e4e6e1}.agenda-avatar,.person-avatar{width:80rpx;height:80rpx;margin-right:16rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e1e9e4;color:#3d6658;font-size:30rpx;font-weight:700;flex:none}.agenda-row>view:nth-child(2),.person-copy{flex:1;min-width:0;display:flex;flex-direction:column}.agenda-row>view:nth-child(2) text:first-child,.person-copy text:first-child{font-size:32rpx;font-weight:650}.agenda-row>view:nth-child(2) text:last-child,.person-copy text:last-child{margin-top:5rpx;color:#8c938e;font-size:28rpx}.agenda-when,.person-next{width:112rpx;display:flex;flex-direction:column;align-items:flex-end}.agenda-when text:first-child,.person-next text:first-child{color:#a65749;font-size:28rpx;font-weight:650}.agenda-when text:last-child,.person-next text:last-child{width:100%;margin-top:4rpx;color:#9aa09c;font-size:26rpx;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.quiet-empty{padding:38rpx 0;border-bottom:1rpx solid #e1e4df;color:#8b918d;font-size:28rpx;text-align:center}.tone-1{background:#e8dfca;color:#745f33}.tone-2{background:#dfe5ec;color:#526576}.tone-3{background:#eadde5;color:#765264}.row-arrow{color:#9ca29e;font-size:34rpx}.add-person-row{min-height:136rpx;margin-top:8rpx;border-top:1rpx solid #e1e4df;border-bottom:1rpx solid #e1e4df}.add-person-row>text:first-child{width:80rpx;height:80rpx;margin-right:16rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e4ece7;color:#315c4d;font-size:34rpx}.add-person-row>view{flex:1;display:flex;flex-direction:column}.add-person-row>view text:first-child{font-size:32rpx;font-weight:650}.add-person-row>view text:last-child{margin-top:5rpx;color:#8b918d;font-size:28rpx}.add-person-row>text:last-child{color:#9ca29e;font-size:34rpx}.shared-row{min-height:128rpx;margin-top:30rpx;padding:12rpx 0;border-top:1rpx solid #e0e3de}.shared-row>view:first-child{width:64rpx;height:64rpx;margin-right:16rpx;border-radius:9rpx;display:flex;align-items:center;justify-content:center;background:#f1e6d2;color:#80662f;font-size:28rpx;font-weight:700}.shared-row>view:nth-child(2){flex:1;display:flex;flex-direction:column}.shared-row>view:nth-child(2) text:first-child{font-size:32rpx;font-weight:650}.shared-row>view:nth-child(2) text:last-child{margin-top:4rpx;color:#8b918d;font-size:28rpx}.shared-row>text{color:#9ca29e;font-size:34rpx}
</style>
