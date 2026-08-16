<template>
  <div class="space-y-6">
    <!-- Back -->
    <t-link theme="default" @click="goBack">
      <template #prefix-icon><ChevronLeftIcon /></template>
      返回列表
    </t-link>

    <t-loading v-if="loading" />

    <template v-else-if="detail">
      <!-- Basic Info -->
      <t-card :bordered="true">
        <div class="flex items-center gap-4">
          <t-avatar :image="detail.avatar || undefined" size="64px">{{ detail.name?.charAt(0) }}</t-avatar>
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <h2 class="text-2xl font-bold">{{ detail.name }}</h2>
              <t-tag variant="light">{{ detail.type }}</t-tag>
            </div>
            <div class="flex gap-4 text-sm text-gray-500">
              <span v-if="detail.birthday">🎂 生日：{{ formatDate(detail.birthday) }}</span>
              <span v-if="detail.tags?.length">
                🏷️ {{ Array.isArray(detail.tags) ? detail.tags.join('、') : JSON.parse(detail.tags || '[]').join('、') }}
              </span>
            </div>
            <p v-if="detail.remark" class="text-sm text-gray-400 mt-2">{{ detail.remark }}</p>
          </div>
        </div>
      </t-card>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        <t-card :bordered="true">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ detail._count?.events || 0 }}</div>
            <div class="text-sm text-gray-500 mt-1">纪念日</div>
          </div>
        </t-card>
        <t-card :bordered="true">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ detail._count?.memories || 0 }}</div>
            <div class="text-sm text-gray-500 mt-1">回忆</div>
          </div>
        </t-card>
        <t-card :bordered="true">
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ daysSince(detail.createdAt) }}</div>
            <div class="text-sm text-gray-500 mt-1">相识天数</div>
          </div>
        </t-card>
      </div>

      <!-- Events -->
      <t-card :bordered="true" title="纪念日">
        <t-button size="small" theme="primary" variant="outline" class="mb-4" @click="showEventAdd = true">
          <template #icon><AddIcon /></template>
          添加纪念日
        </t-button>
        <t-table
          v-if="detail.events?.length"
          :data="detail.events"
          :columns="eventColumns"
          row-key="id"
          hover
          :pagination="false"
        >
          <template #eventDate="{ row }">
            <span class="text-orange-600 font-medium">{{ formatDate(row.eventDate) }}</span>
          </template>
          <template #repeatType="{ row }">
            <t-tag v-if="row.repeatType" variant="outline" size="small">{{ row.repeatType }}</t-tag>
            <span v-else class="text-gray-400">不重复</span>
          </template>
          <template #eventAction="{ row }">
            <t-popconfirm content="确定删除？" @confirm="handleDeleteEvent(row.id)">
              <t-link theme="danger" size="small">删除</t-link>
            </t-popconfirm>
          </template>
        </t-table>
        <t-empty v-else description="暂无纪念日" />
      </t-card>

      <!-- Memories -->
      <t-card :bordered="true" title="回忆记录">
        <t-button size="small" theme="primary" variant="outline" class="mb-4" @click="showMemoryAdd = true">
          <template #icon><AddIcon /></template>
          添加回忆
        </t-button>
        <div v-if="detail.memories?.length" class="space-y-3">
          <t-card v-for="m in detail.memories" :key="m.id" :bordered="true" size="small">
            <div class="flex gap-4">
              <img v-if="m.imageUrl" :src="m.imageUrl" class="w-20 h-20 rounded-lg object-cover" />
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-700 leading-relaxed">{{ m.content }}</p>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-xs text-gray-400">{{ formatDate(m.memoryDate || m.createdAt) }}</span>
                  <t-popconfirm content="确定删除？" @confirm="handleDeleteMemory(m.id)">
                    <t-link theme="danger" size="small">删除</t-link>
                  </t-popconfirm>
                </div>
              </div>
            </div>
          </t-card>
        </div>
        <t-empty v-else description="暂无回忆记录" />
      </t-card>
    </template>

    <!-- Event Dialog -->
    <t-dialog v-model:visible="showEventAdd" header="添加纪念日" :on-confirm="handleEventSubmit" width="420px">
      <t-form :data="eventForm" label-width="80px" class="mt-4">
        <t-form-item label="标题" name="title">
          <t-input v-model="eventForm.title" placeholder="如：生日、纪念日" />
        </t-form-item>
        <t-form-item label="日期" name="eventDate">
          <t-date-picker v-model="eventForm.eventDate" placeholder="选择日期" />
        </t-form-item>
        <t-form-item label="重复" name="repeatType">
          <t-select v-model="eventForm.repeatType" placeholder="选择">
            <t-option value="" label="不重复" />
            <t-option value="每年" label="每年" />
            <t-option value="每月" label="每月" />
            <t-option value="每周" label="每周" />
          </t-select>
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- Memory Dialog -->
    <t-dialog v-model:visible="showMemoryAdd" header="添加回忆" :on-confirm="handleMemorySubmit" width="480px">
      <t-form :data="memoryForm" label-width="80px" class="mt-4">
        <t-form-item label="内容" name="content">
          <t-textarea v-model="memoryForm.content" placeholder="记录这一刻..." :maxlength="500" :autosize="{ minRows: 3 }" />
        </t-form-item>
        <t-form-item label="图片链接" name="imageUrl">
          <t-input v-model="memoryForm.imageUrl" placeholder="图片URL（可选）" />
        </t-form-item>
        <t-form-item label="日期" name="memoryDate">
          <t-date-picker v-model="memoryForm.memoryDate" placeholder="选择日期" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeftIcon, AddIcon } from 'tdesign-icons-vue-next'
