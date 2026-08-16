<template>
  <div class="space-y-6">
    <h3 class="text-lg font-semibold text-gray-800">纪念日列表</h3>

    <!-- Filter -->
    <t-card :bordered="true" size="small">
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">选择关系：</span>
        <t-select v-model="selectedRelId" placeholder="全部关系" clearable style="width: 220px" @change="loadEvents">
          <t-option
            v-for="r in relationships"
            :key="r.id"
            :value="r.id"
            :label="r.name"
          />
        </t-select>
      </div>
    </t-card>

    <t-loading v-if="loading" />

    <!-- Events Table -->
    <t-card v-else :bordered="true">
      <t-table
        :data="events"
        :columns="columns"
        row-key="id"
        hover
        :pagination="{ defaultPageSize: 10 }"
      >
        <template #eventDate="{ row }">
          <span class="text-orange-600 font-medium">{{ formatDate(row.eventDate) }}</span>
        </template>
        <template #repeatType="{ row }">
          <t-tag v-if="row.repeatType" variant="outline" size="small">
            {{ row.repeatType }}
          </t-tag>
          <span v-else class="text-gray-400">不重复</span>
        </template>
        <template #action="{ row }">
          <t-popconfirm content="确定删除？" @confirm="handleDelete(row.id)">
            <t-link theme="danger" size="small">删除</t-link>
          </t-popconfirm>
        </template>
      </t-table>
      <t-empty v-if="events.length === 0" description="暂无纪念日" />
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { relationshipApi, eventApi } from '@/api/api'
import { MessagePlugin } from 'tdesign-vue-next'

const loading = ref(true)
const relationships = ref<any[]>([])
const events = ref<any[]>([])
const selectedRelId = ref<number | undefined>()

const columns = [
  { colKey: 'title', title: '标题', width: 150 },
  { colKey: 'eventDate', title: '日期', width: 150, cell: 'eventDate' },
  { colKey: 'repeatType', title: '重复', width: 100, cell: 'repeatType' },
  { colKey: 'action', title: '操作', width: 80, cell: 'action' },
]

function formatDate(date: string) {
  return date ? date.slice(0, 10) : ''
}

async function loadRelationships() {
  relationships.value = await relationshipApi.list()
}

async function loadEvents() {
  loading.value = true
  if (selectedRelId.value) {
    events.value = await eventApi.list(selectedRelId.value)
  } else {
    events.value = await eventApi.all()
  }
  loading.value = false
}

async function handleDelete(id: number) {
  await eventApi.remove(id)
  MessagePlugin.success('已删除')
  loadEvents()
}

onMounted(async () => {
  await loadRelationships()
  await loadEvents()
})
</script>
