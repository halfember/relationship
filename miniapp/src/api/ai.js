import { get, post } from '../utils/request';

/**
 * AI API
 */
export const aiApi = {
  /** AI 生成（祝福语/纪念日文案/送礼建议） */
  generate(data) {
    return post('/ai/generate', data);
  },

  /** AI 调用记录 */
  records(userId, page = 1, pageSize = 20) {
    return get('/ai/records', { userId, page, pageSize });
  },
};
