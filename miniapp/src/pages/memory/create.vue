<template>
  <view class="create-page">
    <view class="form-section">
      <!-- 图片上传 -->
      <view class="form-item">
        <text class="form-label">照片（可选）</text>
        <view class="image-upload" @tap="chooseImage">
          <image v-if="form.imageUrl" :src="form.imageUrl" class="preview-img" mode="aspectFill" />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">📷</text>
            <text class="upload-text">点击上传照片</text>
          </view>
        </view>
      </view>

      <!-- 内容 -->
      <view class="form-item">
        <text class="form-label">回忆内容</text>
        <textarea
          class="form-textarea"
          v-model="form.content"
          placeholder="记录这一刻的美好回忆..."
          maxlength="500"
          :auto-height="true"
        />
        <text class="char-count">{{ form.content.length }}/500</text>
      </view>

      <!-- 日期 -->
      <view class="form-item">
        <text class="form-label">回忆日期</text>
        <picker mode="date" :value="form.memoryDate" @change="onDateChange">
          <view class="form-picker">
            {{ form.memoryDate || '请选择日期（默认今天）' }}
          </view>
        </picker>
      </view>
    </view>

    <!-- 提交 -->
    <view class="submit-section">
      <button class="submit-btn" :loading="submitting" @tap="handleSubmit">
        保存回忆
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { memoryApi } from '@/api/memory.js';
import { trackEvent } from '@/utils/analytics.js';

const relationshipId = ref(0);

const form = reactive({
  imageUrl: '',
  content: '',
  memoryDate: '',
});

const submitting = ref(false);

onLoad((options) => {
  relationshipId.value = Number(options.relationshipId);
});

const onDateChange = (e) => {
  form.memoryDate = e.detail.value;
};

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      form.imageUrl = res.tempFilePaths[0];
    },
  });
};

const handleSubmit = async () => {
  if (!form.content.trim() && !form.imageUrl) {
    uni.showToast({ title: '请至少输入内容或上传照片', icon: 'none' });
    return;
  }

  submitting.value = true;
  try {
    let imageUrl;
    if (form.imageUrl) {
      const uploaded = await memoryApi.uploadImage(form.imageUrl);
      imageUrl = uploaded.url;
    }
    await memoryApi.create({
      relationshipId: relationshipId.value,
      imageUrl,
      content: form.content.trim() || undefined,
      memoryDate: form.memoryDate || undefined,
    });
    trackEvent('memory_created', { hasImage: Boolean(imageUrl) });
    uni.showToast({ title: '添加成功', icon: 'success' });
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
  border-radius: 12rpx;
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

.image-upload {
  width: 320rpx;
  height: 320rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  background: #f7f7f5;
  border: 2rpx dashed #d9ddd9;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  font-size: 56rpx;
  margin-bottom: 12rpx;
}

.upload-text {
  font-size:32rpx;
  color: #8b918d;
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #f7f7f5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size:32rpx;
  box-sizing: border-box;
}

.char-count {
  display: block;
  text-align: right;
  font-size:28rpx;
  color: #9ca29e;
  margin-top: 8rpx;
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

.submit-section {
  padding: 20rpx 30rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #315c4d;
  color: #fff;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}
</style>
