import { get, post, del } from '@/utils/request.js';

export const shareApi = {
  /** 生成分享邀请码 */
  invite(userId, relationshipId) {
    return post('/share/invite', { userId, relationshipId });
  },

  /** 接受邀请 */
  accept(userId, token) {
    return post('/share/accept', { userId, token });
  },

  /** 分享给我的列表 */
  sharedWithMe(userId) {
    return get('/share/shared-with-me', { userId });
  },

  /** 我分享的列表 */
  sharedByMe(userId) {
    return get('/share/shared-by-me', { userId });
  },

  /** 移除共享（分享者操作） */
  removeAccess(id, userId) {
    return del(`/share/${id}/remove`, { userId });
  },

  /** 退出共享（被分享者操作） */
  leaveAccess(id, userId) {
    return del(`/share/${id}/leave`, { userId });
  },

  /** 查看共享关系详情 */
  sharedDetail(id, userId) {
    return get(`/share/${id}/detail`, { userId });
  },
};
