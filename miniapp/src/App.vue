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
  --color-bg: #f7f7f5;
  --color-surface: #fff;
  --color-text: #202522;
  --color-muted: #8b918d;
  --color-primary: #315c4d;
  --color-primary-soft: #e4ece7;
  --color-accent: #c76755;
  --color-gold-soft: #f1e7d4;
  --color-lilac-soft: #e9e0ed;
  --color-coral-soft: #f7dfd6;
  --color-subtle: #edf0ec;
  --color-border: #dedfd9;
  --radius-control: 9rpx;
  --radius-surface: 12rpx;
  --shadow-surface: 0 8rpx 24rpx rgba(35, 43, 38, 0.04);
  min-height: 100%;
  background: var(--color-bg);
  color: var(--color-text);
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
  background: var(--color-surface);
  border: 1rpx solid var(--color-border);
  border-radius: var(--radius-surface);
  box-shadow: var(--shadow-surface);
}

.primary-button {
  height: 100rpx;
  line-height: 100rpx;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: #fff;
  font-size:var(--font-body);
  font-weight: 600;
}

.muted {
  color: var(--color-muted);
}

/* Shared visual contract for secondary workflows. Keep these selectors scoped
   to legacy page roots so the redesigned primary tabs retain their layout. */
.shared-detail-page,
.share-page,
.card-page,
.space-list-page,
.space-detail,
.calendar-page,
.members-page,
.memories-page,
.settings-page,
.memory-create,
.event-create,
.member-create,
.invite-page,
.accept-page,
.family-create,
.contact-create-page,
.contact-accept-page,
.detail-page,
.create-page {
  background: var(--color-bg);
  color: var(--color-text);
}

.shared-detail-page .section,
.share-page .modal-card,
.share-page .accept-card,
.share-page .shared-card,
.space-list-page .space-row,
.space-detail .next-event,
.space-detail .actions > view,
.space-detail .content-list,
.space-detail .memory-list,
.members-page .member-list,
.memories-page .memory-card,
.settings-page .form-card,
.settings-page .list,
.memory-create .form-card,
.event-create .form-card,
.member-create .profile-tip,
.invite-page .code-card,
.accept-page .relationship-form,
.accept-page .value-card,
.contact-create-page .form-card,
.contact-accept-page .form-card,
.detail-page .info-card {
  border-radius: var(--radius-control);
  border-color: var(--color-border);
  box-shadow: var(--shadow-surface);
}

.share-page .token-box,
.share-page .btn-copy,
.share-page .btn-cancel,
.share-page .accept-btn,
.share-page .empty-btn,
.share-page .bottom-btn,
.space-list-page .tabs,
.space-list-page .tab,
.members-page .tabs,
.members-page .tab,
.memories-page .tabs,
.memories-page .tab,
.space-detail .action-icon,
.space-detail .date-box,
.space-detail .day-pill,
.space-detail .memory-placeholder,
.space-detail .space-nav > view,
.calendar-page .tabs,
.calendar-page .tab,
.calendar-page .event-card,
.settings-page .name-row input,
.settings-page .name-row button,
.settings-page .privacy,
.memory-create .photo-picker,
.memory-create .visibility,
.event-create .repeat-item,
.event-create .remind-item,
.event-create .visibility,
.member-create .field input,
.member-create .picker-row,
.member-create .profile-tip,
.invite-page .field input,
.invite-page .picker-row,
.invite-page .privacy,
.accept-page .privacy,
.accept-page .relationship-field input,
.accept-page .picker-row,
.family-create .field input,
.family-create .preview,
.family-create .tip,
.detail-page .form-section,
.create-page .field-input,
.create-page .field-textarea,
.create-page .image-upload {
  border-radius: var(--radius-control);
}

.share-page .btn-cancel,
.share-page .token-input,
.share-page .bottom-btn,
.space-list-page .tabs,
.members-page .tabs,
.memories-page .tabs,
.calendar-page .tabs {
  background: var(--color-subtle);
}

.space-list-page .space-meta,
.space-list-page .space-count,
.members-page .group-title,
.settings-page .group-title,
.space-detail .settings,
.calendar-page .meta,
.share-page .modal-sub,
.share-page .accept-desc,
.share-page .sc-owner,
.share-page .sc-date {
  color: var(--color-muted);
}

.space-list-page .pending,
.space-detail .day-pill {
  background: var(--color-gold-soft);
  color: #7a612d;
}

.space-detail .blue,
.space-detail .memory-placeholder,
.members-page .tone-2,
.memories-page .text-art,
.memories-page .memory-card:nth-child(3n+2) .text-art {
  background: var(--color-lilac-soft);
  color: #735a7b;
}

.space-detail .coral,
.members-page .tone-0,
.space-detail .tone-0,
.memories-page .memory-card:nth-child(3n+2) .text-art {
  background: var(--color-coral-soft);
  color: #915041;
}

.space-detail .green,
.members-page .tone-3,
.space-detail .tone-3 {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.space-detail .space-nav {
  background: rgba(255, 255, 255, .98);
  border-top-color: #e2e4df;
}

.space-detail .space-nav > view > text:first-child,
.share-page .tab-item.active,
.share-page .empty-btn,
.share-page .bottom-btn {
  color: var(--color-primary);
}

.card-page {
  background: var(--color-bg);
}

.card-page .preview-section {
  background: var(--color-subtle);
}

.card-page .export-canvas,
.card-page .action-btn {
  border-radius: var(--radius-control);
}

.card-page .action-btn {
  box-shadow: none;
}

.contact-create-page .submit-bar,
.contact-accept-page .submit-bar,
.invite-page .submit-bar,
.accept-page .submit-bar {
  background: rgba(255, 255, 255, .98);
  border-top-color: #e2e4df;
}

.contact-create-page .primary,
.contact-accept-page .primary,
.invite-page .primary-button,
.accept-page .primary-button {
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: #fff;
}

/* Keep primary actions and framed controls consistent across newer workflows. */
.ai-page .gen-btn,
.gift-page .generate,
.workflow-page .generate,
.event-detail-page .edit-button,
.event-detail-page .loading-state button {
  border-radius: var(--radius-control);
}

.ai-page .gen-btn {
  background: var(--color-primary);
}

.event-detail-page {
  background: var(--color-bg);
}

.event-detail-page .event-hero {
  background: var(--color-primary);
  box-shadow: 0 12rpx 26rpx rgba(49, 92, 77, .16);
}

.input-card,
.result-card,
.gift-page .field-card,
.gift-page .gift-card,
.gift-page .ai-result,
.workflow-page .field-card,
.workflow-page .result-card {
  border-radius: var(--radius-control);
}

.ai-page .preset-item,
.workflow-page .style-pills view,
.gift-page .gift-icon,
.gift-page .ai-result button {
  border-radius: var(--radius-control);
}

</style>
