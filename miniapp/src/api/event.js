import { get, post, put, del } from '../utils/request';

/**
 * 事件 API
 */
export const eventApi = {
  /** 获取当前用户未来事件发生日（个人 + 共同空间） */
  upcoming(days = 90) {
    return get('/event/upcoming', { days });
  },

  /** 创建事件 */
  create(data) {
    return post('/event/create', data);
  },

  /** 事件列表 */
  list(relationshipId) {
    return get('/event/list', { relationshipId });
  },

  /** 事件详情 */
  detail(id) {
    return get(`/event/${id}`);
  },

  /** 更新事件 */
  update(id, data) {
    return put(`/event/${id}`, data);
  },

  /** 删除事件 */
  remove(id) {
    return del(`/event/${id}`);
  },
};
