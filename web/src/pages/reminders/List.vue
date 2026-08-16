<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-800">提醒列表</h3>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">未来</span>
        <t-input-number v-model="days" :min="1" :max="90" style="width: 80px" @change="loadData" />
        <span class="text-sm text-gray-500">天</span>
        <t-button size="small" variant="outline" @click="loadToday">今日提醒</t-button>
      </div>
    </div>

    <t-loading v-if="loading" />

    <!-- Today's Reminders -->
    <t-card v-if="todayReminders.length" :bordered="true" title="今日提醒" class="border-l-4 border-l-orange-400">
      <div v-for="r in todayReminders" :key="r.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
        <div>
          <span class="font-medium">{{ r.eventTitle }}</span>
          <span class="text-gray-400 ml-2">- {{ r.relationshipName }}</span>
        </div>
        <t-tag theme="warning" size="small">今天</t-tag>
      </div>
    </t-card>

    <!-- Upcoming -->
    <t-card :bordered="true" :title="`未来 ${days} 天内的提醒`">
      <t-table
        v-if="upcoming.length"
        :data="upcoming"
        :columns="columns"
        row-key="id"
        hover
        :pagination="false"
      >
        <template #daysUntil="{ row }">
          <t-tag :theme="row.daysUntilEvent <= 3 ? 'danger' : row.daysUntilEvent <= 7 ? 'warning' : 'default'" size="small">
            {{ row.daysUntilEvent === 0 ? '今天' : `${row.daysUntilEvent} 天后` }}
          </t-tag>
        </template>
        <template #action="{ row }">
          <t-button
            v-if="!row.acknowledged"
            size="small"
            variant="outline"
            theme="primary"
            @click="handleAcknowledge(row.id)"
          >
            标记已处理
          </t-button>
          <t-tag v-else theme="success" size="small">已处理</t-tag>
        </template>
        <template #deliveryStatus="{ row }">
          <t-tag :theme="deliveryTheme(row.deliveryStatus)" size="small">{{ deliveryLabel(row.deliveryStatus) }}</t-tag>
        </template>
      </t-table>
      <t-empty v-else description="暂无提醒" />
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reminderApi } from '@/api/api'
import { MessagePlugin } from 'tdesign-vue-next'

const loading = ref(true)
const days = ref(30)
const upcoming = ref<any[]>([])
const todayReminders = ref<any[]>([])

const columns = [
  { colKey: 'eventTitle', title: '事件', width: 150 },
  { colKey: 'relationshipName', title: '关系', width: 100 },
  { colKey: 'eventDate', title: '日期', width: 120 },
  { colKey: 'daysUntil', title: '倒计时', width: 100, cell: 'daysUntil' },
  { colKey: 'deliveryStatus', title: '微信送达', width: 110, cell: 'deliveryStatus' },
  { colKey: 'action', title: '处理状态', width: 120, cell: 'action' },
]

const deliveryLabel = (status: string) => ({ PENDING:'待发送', SENDING:'发送中', RETRY:'重试中', SENT:'已送达', NO_PERMISSION:'未授权', FAILED:'发送失败' }[status] || status || '待发送')
const deliveryTheme = (status: string) => status === 'SENT' ? 'success' : status === 'FAILED' ? 'danger' : status === 'NO_PERMISSION' ? 'warning' : 'default'

async function loadData() {
  loading.value = true
  upcoming.value = await reminderApi.upcoming(undefined, days.value)
  loading.value = false
}

async function loadToday() {
  todayReminders.value = await reminderApi.today()
}

async function handleAcknowledge(id: number) {
  await reminderApi.acknowledge(id)
  MessagePlugin.success('已标记处理')
  loadData()
}

onMounted(() => {
  loadData()
  loadToday()
})
</script>
