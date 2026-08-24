<template>
  <view class="gift-page">
    <view class="field-card"><text class="field-label">送礼对象</text><picker :range="people" range-key="name" @change="personIndex = $event.detail.value"><view class="person-row"><view class="avatar">{{ selectedPerson.name.slice(0, 1) }}</view><text>{{ selectedPerson.name }}</text><text class="arrow">›</text></view></picker></view>
    <view class="field-card"><text class="field-label">送礼场景</text><picker :range="scenes" :value="sceneIndex" @change="sceneIndex = $event.detail.value"><view class="picker-row"><text>{{ scenes[sceneIndex] }}</text><text>⌄</text></view></picker></view>
    <view class="field-card"><text class="field-label">预算范围</text><picker :range="budgets" range-key="label" :value="budgetIndex" @change="budgetIndex = $event.detail.value"><view class="picker-row"><text>{{ selectedBudget.label }}</text><text>⌄</text></view></picker></view>
    <view class="field-card"><text class="field-label">对方偏好（可选）</text><textarea v-model="preferences" class="condition-input" maxlength="200" placeholder="例如：喜欢摄影、居家用品，偏好简约风格" /></view>
    <view class="field-card"><text class="field-label">不要推荐（可选）</text><textarea v-model="avoid" class="condition-input" maxlength="200" placeholder="例如：不要香水、鲜花和需要保养的物品" /></view>
    <button class="primary-button generate" :loading="loading" :disabled="loading" @tap="generate">获取建议</button>
    <view v-if="error" class="error-state"><text>{{ error }}</text><button @tap="generate">重新获取</button></view>
    <view v-if="result || suggestions.length" class="recommendations"><text class="section-title">推荐礼物</text><view v-for="(item, index) in suggestions" :key="item.name" class="gift-card"><view class="gift-icon" :class="`tone-${index}`">{{ giftIcon(index) }}</view><view class="gift-copy"><text>{{ item.name }}</text><text>{{ item.reason }}</text></view><view class="price"><text>参考预算</text><text>{{ item.priceRange }}</text></view></view><view class="ai-result"><text>AI 建议</text><text>{{ result }}</text><button @tap="copy">复制建议</button></view></view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { relationshipApi } from '@/api/relationship.js';
import { aiApi } from '@/api/ai.js';
import { trackEvent } from '@/utils/analytics.js';

const people = ref([{ name: '重要的人', type: '关系' }]);
const personIndex = ref(0); const sceneIndex = ref(0); const budgetIndex = ref(1);
const preferences = ref(''); const avoid = ref(''); const loading = ref(false); const result = ref(''); const error = ref(''); const suggestions = ref([]);
const scenes = ['生日', '纪念日', '节日', '日常惊喜'];
const budgets = [{ label: '200元以内', min: 0, max: 200 }, { label: '200-500元', min: 200, max: 500 }, { label: '500-1000元', min: 500, max: 1000 }, { label: '1000-3000元', min: 1000, max: 3000 }, { label: '3000-5000元', min: 3000, max: 5000 }];
const selectedPerson = computed(() => people.value[Number(personIndex.value)] || people.value[0]);
const selectedBudget = computed(() => budgets[Number(budgetIndex.value)] || budgets[0]);

onLoad(async (options) => {
  if (!store.isLogin) return uni.reLaunch({ url: '/pages/login/login' });
  try {
    const list = await relationshipApi.list(store.userId);
    if (list?.length) { people.value = list; const index = list.findIndex((item) => item.id === Number(options?.relationshipId)); if (index >= 0) personIndex.value = index; }
  } catch {
    // Keep the generic recipient when the relationship list is unavailable.
  }
});

