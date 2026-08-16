<template>
  <view class="members-page">
    <view class="tabs"><view v-for="tab in tabs" :key="tab.key" :class="['tab',{active:filter===tab.key}]" @tap="filter=tab.key">{{ tab.label }}</view></view>
    <block v-for="group in grouped" :key="group.key">
      <text v-if="group.items.length" class="group-title">{{ group.label }}</text>
      <view v-if="group.items.length" class="member-list">
        <view v-for="(member,index) in group.items" :key="member.id" class="member-row" @tap="memberAction(member)">
          <view :class="['avatar',`tone-${index%4}`]">{{ member.displayName.slice(0,1) }}</view>
          <view class="copy"><text>{{ member.displayName }}</text><text>{{ member.relationLabel || roleName(member.role) }}{{ member.birthday ? ` · ${formatYear(member.birthday)}年` : '' }}</text></view>
          <text :class="['status',{joined:member.userId}]">{{ member.userId?'已加入':'仅档案' }}</text><text class="arrow">›</text>
        </view>
      </view>
    </block>
    <view v-if="!members.length" class="empty">还没有家庭成员</view>
    <button class="add-button" @tap="add">＋ 添加成员</button>

    <view v-if="invite" class="invite-mask" @tap="invite=null"><view class="invite-sheet" @tap.stop>
      <text class="invite-title">邀请 {{ invite.targetMember?.displayName || '家人' }} 加入</text>
      <text class="invite-desc">发送微信邀请，对方登录后会绑定到现有家庭档案。</text>
      <view class="token">{{ invite.token }}</view>
      <button class="primary-button" open-type="share">发送给微信好友</button>
      <button class="copy-token" @tap="copyToken">复制邀请码</button>
    </view></view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app';
import { spaceApi } from '@/api/space.js';
const spaceId=ref(0);const type=ref('FAMILY');const members=ref([]);const filter=ref('all');const invite=ref(null);
const tabs=[{key:'all',label:'全部'},{key:'ELDER',label:'长辈'},{key:'PEER',label:'同辈'},{key:'YOUNGER',label:'晚辈'}];
const grouped=computed(()=>{const source=filter.value==='all'?members.value:members.value.filter(item=>item.generation===filter.value);return [{key:'ELDER',label:'长辈',items:source.filter(i=>i.generation==='ELDER')},{key:'PEER',label:'同辈',items:source.filter(i=>!i.generation||i.generation==='PEER')},{key:'YOUNGER',label:'晚辈',items:source.filter(i=>i.generation==='YOUNGER')}];});
onLoad(options=>{spaceId.value=Number(options.id);type.value=options.type||'FAMILY';});onShow(async()=>{if(spaceId.value)members.value=await spaceApi.members(spaceId.value)||[];});
const roleName=role=>({OWNER:'创建者',ADMIN:'管理员',MEMBER:'成员'})[role]||'成员';const formatYear=value=>new Date(value).getFullYear();
const add=()=>type.value==='FAMILY'?uni.showActionSheet({itemList:['添加家人档案','邀请新成员加入'],success:async({tapIndex})=>{if(tapIndex===0)uni.navigateTo({url:`/pages/space/member-create?id=${spaceId.value}`});if(tapIndex===1)invite.value=await spaceApi.createInvite(spaceId.value);}}):uni.showToast({title:'双人空间最多两位成员',icon:'none'});
const memberAction=member=>{if(type.value==='FAMILY'&&!member.userId)uni.showModal({title:member.displayName,content:'该成员目前只有家庭档案，是否发送账号绑定邀请？',confirmText:'生成邀请',success:async r=>{if(r.confirm)invite.value=await spaceApi.createInvite(spaceId.value,{targetMemberId:member.id});}});};
const copyToken=()=>uni.setClipboardData({data:invite.value.token});
onShareAppMessage(()=>({title:`邀请你加入家庭空间`,path:invite.value?.path||'/pages/space/list'}));
</script>

<style scoped>
.members-page{min-height:100vh;padding:24rpx 28rpx 150rpx;background:#f7f7f5}.tabs{padding:6rpx;display:grid;grid-template-columns:repeat(4,1fr);background:#e9ece8;border-radius:10rpx}.tab{height:76rpx;display:flex;align-items:center;justify-content:center;color:#737a75;font-size:28rpx;border-radius:10rpx}.tab.active{background:#fff;color:#202522;font-weight:600}.group-title{display:block;margin:28rpx 0 10rpx;color:#8d909e;font-size:28rpx}.member-list{overflow:hidden;background:#fff;border:1rpx solid #dedfd9;border-radius:12rpx}.member-row{min-height:128rpx;padding:16rpx 18rpx;display:flex;align-items:center;border-bottom:1rpx solid #e2e5e0}.member-row:last-child{border:0}.avatar{width:76rpx;height:76rpx;margin-right:16rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:700}.tone-0{background:#ffe1d5;color:#785448}.tone-1{background:#efdfeb;color:#7a526a}.tone-2{background:#dceaf8;color:#4e6b82}.tone-3{background:#e1f2e7;color:#4f735b}.copy{flex:1;min-width:0;display:flex;flex-direction:column}.copy text:first-child{font-size:32rpx;font-weight:600}.copy text:last-child{margin-top:5rpx;color:#8b918d;font-size:26rpx}.status{padding:5rpx 9rpx;border-radius:10rpx;background:#f0f1f4;color:#737a75;font-size:26rpx}.status.joined{background:#e8f5ec;color:#4f9b6d}.arrow{margin-left:8rpx;color:#9ca29e;font-size:32rpx}.add-button{position:fixed;left:28rpx;right:28rpx;bottom:calc(24rpx + env(safe-area-inset-bottom));height:88rpx;line-height:88rpx;background:#315c4d;color:#fff;border-radius:10rpx;font-size:32rpx}.empty{margin-top:100rpx;text-align:center;color:#8b918d}.invite-mask{position:fixed;z-index:20;inset:0;background:rgba(31,35,51,.35);display:flex;align-items:flex-end}.invite-sheet{width:100%;padding:34rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));background:#fff;border-radius:18rpx 18rpx 0 0;display:flex;flex-direction:column;text-align:center}.invite-title{font-size:32rpx;font-weight:700}.invite-desc{margin:10rpx 20rpx;color:#858c87;font-size:28rpx;line-height:1.6}.token{margin:24rpx 0;padding:20rpx;background:#e4ece7;border-radius:13rpx;color:#315c4d;font-size:40rpx;font-weight:700;letter-spacing:5rpx}.copy-token{height:88rpx;line-height:88rpx;background:#fff;color:#315c4d;font-size:28rpx}
</style>
