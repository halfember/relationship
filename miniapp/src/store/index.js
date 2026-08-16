/**
 * 全局状态管理（轻量级 reactive store）
 */
import { reactive } from 'vue';

export const store = reactive({
  /** 当前登录用户 */
  userInfo: uni.getStorageSync('userInfo') || null,

  /** 设置用户信息 */
  setUserInfo(user) {
    this.userInfo = user;
    uni.setStorageSync('userInfo', user);
  },

  /** 退出登录 */
  logout() {
    this.userInfo = null;
    uni.removeStorageSync('userInfo');
  },

  /** 是否已登录 */
  get isLogin() {
    return !!(this.userInfo?.id && this.userInfo?.accessToken);
  },

  /** 获取用户ID */
  get userId() {
    return this.userInfo?.id;
  },
});