const generate = async () => {
  if (loading.value) return;
  loading.value = true; error.value = '';
  try {
    const budget = selectedBudget.value;
    const prompt = `为${selectedPerson.value.type}${selectedPerson.value.name}挑选${scenes[sceneIndex.value]}礼物，预算${budget.label}。`;
    const data = await aiApi.generate({ userId: store.userId, type: 'gift', relationshipId: selectedPerson.value.id, scene: scenes[sceneIndex.value], budgetMin: budget.min, budgetMax: budget.max, preferences: preferences.value.trim(), avoid: avoid.value.trim(), prompt });
    result.value = data.result; suggestions.value = data.suggestions || [];
    trackEvent('ai_generated', { type: 'gift', hasRelationship: Boolean(selectedPerson.value.id), budget: budget.label });
  } catch (requestError) {
    error.value = requestError?.message || '生成失败，请检查网络后重试';
  } finally { loading.value = false; }
};
const giftIcon = (index) => ['✿', '♙', '▣', '◇', '☆'][index % 5];
const copy = () => uni.setClipboardData({ data: [...suggestions.value.map((item) => `${item.name}（${item.priceRange}）：${item.reason}`), result.value].filter(Boolean).join('\n'), success: () => uni.showToast({ title: '已复制', icon: 'success' }) });
</script>

<style scoped>
.gift-page{min-height:100vh;padding:24rpx 28rpx 50rpx;background:#f7f7f5}.field-card{margin-bottom:18rpx;padding:22rpx 24rpx;border-radius:12rpx;background:#fff;border:1rpx solid #dedfd9}.field-label{display:block;margin-bottom:14rpx;font-size:32rpx;font-weight:600}.person-row,.picker-row{min-height:88rpx;display:flex;align-items:center}.avatar{width:76rpx;height:76rpx;margin-right:14rpx;border-radius:50%;background:#ffe0d4;color:#795547;display:flex;align-items:center;justify-content:center;font-weight:700}.arrow,.picker-row text:last-child{margin-left:auto;color:#9ca29e;font-size:32rpx}.picker-row{font-size:32rpx}.condition-input{width:100%;min-height:112rpx;padding:18rpx;box-sizing:border-box;border-radius:10rpx;background:#f7f7f5;font-size:30rpx;line-height:1.5}.generate{margin-top:28rpx}.recommendations{margin-top:28rpx}.section-title{display:block;margin-bottom:14rpx;font-size:32rpx;font-weight:700}.gift-card{min-height:128rpx;margin-bottom:12rpx;padding:18rpx;background:#fff;border:1rpx solid #dedfd9;border-radius:10rpx;display:flex;align-items:center}.gift-icon{width:72rpx;height:72rpx;margin-right:16rpx;border-radius:13rpx;background:#ffe1e7;color:#e25f87;display:flex;align-items:center;justify-content:center;font-size:32rpx}.tone-1{background:#fff0df;color:#e99a30}.tone-2{background:#e6f1fa;color:#537b9b}.gift-copy{flex:1;display:flex;flex-direction:column}.gift-copy text:first-child{font-size:32rpx;font-weight:600}.gift-copy text:last-child{margin-top:5rpx;color:#8b918d;font-size:26rpx}.price{width:142rpx;margin-left:12rpx;display:flex;flex-direction:column;align-items:flex-end;color:#f0524e}.price text:first-child{color:#8b918d;font-size:22rpx;font-weight:400}.price text:last-child{margin-top:4rpx;font-size:28rpx;font-weight:600}.ai-result{padding:22rpx;border-radius:10rpx;background:#fff;border:1rpx solid #dedfd9;display:flex;flex-direction:column}.ai-result>text:first-child{font-size:32rpx;font-weight:600}.ai-result>text:nth-child(2){margin-top:10rpx;color:#555e58;font-size:32rpx;line-height:1.7;white-space:pre-wrap}.ai-result button{align-self:flex-end;margin:14rpx 0 0;height:88rpx;line-height:88rpx;padding:0 18rpx;background:#e4ece7;color:#315c4d;border-radius:10rpx;font-size:26rpx}.error-state{margin-top:18rpx;padding:22rpx;border:1rpx solid #f0cfc9;border-radius:10rpx;background:#fff7f5;color:#b54f43;font-size:28rpx;line-height:1.5}.error-state button{display:block;margin-top:14rpx;height:78rpx;line-height:78rpx;padding:0 20rpx;border-radius:10rpx;background:#fff;color:#315c4d;border:1rpx solid #dfe2dd;font-size:28rpx}
</style>
