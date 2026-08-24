export function openContactCreationMenu() {
  uni.showActionSheet({
    itemList: ['手动添加联系人', '邀请成为联系人'],
    success: ({ tapIndex }) => {
      if (tapIndex === 0) uni.navigateTo({ url: '/pages/relationship/create' });
      if (tapIndex === 1) uni.navigateTo({ url: '/pages/contact/invite-create' });
    },
  });
}
