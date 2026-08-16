<script setup>
import { onLaunch } from '@dcloudio/uni-app';
import { startAnalyticsSession } from '@/utils/analytics.js';

onLaunch(() => {
  startAnalyticsSession();
  console.log('与你AI V1.4.3 启动');
});
</script>

<style>
page {
  --font-tertiary: 26rpx;
  --font-secondary: 28rpx;
  --font-body: 32rpx;
  --font-section: 34rpx;
  --font-title: 42rpx;
  --control-height: 96rpx;
  --row-height: 136rpx;
  --row-height-large: 144rpx;
  --avatar-size: 80rpx;
  min-height: 100%;
  background: #f7f7f5;
  color: #202522;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', sans-serif;
  font-size:var(--font-body);
  line-height:1.5;
  letter-spacing: 0;
}

view,
text,
input,
textarea,
button,
image {
  box-sizing: border-box;
}

button::after {
  border: 0;
}

.page-shell {
  min-height: 100vh;
  padding: 0 28rpx calc(156rpx + env(safe-area-inset-bottom));
}

.page-title {
  font-size: var(--font-title);
  line-height: 56rpx;
  font-weight: 700;
  color: #202522;
}

.section-heading {
  font-size: var(--font-section);
  line-height: 48rpx;
  font-weight: 700;
  color: #202522;
}

.surface {
  background: #fff;
  border: 1rpx solid #dedfd9;
  border-radius: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(35, 43, 38, 0.04);
}

.primary-button {
  height: 100rpx;
  line-height: 100rpx;
  border-radius: 12rpx;
  background: #315c4d;
  color: #fff;
  font-size:var(--font-body);
  font-weight: 600;
}

.muted {
  color: #7b827d;
}
</style>
