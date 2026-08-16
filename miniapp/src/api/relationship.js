import { get, post, put, del } from '../utils/request';

/**
 * 关系 API
 */
export const relationshipApi = {
  /** 创建关系 */
  create(data) {
    return post('/relationship/create', data);
  },

  /** 关系列表 */
  list(userId) {
    return get('/relationship/list', { userId });
  },

  /** 关系详情 */
  detail(id) {
    return get(`/relationship/${id}`);
  },

  /** 更新关系 */
  update(id, data) {
    return put(`/relationship/${id}`, data);
  },

  /** 删除关系 */
  remove(id) {
    return del(`/relationship/${id}`);
  },
};
