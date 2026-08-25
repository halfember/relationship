<template>
  <div class="space-y-6">
    <h3 class="text-lg font-semibold text-gray-800">回忆记录</h3>

    <!-- Filter -->
    <t-card :bordered="true" size="small">
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">选择关系：</span>
        <t-select v-model="selectedRelId" placeholder="全部关系" clearable style="width: 220px" @change="loadMemories">
          <t-option v-for="r in relationships" :key="r.id" :value="r.id" :label="r.name" />
        </t-select>
      </div>
    </t-card>

    <t-loading v-if="loading" />
    <LoadError v-else-if="loadError" :message="loadError" @retry="loadPage" />

    <!-- Memory Cards -->
    <div v-else-if="memories.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <t-card v-for="m in memories" :key="m.id" :bordered="true">
        <div class="flex gap-4">
          <img v-if="m.imageUrl" :src="m.imageUrl" class="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
          <div class="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0" v-else>
            <BookmarkIcon class="text-2xl text-gray-300" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-700 leading-relaxed line-clamp-3">{{ m.content }}</p>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-400">{{ formatDate(m.memoryDate || m.createdAt) }}</span>
              <t-popconfirm content="确定删除？" @confirm="handleDelete(m.id)">
                <t-link theme="danger" size="small">删除</t-link>
              </t-popconfirm>
            </div>
          </div>
        </div>
      </t-card>
    </div>
    <t-empty v-else description="暂无回忆记录" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BookmarkIcon } from 'tdesign-icons-vue-next'
import { relationshipApi, memoryApi } from '@/api/api'
import { MessagePlugin } from 'tdesign-vue-next'
import LoadError from '@/components/LoadError.vue'

const loading = ref(true)
const loadError = ref('')
const relationships = ref<any[]>([])
const memories = ref<any[]>([])
const selectedRelId = ref<number | undefined>()

function formatDate(date: string) {
  return date ? date.slice(0, 10) : ''
}

async function loadRelationships() {
  relationships.value = await relationshipApi.list()
}

async function loadMemories() {
  loading.value = true
  loadError.value = ''
  try {
    if (selectedRelId.value) {
      memories.value = await memoryApi.list(selectedRelId.value)
    } else {
      memories.value = await memoryApi.all()
    }
  } catch (error: any) {
    loadError.value = error?.response?.data?.message || error?.message || '暂时无法读取回忆记录，请稍后重试。'
  } finally {
    loading.value = false
  }
}

async function loadPage() {
  loading.value = true
  loadError.value = ''
  try {
    await loadRelationships()
    await loadMemories()
  } catch (error: any) {
    loadError.value = error?.response?.data?.message || error?.message || '暂时无法读取回忆记录，请稍后重试。'
    loading.value = false
  }
}

async function handleDelete(id: number) {
  await memoryApi.remove(id)
  MessagePlugin.success('已删除')
  loadMemories()
}

onMounted(loadPage)
</script>
