import { get, post } from '../utils/request';

/**
 * 提醒 API
 */
export const reminderApi = {
  /** 获取未来 N 天提醒 */
  upcoming(userId, days = 7) {
    return get('/reminder/upcoming', { userId, days });
  },

  /** 获取今日提醒 */
  today(userId) {
    return get('/reminder/today', { userId });
  },

  /** 标记用户已处理，不改变微信送达状态 */
  acknowledge(id) {
    return post(`/reminder/${id}/acknowledge`);
  },

  /** 手动触发生成提醒 */
  generate() {
    return post('/reminder/generate');
  },
};
