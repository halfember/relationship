<template>
  <view class="create-page">
    <view class="form-section">
      <!-- 标题 -->
      <view class="form-item">
        <text class="form-label">事件名称 <text class="required">*</text></text>
        <input
          class="form-input"
          v-model="form.title"
          placeholder="如：第一次见面、结婚纪念日"
          maxlength="64"
        />
      </view>

      <!-- 日期 -->
      <view class="form-item">
        <text class="form-label">事件日期 <text class="required">*</text></text>
        <picker mode="date" :value="form.eventDate" @change="onDateChange">
          <view class="form-picker">
            {{ form.eventDate || '请选择日期' }}
          </view>
        </picker>
      </view>

      <!-- 重复类型 -->
      <view class="form-item">
        <text class="form-label">重复提醒</text>
        <view class="repeat-selector">
          <view
            v-for="r in repeatOptions"
            :key="r.value"
            :class="['repeat-opt', { active: form.repeatType === r.value }]"
            @tap="form.repeatType = r.value"
          >
            {{ r.label }}
          </view>
        </view>
      </view>

      <!-- 提醒天数 -->
      <view class="form-item">
        <text class="form-label">提前提醒</text>
        <view class="remind-selector">
          <view
            v-for="d in remindOptions"
            :key="d.value"
            :class="['remind-opt', { active: form.remindDays.includes(d.value) }]"
            @tap="toggleRemindDay(d.value)"
          >
            {{ d.label }}
          </view>
        </view>
      </view>
    </view>

    <!-- 提交 -->
    <view class="submit-section">
      <button class="submit-btn" :loading="submitting" @tap="handleSubmit">
        {{ eventId ? '保存修改' : '保存重要日' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { eventApi } from '@/api/event.js';
import { requestReminderSubscription } from '@/utils/reminderSubscription.js';
import { trackEvent } from '@/utils/analytics.js';

const relationshipId = ref(0);
const eventId = ref(0);

const repeatOptions = [
  { label: '不重复', value: '' },
  { label: '每年', value: '每年' },
  { label: '每月', value: '每月' },
  { label: '每周', value: '每周' },
];

const remindOptions = [
  { label: '当天', value: 0 },
  { label: '提前1天', value: 1 },
  { label: '提前3天', value: 3 },
  { label: '提前7天', value: 7 },
  { label: '提前30天', value: 30 },
];

const form = reactive({
  title: '',
  eventDate: '',
  repeatType: '',
  remindDays: [0],
});

const submitting = ref(false);

onLoad(async (options) => {
  relationshipId.value = Number(options.relationshipId);
  eventId.value = Number(options.id) || 0;
  uni.setNavigationBarTitle({ title: eventId.value ? '编辑重要日' : '添加重要日' });
  if (eventId.value) {
    const event = await eventApi.detail(eventId.value);
    relationshipId.value = event.relationshipId;
    form.title = event.title || '';
    form.eventDate = event.eventDate ? String(event.eventDate).slice(0, 10) : '';
    form.repeatType = event.repeatType || '';
    form.remindDays = Array.isArray(event.remindDays) && event.remindDays.length ? [...event.remindDays] : [0];
  }
});

const onDateChange = (e) => {
  form.eventDate = e.detail.value;
};

const toggleRemindDay = (day) => {
  const idx = form.remindDays.indexOf(day);
  if (idx >= 0) {
    if (form.remindDays.length > 1) {
      form.remindDays.splice(idx, 1);
    }
  } else {
    form.remindDays.push(day);
  }
};

const handleSubmit = async () => {
  if (!form.title.trim()) {
    uni.showToast({ title: '请输入事件名称', icon: 'none' });
    return;
  }
  if (!form.eventDate) {
    uni.showToast({ title: '请选择日期', icon: 'none' });
    return;
  }

  submitting.value = true;
  try {
    const subscribed = eventId.value ? false : await requestReminderSubscription();
    const payload = {
      relationshipId: relationshipId.value,
      title: form.title.trim(),
      eventDate: form.eventDate,
      repeatType: form.repeatType || undefined,
      remindDays: form.remindDays.length > 0 ? form.remindDays : undefined,
    };
    if (eventId.value) await eventApi.update(eventId.value, {
      title: payload.title,
      eventDate: payload.eventDate,
      repeatType: payload.repeatType,
      remindDays: payload.remindDays,
    });
    else await eventApi.create(payload);
    trackEvent(eventId.value ? 'event_updated' : 'event_created', { repeatType: form.repeatType || 'none', remindCount: form.remindDays.length });
    uni.showToast({ title: eventId.value ? '修改已保存' : subscribed ? '已获1次微信提醒' : '已添加，日程内提醒', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (e) {
    uni.showToast({ title: e?.message || '保存失败，请稍后重试', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.create-page {
  min-height: 100vh;
  padding-bottom: 40rpx;
  background: #f7f7f5;
}

.form-section {
  padding: 30rpx;
}

.form-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 20rpx;
}

.form-label {
  font-size:32rpx;
  color: #303833;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.required {
  color: #ac5a50;
}

.form-input {
  width: 100%;
  height:88rpx;
  background: #f7f7f5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size:32rpx;
}

.form-picker {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #f7f7f5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size:32rpx;
  color: #8b918d;
}

.repeat-selector {
  display: flex;
  gap: 12rpx;
}

.repeat-opt {
  padding: 12rpx 28rpx;
  border-radius: 10rpx;
  background: #f7f7f5;
  font-size:28rpx;
  color: #737a75;
}

.repeat-opt.active {
  background: #e4ece7;
  color: #315c4d;
  font-weight: 500;
}

.remind-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.remind-opt {
  padding: 12rpx 24rpx;
  border-radius: 10rpx;
  background: #f7f7f5;
  font-size:28rpx;
  color: #737a75;
}

.remind-opt.active {
  background: #e4ece7;
  color: #315c4d;
  font-weight: 500;
}

.submit-section {
  padding: 20rpx 30rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #315c4d;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.create-page { padding:18rpx 30rpx 150rpx; }
.form-section { padding:0; }
.form-item { margin:0;padding:28rpx 0;border-bottom:1rpx solid #dfe2dd;border-radius:0;background:transparent; }
.form-input,.form-picker { padding:0;background:transparent;border-radius:0; }
.repeat-opt,.remind-opt { min-height:72rpx;display:flex;align-items:center;border:1rpx solid #d9ddd8;border-radius:8rpx;background:#fff; }
.submit-section { position:fixed;z-index:10;left:0;right:0;bottom:0;padding:15rpx 28rpx calc(15rpx + env(safe-area-inset-bottom));border-top:1rpx solid #e0e3de;background:rgba(255,255,255,.98); }
.submit-btn { height:100rpx;border-radius:10rpx;line-height:100rpx;background:#315c4d;font-weight:650; }
</style>
