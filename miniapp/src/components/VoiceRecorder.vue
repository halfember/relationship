<template>
  <view class="voice-recorder" :class="{ recording, processing }">
    <!-- 录制按钮 -->
    <view class="record-btn" @longpress="startRecord" @touchend="stopRecord" @touchcancel="cancelRecord">
      <view class="btn-inner">
        <!-- 麦克风图标 -->
        <view v-if="!recording && !processing" class="mic-icon">
          <text class="emoji">🎤</text>
          <text class="label">按住说话</text>
        </view>

        <!-- 录制中动画 -->
        <view v-if="recording" class="recording-indicator">
          <view class="pulse-ring"></view>
          <text class="timer-text">{{ duration }}s</text>
          <text class="hint-text">松手识别</text>
        </view>

        <!-- 处理中 -->
        <view v-if="processing" class="processing-indicator">
          <view class="spinner"></view>
          <text class="label">识别中...</text>
        </view>
      </view>
    </view>

    <!-- 识别结果预览 -->
    <view v-if="recognizedText && !editing" class="result-preview">
      <view class="result-content">
        <text class="result-label">🎙️ 识别结果：</text>
        <text class="result-text">{{ recognizedText }}</text>
      </view>
      <view class="result-actions">
        <text class="action-btn cancel-btn" @tap="clearResult">重新录制</text>
        <text class="action-btn confirm-btn" @tap="confirmResult">确认使用</text>
      </view>
    </view>

    <!-- 编辑模式 -->
    <view v-if="editing" class="edit-section">
      <textarea
        class="edit-textarea"
        v-model="recognizedText"
        :maxlength="maxLength"
        :auto-height="true"
        placeholder="点击修改识别结果..."
      />
      <view class="result-actions">
        <text class="char-hint">{{ recognizedText.length }}/{{ maxLength }}</text>
        <text class="action-btn confirm-btn" @tap="finishEdit">完成</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { voiceApi } from '@/api/voice.js';

const props = defineProps({
  /** 用户ID */
  userId: { type: Number, default: 0 },
  /** 最大字符数 */
  maxLength: { type: Number, default: 500 },
});

const emit = defineEmits(['result', 'error']);

const recorderManager = uni.getRecorderManager();
let recordTimer = null;
let recordCancelled = false;

const recording = ref(false);
const processing = ref(false);
const recognizedText = ref('');
const editing = ref(false);
const duration = ref(0);

/** 开始录音 */
const startRecord = () => {
  if (recording.value || processing.value) return;

  recording.value = true;
  recordCancelled = false;
  duration.value = 0;

  // 开始录音
  recorderManager.start({
    duration: 60000,     // 最长60秒
    sampleRate: 16000,   // Whisper 推荐采样率
    numberOfChannels: 1, // 单声道
    encodeBitRate: 48000,
    format: 'mp3',       // mp3 格式
  });

  // 计时器
  recordTimer = setInterval(() => {
    duration.value++;
    if (duration.value >= 60) {
      stopRecord();
    }
  }, 1000);

  // 震动反馈
  uni.vibrateShort({ type: 'medium' });
};

/** 停止录音 → 上传识别 */
const stopRecord = () => {
  if (!recording.value) return;

  recording.value = false;
  clearInterval(recordTimer);

  recorderManager.stop();
};

/** 取消录音 */
const cancelRecord = () => {
  if (!recording.value) return;

  recording.value = false;
  clearInterval(recordTimer);

  recordCancelled = true;
  recorderManager.stop();

  uni.showToast({ title: '已取消', icon: 'none' });
};

// 监听录音停止 → 上传识别
recorderManager.onStop((res) => {
  if (recordCancelled) {
    recordCancelled = false;
    return;
  }

  const filePath = res.tempFilePath;
  if (!filePath) {
    emit('error', '录音文件获取失败');
    return;
  }

  startTranscription(filePath);
});

// 录音错误
recorderManager.onError((err) => {
  recording.value = false;
  clearInterval(recordTimer);
  uni.showToast({ title: '录音失败，请重试', icon: 'none' });
  emit('error', err);
});

