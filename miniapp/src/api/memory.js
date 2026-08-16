import { get, post, put, del, upload } from '../utils/request';

/**
 * 记忆 API
 */
export const memoryApi = {
  uploadImage(filePath) {
    return upload('/upload/image', filePath);
  },
  /** 创建记忆 */
  create(data) {
    return post('/memory/create', data);
  },

  /** 记忆列表 */
  list(relationshipId) {
    return get('/memory/list', { relationshipId });
  },

  /** 记忆详情 */
  detail(id) {
    return get(`/memory/${id}`);
  },

  /** 更新记忆 */
  update(id, data) {
    return put(`/memory/${id}`, data);
  },

  /** 删除记忆 */
  remove(id) {
    return del(`/memory/${id}`);
  },
};
