<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-800">关系管理</h3>
      <t-button theme="primary" @click="showCreate = true">
        <template #icon><AddIcon /></template>
        添加关系
      </t-button>
    </div>

    <!-- Table -->
    <t-card :bordered="true">
      <t-loading v-if="loading" />
      <LoadError v-else-if="loadError" :message="loadError" @retry="loadList" />
      <t-table
        v-else
        :data="list"
        :columns="columns"
        row-key="id"
        hover
        :pagination="{ defaultPageSize: 10 }"
        size="medium"
      >
        <template #avatar="{ row }">
          <t-avatar :image="row.avatar || undefined" size="40px">
            {{ row.name?.charAt(0) }}
          </t-avatar>
        </template>
        <template #type="{ row }">
          <t-tag variant="light">{{ row.type }}</t-tag>
        </template>
        <template #tags="{ row }">
          <t-space size="4px" v-if="row.tags">
            <t-tag v-for="tag in (Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'))" :key="tag" size="small" variant="outline">
              {{ tag }}
            </t-tag>
          </t-space>
        </template>
        <template #action="{ row }">
          <t-space>
            <t-link theme="primary" @click="goDetail(row.id)">详情</t-link>
            <t-link theme="primary" @click="editRow(row)">编辑</t-link>
            <t-popconfirm content="确定删除？" @confirm="handleDelete(row.id)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
      <t-empty v-if="!loading && !loadError && list.length === 0" description="暂无关系，请添加" />
    </t-card>

    <!-- Create/Edit Dialog -->
    <t-dialog
      v-model:visible="showCreate"
      :header="editingId ? '编辑关系' : '添加关系'"
      :on-confirm="handleSubmit"
      width="480px"
    >
      <t-form :data="form" label-width="80px" class="mt-4">
        <t-form-item label="名称" name="name">
          <t-input v-model="form.name" placeholder="请输入名称" />
        </t-form-item>
        <t-form-item label="类型" name="type">
          <t-select v-model="form.type" placeholder="请选择类型">
            <t-option value="家人" label="家人" />
            <t-option value="朋友" label="朋友" />
            <t-option value="同事" label="同事" />
            <t-option value="客户" label="客户" />
            <t-option value="恋人" label="恋人" />
            <t-option value="其他" label="其他" />
          </t-select>
        </t-form-item>
        <t-form-item label="头像URL" name="avatar">
          <t-input v-model="form.avatar" placeholder="头像图片链接（可选）" />
        </t-form-item>
        <t-form-item label="生日" name="birthday">
          <t-date-picker v-model="form.birthday" placeholder="请选择生日" />
        </t-form-item>
        <t-form-item label="标签" name="tags">
          <t-tag-input v-model="form.tagsList" placeholder="输入后回车添加" />
        </t-form-item>
        <t-form-item label="备注" name="remark">
          <t-textarea v-model="form.remark" placeholder="备注信息（可选）" :maxlength="200" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AddIcon } from 'tdesign-icons-vue-next'
import LoadError from '@/components/LoadError.vue'
import { relationshipApi } from '@/api/api'
import { MessagePlugin } from 'tdesign-vue-next'

const router = useRouter()
const loading = ref(true)
const loadError = ref('')
const list = ref<any[]>([])
const showCreate = ref(false)
const editingId = ref(0)

const columns = [
  { colKey: 'avatar', title: '头像', width: 70, cell: 'avatar' },
  { colKey: 'name', title: '名称', width: 120 },
  { colKey: 'type', title: '类型', width: 80, cell: 'type' },
  { colKey: 'tags', title: '标签', cell: 'tags' },
  { colKey: 'action', title: '操作', width: 160, cell: 'action' },
]

const defaultForm = {
  name: '',
  type: '朋友',
  avatar: '',
  birthday: '',
  tagsList: [] as string[],
  remark: '',
}

const form = reactive({ ...defaultForm })

function resetForm() {
  Object.assign(form, defaultForm)
  editingId.value = 0
}

function editRow(row: any) {
  const tags = Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : [])
  Object.assign(form, {
    name: row.name,
    type: row.type,
    avatar: row.avatar || '',
    birthday: row.birthday ? row.birthday.slice(0, 10) : '',
    tagsList: tags,
    remark: row.remark || '',
  })
  editingId.value = row.id
  showCreate.value = true
}

async function loadList() {
  loading.value = true
  loadError.value = ''
  try {
    list.value = await relationshipApi.list()
  } catch (error: any) {
    loadError.value = error?.response?.data?.message || error?.message || '暂时无法读取关系列表，请稍后重试。'
  } finally {
    loading.value = false
  }
}

function goDetail(id: number) {
  router.push(`/relationships/${id}`)
}

async function handleSubmit() {
  if (!form.name.trim()) {
    MessagePlugin.warning('请输入名称')
    return
  }
  const payload: any = {
    name: form.name.trim(),
    type: form.type,
    avatar: form.avatar || undefined,
    tags: form.tagsList.length ? form.tagsList : undefined,
    remark: form.remark || undefined,
  }
  if (form.birthday) {
    payload.birthday = new Date(form.birthday).toISOString()
  }

  if (editingId.value) {
    await relationshipApi.update(editingId.value, payload)
    MessagePlugin.success('编辑成功')
  } else {
    await relationshipApi.create(payload)
    MessagePlugin.success('添加成功')
  }
  showCreate.value = false
  resetForm()
  loadList()
}

async function handleDelete(id: number) {
  await relationshipApi.remove(id)
  MessagePlugin.success('删除成功')
  loadList()
}

onMounted(loadList)
</script>
