import { get } from '../utils/request';

/**
 * 导出 API
 */
export const exportApi = {
  /** 导出单条关系完整数据 */
  relationship(relationId) {
    return get(`/export/relationship/${relationId}`);
  },

  /** 导出所有关系汇总 */
  all() {
    return get('/export/all');
  },
};