/** 上传音频进行语音识别 */
const startTranscription = async (filePath) => {
  processing.value = true;

  try {
    const result = await voiceApi.transcribe(filePath, props.userId);
    recognizedText.value = result.text || '';
    processing.value = false;
  } catch (e) {
    processing.value = false;
    recognizeFallback(filePath);
  }
};

/** 降级方案：使用 WeChat 内置语音识别插件 */
const recognizeFallback = (filePath) => {
  // WeChat 小程序内置语音识别（需要先开通插件）
  const plugin = requirePlugin && requirePlugin('WechatSI');
  if (!plugin) {
    uni.showToast({ title: '语音识别不可用，请手动输入', icon: 'none' });
    return;
  }

  const manager = plugin.getRecordRecognitionManager();
  manager.onRecognize = (res) => {
    recognizedText.value = res.result;
  };
  manager.onStop = (res) => {
    recognizedText.value = res.result || '';
    processing.value = false;
  };
  manager.onError = () => {
    processing.value = false;
    uni.showToast({ title: '识别失败，请手动输入', icon: 'none' });
  };

  // 直接使用已经录好的音频，用插件重新处理
  manager.start({ lang: 'zh_CN', duration: 60000 });
};

/** 清除结果 */
const clearResult = () => {
  recognizedText.value = '';
  editing.value = false;
};

/** 确认使用 → 追加到表单 */
const confirmResult = () => {
  editing.value = true;
};

/** 完成编辑 → 发出结果 */
const finishEdit = () => {
  editing.value = false;
  emit('result', recognizedText.value.trim());
};
</script>

<style scoped>
.voice-recorder {
  position: relative;
  margin-top: 20rpx;
}

.record-btn {
  display: flex;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
}

.btn-inner {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667EEA, #764BA2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 30rpx rgba(102, 126, 234, 0.35);
  transition: transform 0.15s;
}

.btn-inner:active {
  transform: scale(0.95);
}

.mic-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mic-icon .emoji {
  font-size: 64rpx;
}

.mic-icon .label {
  font-size:30rpx;
  color: rgba(255,255,255,0.9);
  margin-top: 8rpx;
}

/* 录制中 */
.recording .btn-inner {
  background: linear-gradient(135deg, #FF6B6B, #EE5A24);
  animation: pulse 1.2s ease-in-out infinite;
}

.recording-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pulse-ring {
  width: 80rpx;
  height: 80rpx;
  border: 4rpx solid rgba(255,255,255,0.6);
  border-radius: 50%;
  animation: ringPulse 1.2s ease-in-out infinite;
}

.timer-text {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  margin-top: 10rpx;
}

.hint-text {
  font-size:28rpx;
  color: rgba(255,255,255,0.8);
  margin-top: 6rpx;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes ringPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
}

/* 处理中 */
.processing .btn-inner {
  background: linear-gradient(135deg, #F39C12, #E67E22);
}

.spinner {
  width: 56rpx;
  height: 56rpx;
  border: 4rpx solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.processing-indicator .label {
  font-size:30rpx;
  color: #fff;
  margin-top: 12rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 识别结果 */
.result-preview {
  margin-top: 24rpx;
  background: linear-gradient(135deg, #F0F4FF, #F5F0FF);
  border-radius: 16rpx;
  padding: 24rpx;
}

.result-content {
  margin-bottom: 20rpx;
}

.result-label {
  font-size:30rpx;
  color: #667EEA;
  font-weight: 500;
  display: block;
  margin-bottom: 10rpx;
}

.result-text {
  font-size:30rpx;
  color: #333;
  line-height: 1.7;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20rpx;
}

.action-btn {
  font-size:28rpx;
  padding: 10rpx 28rpx;
  border-radius: 30rpx;
  font-weight: 500;
}

.cancel-btn {
  color: #999;
  background: #F0F0F0;
}

.confirm-btn {
  color: #fff;
  background: linear-gradient(135deg, #667EEA, #764BA2);
}

/* 编辑模式 */
.edit-section {
  margin-top: 24rpx;
}

.edit-textarea {
  width: 100%;
  min-height: 160rpx;
  background: #F5F6FA;
  border: 2rpx solid #667EEA;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size:30rpx;
  box-sizing: border-box;
}

.char-hint {
  font-size:28rpx;
  color: #ccc;
}
</style>
