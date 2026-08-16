import { get, postSilent } from '../utils/request';

/**
 * 数据分析 API
 */
export const analyticsApi = {
  track(data) {
    return postSilent('/analytics/events', data);
  },
  /** 获取数据总览（含关系图谱） */
  dashboard(userId) {
    return get('/analytics/dashboard', { userId });
  },

  /** 获取月度活跃数据 */
  activity(userId) {
    return get('/analytics/activity', { userId });
  },
};
