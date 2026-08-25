<template>
  <div class="space-y-6">
    <h3 class="text-lg font-semibold text-gray-800">数据总览</h3>

    <!-- Loading -->
    <t-loading v-if="loading" text="加载中..." />
    <LoadError v-else-if="loadError" :message="loadError" @retry="loadDashboard" />

    <!-- Stat Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <t-card :bordered="true" class="stat-card">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <UsergroupIcon class="text-2xl text-blue-600" />
          </div>
          <div>
            <div class="text-sm text-gray-500">关系总数</div>
            <div class="text-2xl font-bold text-gray-800">{{ stats.overview.totalRelationships }}</div>
          </div>
        </div>
      </t-card>

      <t-card :bordered="true" class="stat-card">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <CalendarIcon class="text-2xl text-green-600" />
          </div>
          <div>
            <div class="text-sm text-gray-500">纪念日</div>
            <div class="text-2xl font-bold text-gray-800">{{ stats.overview.totalEvents }}</div>
          </div>
        </div>
      </t-card>

      <t-card :bordered="true" class="stat-card">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <BookmarkIcon class="text-2xl text-purple-600" />
          </div>
          <div>
            <div class="text-sm text-gray-500">回忆记录</div>
            <div class="text-2xl font-bold text-gray-800">{{ stats.overview.totalMemories }}</div>
          </div>
        </div>
      </t-card>

      <t-card :bordered="true" class="stat-card">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
            <NotificationIcon class="text-2xl text-orange-600" />
          </div>
          <div>
            <div class="text-sm text-gray-500">待提醒</div>
            <div class="text-2xl font-bold text-gray-800">{{ stats.overview.monthPendingReminders }}</div>
          </div>
        </div>
      </t-card>
    </div>

    <!-- Charts Row -->
    <div v-if="!loading && !loadError" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Relationship Distribution -->
      <t-card :bordered="true" title="关系分布">
        <div class="h-72">
          <EChart v-if="pieData.length" :option="pieOption" />
          <t-empty v-else description="暂无数据" />
        </div>
      </t-card>

      <!-- Recent Activity -->
      <t-card :bordered="true" title="最近活动">
        <div class="h-72">
          <EChart v-if="barData.length" :option="barOption" />
          <t-empty v-else description="暂无数据" />
        </div>
      </t-card>
    </div>

    <!-- Relationship List -->
    <t-card v-if="!loading && !loadError" :bordered="true" title="关系列表">
      <t-table
        :data="stats.topRelationships"
        :columns="tableColumns"
        row-key="id"
        hover
        :pagination="false"
        size="medium"
      >
        <template #type="{ row }">
          <t-tag variant="light" theme="primary">{{ row.type }}</t-tag>
        </template>
        <template #eventCount="{ row }">
          <span class="text-blue-600 font-medium">{{ row.eventCount }}</span>
        </template>
        <template #memoryCount="{ row }">
          <span class="text-purple-600 font-medium">{{ row.memoryCount }}</span>
        </template>
        <template #action="{ row }">
          <t-link theme="primary" @click="goDetail(row.id)">详情</t-link>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UsergroupIcon, CalendarIcon, BookmarkIcon, NotificationIcon } from 'tdesign-icons-vue-next'
import type { EChartsCoreOption } from 'echarts/core'
import EChart from '@/components/EChart.vue'
import LoadError from '@/components/LoadError.vue'
import { analyticsApi, type DashboardData } from '@/api/api'

const router = useRouter()
const loading = ref(true)
const loadError = ref('')
const stats = ref<DashboardData>({
  overview: { totalRelationships: 0, totalEvents: 0, totalMemories: 0, totalAiRecords: 0, totalReminders: 0, monthPendingReminders: 0 },
  weeklyReminderTrend: [],
  byType: [],
  topRelationships: [],
})

const tableColumns = [
  { colKey: 'name', title: '名称', width: 120 },
  { colKey: 'type', title: '类型', width: 100, cell: 'type' },
  { colKey: 'eventCount', title: '纪念日', width: 80, cell: 'eventCount' },
  { colKey: 'memoryCount', title: '回忆', width: 80, cell: 'memoryCount' },
  { colKey: 'action', title: '操作', width: 80, cell: 'action' },
]

const pieData = computed(() => {
  return stats.value.topRelationships.map((r) => ({ name: r.name, value: r.eventCount + r.memoryCount }))
})

const barData = computed(() => {
  return stats.value.topRelationships.map((r) => ({
    name: r.name,
    events: r.eventCount,
    memories: r.memoryCount,
  }))
})

const pieOption = computed<EChartsCoreOption>(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [{
    type: 'pie',
    radius: ['45%', '72%'],
    center: ['50%', '45%'],
    data: pieData.value,
    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
  }],
}))

const barOption = computed<EChartsCoreOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['纪念日', '回忆'], bottom: 0 },
  xAxis: { type: 'category', data: barData.value.map((d) => d.name) },
  yAxis: { type: 'value' },
  series: [
    { name: '纪念日', type: 'bar', data: barData.value.map((d) => d.events), itemStyle: { color: '#176b5b' } },
    { name: '回忆', type: 'bar', data: barData.value.map((d) => d.memories), itemStyle: { color: '#e85d4a' } },
  ],
  grid: { top: 10, bottom: 40, left: 40, right: 10 },
}))

function goDetail(id: number) {
  router.push(`/relationships/${id}`)
}

async function loadDashboard() {
  loading.value = true
  loadError.value = ''
  try {
    stats.value = await analyticsApi.dashboard()
  } catch (error: any) {
    loadError.value = error?.response?.data?.message || error?.message || '暂时无法读取数据概览，请稍后重试。'
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>
