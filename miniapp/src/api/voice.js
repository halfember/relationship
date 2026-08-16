import { upload } from '../utils/request';

/**
 * 语音 API
 */
export const voiceApi = {
  /** 语音转文字 - 上传音频文件 */
  transcribe(filePath, userId) {
    return upload('/voice/transcribe', filePath, 'file', { userId });
  },
};
