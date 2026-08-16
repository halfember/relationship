<template>
  <view class="create-page">
    <view class="person-preview"><view>{{(form.name||'人').slice(0,1)}}</view><text>{{form.name||'新联系人'}}</text><text>{{form.type||'请选择关系'}}</text></view>
    <view class="form-section">
      <view class="field name-field"><text>姓名</text><input v-model="form.name" maxlength="32" placeholder="输入姓名" focus/></view>
      <text class="field-label">关系 <text class="required">*</text></text>
      <view class="type-selector"><view v-for="item in typeOptions" :key="item" :class="{active:form.type===item}" @tap="form.type=item">{{item}}</view></view>
      <view class="field date-field"><text>生日</text><picker mode="date" :value="form.birthday" @change="form.birthday=$event.detail.value"><view :class="{placeholder:!form.birthday}">{{form.birthday||'选填'}} <text>›</text></view></picker></view>
      <text class="birthday-tip">填写后会建立提前7天、1天和当天的日程提醒；微信提醒按授权次数发送。</text>
      <view class="field tags-field"><text>标签</text><view class="tag-list"><text v-for="(tag,index) in form.tags" :key="tag" @tap="form.tags.splice(index,1)">{{tag}} ×</text><input v-model="tagInput" maxlength="10" placeholder="添加标签" @confirm="addTag"/></view></view>
      <view class="remark-field"><text>备注</text><textarea v-model="form.remark" maxlength="200" placeholder="写下相识方式、喜好或其他信息"/></view>
    </view>
    <view class="submit-bar"><button class="primary-button" :loading="submitting" @tap="submit">{{editId?'保存修改':'保存联系人'}}</button></view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { store } from '@/store/index.js';
import { relationshipApi } from '@/api/relationship.js';
import { requestReminderSubscription } from '@/utils/reminderSubscription.js';
import { trackEvent } from '@/utils/analytics.js';

const typeOptions = ['家人', '朋友', '恋人', '同事', '同学', '其他'];
const form = reactive({ type: '', name: '', birthday: '', tags: [], remark: '' });
const tagInput = ref('');
const submitting = ref(false);
const existingNames = ref([]);
const editId = ref(0);
const originalBirthday = ref('');

onLoad(async (options) => {
  editId.value = Number(options?.id) || 0;
  uni.setNavigationBarTitle({ title: editId.value ? '编辑联系人' : '添加联系人' });
  try {
    const [list, detail] = await Promise.all([
      relationshipApi.list(store.userId),
      editId.value ? relationshipApi.detail(editId.value) : Promise.resolve(null),
    ]);
    existingNames.value = (list || [])
      .filter((item) => item.id !== editId.value)
      .map((item) => String(item.name || '').trim().toLocaleLowerCase());
    if (detail) {
      form.name = detail.name || '';
      form.type = detail.type || '';
      form.birthday = detail.birthday ? String(detail.birthday).slice(0, 10) : '';
      form.tags = Array.isArray(detail.tags) ? [...detail.tags] : [];
      form.remark = detail.remark || '';
      originalBirthday.value = form.birthday;
    }
  } catch {
    existingNames.value = [];
  }
});

const addTag = () => {
  const value = tagInput.value.trim();
  if (value && !form.tags.includes(value)) form.tags.push(value);
  tagInput.value = '';
};
const confirmDuplicate = (name) => new Promise((resolve) => uni.showModal({
  title: '可能已经添加过', content: `联系人中已有“${name}”，仍要继续添加吗？`,
  confirmText: '继续添加', confirmColor: '#b06455',
  success: ({ confirm }) => resolve(confirm), fail: () => resolve(false),
}));
const showNextStep = (relationship) => uni.showActionSheet({
  itemList: ['添加重要日', '记录回忆', '邀请一起记录', '暂时完成'],
  success: ({ tapIndex }) => {
    if (tapIndex === 0) uni.redirectTo({ url: `/pages/event/create?relationshipId=${relationship.id}` });
    if (tapIndex === 1) uni.redirectTo({ url: `/pages/memory/create?relationshipId=${relationship.id}` });
    if (tapIndex === 2) uni.redirectTo({ url: `/pages/space/invite-create?relationshipId=${relationship.id}&name=${encodeURIComponent(relationship.name)}` });
    if (tapIndex === 3) uni.navigateBack();
  },
  fail: () => uni.navigateBack(),
});

