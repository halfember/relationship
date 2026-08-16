import { analyticsApi } from '@/api/analytics.js';
import { store } from '@/store/index.js';

const SESSION_KEY = 'productAnalyticsSessionId';

export function startAnalyticsSession() {
  const sessionId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  uni.setStorageSync(SESSION_KEY, sessionId);
  return sessionId;
}

export function trackEvent(eventName, metadata) {
  if (!store.isLogin) return;
  const pages = getCurrentPages();
  const page = pages[pages.length - 1]?.route || '';
  const sessionId = uni.getStorageSync(SESSION_KEY) || startAnalyticsSession();
  void analyticsApi.track({ eventName, page, sessionId, ...(metadata ? { metadata } : {}) }).catch(() => {});
}
