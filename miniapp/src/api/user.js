import { get, post, put, del } from '../utils/request';

/**
 * 用户 API
 */
export const userApi = {
  /** 微信登录 */
  login(code, nickname, avatar) {
    return post('/user/login', { code, nickname, avatar });
  },

  /** 获取用户详情 */
  getProfile(userId) {
    return get(`/user/${userId}`);
  },

  /** 更新用户信息 */
  updateProfile(userId, data) {
    return put(`/user/${userId}`, data);
  },

  /** 获取用户统计 */
  getStats(userId) {
    return get(`/user/${userId}/stats`);
  },

  createDesktopCode() {
    return post('/user/desktop-code');
  },

  deleteAccount() {
    return del('/user/me/account');
  },
};