import { relationshipApi, eventApi, memoryApi } from '@/api/api'
import { MessagePlugin } from 'tdesign-vue-next'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const detail = ref<any>(null)
const showEventAdd = ref(false)
const showMemoryAdd = ref(false)

const eventForm = reactive({ title: '', eventDate: '', repeatType: '每年' })
const memoryForm = reactive({ content: '', imageUrl: '', memoryDate: '' })

const eventColumns = [
  { colKey: 'title', title: '标题', width: 120 },
  { colKey: 'eventDate', title: '日期', width: 120, cell: 'eventDate' },
  { colKey: 'repeatType', title: '重复', width: 80, cell: 'repeatType' },
  { colKey: 'eventAction', title: '操作', width: 60, cell: 'eventAction' },
]

function goBack() {
  router.push('/relationships')
}

function formatDate(date: string) {
  return date ? date.slice(0, 10) : ''
}

function daysSince(date: string) {
  return date ? Math.floor((Date.now() - new Date(date).getTime()) / 86400000) : 0
}

async function loadDetail() {
  loading.value = true
  detail.value = await relationshipApi.detail(Number(route.params.id))
  loading.value = false
}

async function handleEventSubmit() {
  if (!eventForm.title || !eventForm.eventDate) {
    MessagePlugin.warning('请填写完整')
    return
  }
  await eventApi.create({
    relationshipId: Number(route.params.id),
    title: eventForm.title,
    eventDate: new Date(eventForm.eventDate).toISOString(),
    repeatType: eventForm.repeatType || undefined,
  })
  MessagePlugin.success('添加成功')
  showEventAdd.value = false
  eventForm.title = ''
  eventForm.eventDate = ''
  loadDetail()
}

async function handleMemorySubmit() {
  if (!memoryForm.content) {
    MessagePlugin.warning('请填写内容')
    return
  }
  await memoryApi.create({
    relationshipId: Number(route.params.id),
    content: memoryForm.content,
    imageUrl: memoryForm.imageUrl || undefined,
    memoryDate: memoryForm.memoryDate ? new Date(memoryForm.memoryDate).toISOString() : undefined,
  })
  MessagePlugin.success('添加成功')
  showMemoryAdd.value = false
  memoryForm.content = ''
  memoryForm.imageUrl = ''
  memoryForm.memoryDate = ''
  loadDetail()
}

async function handleDeleteEvent(id: number) {
  await eventApi.remove(id)
  MessagePlugin.success('已删除')
  loadDetail()
}

async function handleDeleteMemory(id: number) {
  await memoryApi.remove(id)
  MessagePlugin.success('已删除')
  loadDetail()
}

onMounted(loadDetail)
</script>