const submit = async () => {
  if (submitting.value) return;
  const name = form.name.trim();
  if (!name) return uni.showToast({ title: '请输入姓名', icon: 'none' });
  if (!form.type) return uni.showToast({ title: '请选择关系', icon: 'none' });
  if (existingNames.value.includes(name.toLocaleLowerCase()) && !(await confirmDuplicate(name))) return;
  submitting.value = true;
  try {
    const birthdayChanged = form.birthday && form.birthday !== originalBirthday.value;
    const subscribed = birthdayChanged ? await requestReminderSubscription() : false;
    const payload = {
      name,
      type: form.type,
      birthday: form.birthday || undefined,
      tags: form.tags.length ? form.tags : [],
      remark: editId.value ? form.remark.trim() : form.remark.trim() || undefined,
    };
    if (editId.value) {
      await relationshipApi.update(editId.value, payload);
      trackEvent('relationship_updated', { hasBirthday: Boolean(form.birthday), tagCount: form.tags.length });
      uni.showToast({ title: '修改已保存', icon: 'success' });
      setTimeout(() => uni.navigateBack(), 500);
      return;
    }
    const relationship = await relationshipApi.create({ userId: store.userId, ...payload });
    trackEvent('relationship_created', { type: form.type, hasBirthday: Boolean(form.birthday), tagCount: form.tags.length });
    uni.showToast({ title: subscribed ? '已获1次微信提醒' : form.birthday ? '已添加，日程内提醒' : '联系人已添加', icon: 'success' });
    setTimeout(() => showNextStep(relationship), 350);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.create-page{min-height:100vh;padding:26rpx 32rpx 170rpx;background:#f7f7f5;color:#202522}.person-preview{height:196rpx;display:grid;grid-template-columns:100rpx 1fr;grid-template-rows:1fr 1fr;align-items:center}.person-preview>view{grid-row:1/3;width:100rpx;height:100rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e1e9e4;color:#315c4d;font-size:34rpx;font-weight:700}.person-preview>text:nth-child(2){align-self:end;font-size:34rpx;font-weight:700}.person-preview>text:last-child{align-self:start;margin-top:5rpx;color:#858c87;font-size:28rpx}.form-section{border-top:1rpx solid #dfe2dd}.field{min-height:124rpx;display:flex;align-items:center;border-bottom:1rpx solid #dfe2dd}.field>text,.field-label,.remark-field>text{color:#737a75;font-size:28rpx}.required{color:#b06455}.field input{flex:1;height:96rpx;margin-left:28rpx;text-align:right;font-size:32rpx}.field-label{display:block;margin-top:30rpx}.type-selector{margin-top:13rpx;display:grid;grid-template-columns:repeat(3,1fr);gap:10rpx}.type-selector view{height:80rpx;border:1rpx solid #d9ddd8;border-radius:8rpx;display:flex;align-items:center;justify-content:center;background:#fff;color:#68706b;font-size:30rpx}.type-selector view.active{border-color:#315c4d;background:#e4ece7;color:#315c4d;font-weight:650}.date-field{margin-top:20rpx}.date-field picker{flex:1;text-align:right;font-size:32rpx}.date-field .placeholder{color:#a0a6a2}.date-field view text{margin-left:8rpx;color:#969c98;font-size:32rpx}.birthday-tip{display:block;margin-top:10rpx;color:#8b918d;font-size:26rpx;line-height:1.5}.tags-field{align-items:flex-start;padding:24rpx 0}.tags-field>text{width:92rpx;padding-top:10rpx}.tag-list{flex:1;display:flex;justify-content:flex-end;align-items:center;flex-wrap:wrap;gap:10rpx}.tag-list>text{padding:10rpx 14rpx;border-radius:7rpx;background:#e4ece7;color:#315c4d;font-size:28rpx}.tag-list input{width:160rpx;height:64rpx;margin:0;text-align:right;font-size:28rpx}.remark-field{padding:26rpx 0}.remark-field>text{display:block}.remark-field textarea{width:100%;height:180rpx;margin-top:14rpx;padding:18rpx;border:1rpx solid #dfe2dd;border-radius:9rpx;background:#fff;font-size:32rpx;line-height:1.6}.submit-bar{position:fixed;z-index:10;left:0;right:0;bottom:0;padding:15rpx 28rpx calc(15rpx + env(safe-area-inset-bottom));background:rgba(255,255,255,.98);border-top:1rpx solid #e0e3de}
</style>
