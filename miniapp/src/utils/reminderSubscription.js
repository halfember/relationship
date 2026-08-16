export const REMINDER_TEMPLATE_ID = import.meta.env.VITE_WECHAT_REMINDER_TEMPLATE_ID
  || 'TNDeCEq2sRHrJrbw_ZloWQfqlRNOyjXBfuwsWEySDp8';

export function requestReminderSubscription() {
  if (typeof uni.requestSubscribeMessage !== 'function') return Promise.resolve(false);
  return new Promise((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds: [REMINDER_TEMPLATE_ID],
      success: (result) => resolve(result?.[REMINDER_TEMPLATE_ID] === 'accept'),
      fail: () => resolve(false),
    });
  });
}
