import { analyticsApi } from '@/api/analytics.js';
import { store } from '@/store/index.js';

const SESSION_KEY = 'productAnalyticsSessionId';
const E2E_ANALYTICS_DISABLED = import.meta.env.VITE_E2E_DISABLE_ANALYTICS === 'true';

export function startAnalyticsSession() {
  const sessionId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  uni.setStorageSync(SESSION_KEY, sessionId);
  return sessionId;
}

export function trackEvent(eventName, metadata) {
  if (E2E_ANALYTICS_DISABLED || !store.isLogin) return;
  const pages = getCurrentPages();
  const page = pages[pages.length - 1]?.route || '';
  const sessionId = uni.getStorageSync(SESSION_KEY) || startAnalyticsSession();
  void analyticsApi.track({ eventName, page, sessionId, ...(metadata ? { metadata } : {}) }).catch(() => {});
}
