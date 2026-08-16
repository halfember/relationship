export function openContactCreationMenu() {
  uni.showActionSheet({
    itemList: ['手动添加联系人', '邀请成为联系人', '创建共同空间', '输入邀请码'],
    success: ({ tapIndex }) => {
      if (tapIndex === 0) uni.navigateTo({ url: '/pages/relationship/create' });
      if (tapIndex === 1) uni.navigateTo({ url: '/pages/contact/invite-create' });
      if (tapIndex === 2) uni.navigateTo({ url: '/pages/space/invite-create' });
      if (tapIndex === 3) openInviteCodeInput();
    },
  });
}

function openInviteCodeInput() {
  uni.showModal({
    title: '接受邀请',
    editable: true,
    placeholderText: '输入邀请码',
    success: ({ confirm, content }) => {
      const token = (content || '').trim().toUpperCase();
      if (!confirm) return;
      if (!/^[A-HJ-NP-Z2-9]+$/.test(token)) {
        uni.showToast({ title: '邀请码格式不正确', icon: 'none' });
        return;
      }
      if (token.length === 8) {
        uni.navigateTo({ url: `/pages/contact/invite-accept?token=${token}` });
        return;
      }
      if (token.length === 10) {
        uni.navigateTo({ url: `/pages/space/invite-accept?token=${token}` });
        return;
      }
      uni.showToast({ title: '邀请码应为8位或10位', icon: 'none' });
    },
  });
}
