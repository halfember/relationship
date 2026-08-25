<template>
  <div class="load-error" role="alert">
    <div>
      <div class="load-error__title">{{ title }}</div>
      <div class="load-error__message">{{ message }}</div>
    </div>
    <t-button variant="outline" theme="primary" @click="$emit('retry')">重新加载</t-button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  message?: string
}>(), {
  title: '数据加载失败',
  message: '请检查网络连接后重试。',
})

defineEmits<{ retry: [] }>()
</script>

<style scoped>
.load-error {
  min-height: 112px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border: 1px solid #d9ddd8;
  border-left: 3px solid #c76755;
  border-radius: 6px;
  background: #fff;
}

.load-error__title {
  color: #202522;
  font-size: 15px;
  font-weight: 600;
}

.load-error__message {
  margin-top: 6px;
  color: #68706b;
  font-size: 14px;
}

@media (max-width: 640px) {
  .load-error {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
}
</style>
