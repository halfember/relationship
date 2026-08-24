<template>
  <view class="analytics-page">
    <view v-if="loading" class="loading">正在整理数据...</view>
    <block v-else>
      <view class="overview-card">
        <text class="overview-title">关系总览</text>
        <view class="overview-values">
          <view><text class="overview-number">{{ overview.totalRelationships || 0 }}</text><text>重要关系</text></view>
          <view class="divider"></view>
          <view><text class="overview-number">{{ overview.monthPendingReminders ?? '--' }}</text><text>本月待提醒</text></view>
        </view>
      </view>

      <view class="chart-card">
        <text class="card-title">关系类型分布</text>
        <view class="distribution">
          <view class="donut" :style="donutStyle"><view class="donut-hole"><text>{{ overview.totalRelationships || 0 }}</text><text>总数</text></view></view>
          <view class="legend-list">
            <view v-for="(item,index) in typeRows" :key="item.type" class="legend-row">
              <text class="legend-dot" :style="{background:colors[index%colors.length]}"></text><text class="legend-name">{{ item.type }}</text><text class="legend-value">{{ item.count }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="chart-card trend-card">
        <text class="card-title">本月待提醒分布</text>
        <text class="chart-unit">单位：个</text>
        <view class="trend-chart">
          <view v-for="n in 4" :key="n" class="grid-line" :style="{bottom:`${n*40}rpx`}"></view>
          <view class="bars">
            <view v-for="(item,index) in trendRows" :key="index" class="bar-column">
              <text class="bar-value">{{ item.value }}</text>
              <view class="bar" :style="{height:`${Math.max(12,item.value*20)}rpx`}"></view>
              <text class="bar-label">第{{ index+1 }}周</text>
            </view>
          </view>
        </view>
      </view>
    </block>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { analyticsApi } from '@/api/analytics.js';

const loading=ref(true);
const dashboard=ref({});
const colors=['#315c4d','#c76755','#d6a84f','#9a7aa0','#7b998a'];
const overview=computed(()=>dashboard.value.overview||{});
const typeRows=computed(()=>dashboard.value.byType?.length?dashboard.value.byType:[{type:'暂无数据',count:0}]);
const donutStyle=computed(()=>{
  const total=Math.max(overview.value.totalRelationships||0,1); let cursor=0; const stops=[];
  typeRows.value.forEach((item,index)=>{ const start=cursor; cursor += item.count/total*100; stops.push(`${colors[index%colors.length]} ${start}% ${cursor}%`); });
  if(!overview.value.totalRelationships) return {background:'#e2e5e0'};
  return {background:`conic-gradient(${stops.join(',')})`};
});
const trendRows=computed(()=>{
  const rows=(dashboard.value.weeklyReminderTrend||[]).map(item=>({value:item.count||0}));
  while(rows.length<4) rows.push({value:0}); return rows.slice(0,4);
});
onShow(async()=>{ if(!store.isLogin) return uni.reLaunch({url:'/pages/login/login'}); loading.value=true; try{ dashboard.value=await analyticsApi.dashboard(store.userId)||{}; } finally{loading.value=false;} });
</script>

<style scoped>
.analytics-page { min-height:100vh; padding:24rpx 28rpx 48rpx; background:#f7f7f5; }
.loading { padding:100rpx 0; text-align:center; color:#8b918d; }
.overview-card { padding:28rpx; border-radius:12rpx; color:#fff; background:#315c4d; box-shadow:0 8rpx 24rpx rgba(35,43,38,.06); }
.overview-title { font-size:32rpx; opacity:.88; }
.overview-values { display:flex; align-items:center; justify-content:space-around; margin-top:18rpx; }
.overview-values>view:not(.divider) { width:42%; display:flex; flex-direction:column; align-items:center; font-size:26rpx; opacity:.9; }
.overview-number { margin-bottom:4rpx; font-size:42rpx; line-height:52rpx; font-weight:700; }
.divider { width:1rpx; height:60rpx; background:rgba(255,255,255,.18); }
.chart-card { margin-top:20rpx; padding:24rpx; border-radius:12rpx; background:#fff; border:1rpx solid #dedfd9; }
.card-title { display:block; font-size:32rpx; font-weight:700; }
.distribution { display:flex; align-items:center; padding:30rpx 10rpx 10rpx; }
.donut { width:196rpx; height:196rpx; margin-right:48rpx; border-radius:50%; display:flex; align-items:center; justify-content:center; }
.donut-hole { width:112rpx; height:112rpx; border-radius:50%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#8b918d; font-size:26rpx; }
.donut-hole text:first-child { color:#202522; font-size:34rpx; font-weight:700; }
.legend-list { flex:1; }
.legend-row { height:42rpx; display:flex; align-items:center; font-size:28rpx; }
.legend-dot { width:12rpx; height:12rpx; margin-right:12rpx; border-radius:50%; }.legend-name{flex:1;color:#68706b}.legend-value{font-weight:600;color:#303833}
.trend-card { position:relative; }.chart-unit{display:block;margin-top:10rpx;color:#8b918d;font-size:26rpx}
.trend-chart { position:relative; height:250rpx; margin-top:10rpx; overflow:hidden; }
.grid-line { position:absolute; left:0; right:0; height:1rpx; background:#e2e5e0; }
.bars { position:absolute; left:0; right:0; bottom:0; height:220rpx; display:flex; align-items:flex-end; justify-content:space-around; }
.bar-column { width:21%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; }
.bar { width:22rpx; min-height:12rpx; border-radius:11rpx 11rpx 3rpx 3rpx; background:#315c4d; z-index:2; }.bar-value{color:#315c4d;font-size:26rpx;z-index:2}.bar-label{margin-top:10rpx;color:#858c87;font-size:26rpx;z-index:2}
</style>
