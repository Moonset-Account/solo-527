<template>
  <n-card :bordered="false">
    <template #header>
      <div class="header">
        <span>职位列表</span>
        <div class="actions">
          <n-input
            v-model:value="keyword"
            placeholder="搜索职位"
            clearable
            style="width: 200px"
            @keyup.enter="loadPositions"
          >
            <template #prefix>
              <n-icon><SearchOutlined /></n-icon>
            </template>
          </n-input>
          <n-select
            v-model:value="filterType"
            placeholder="职位类型"
            :options="typeOptions"
            style="width: 120px"
            @update:value="loadPositions"
          />
          <n-button v-if="!isCandidate" type="primary" @click="showCreate = true">
            新建职位
          </n-button>
        </div>
      </div>
    </template>

    <n-list bordered>
      <n-list-item v-for="pos in positions" :key="pos.id" style="padding: 16px">
        <n-thing>
          <template #header>
            <div class="position-header">
              <span class="position-title">{{ pos.title }}</span>
              <n-tag type="success" v-if="pos.salary_range">{{ pos.salary_range }}</n-tag>
            </div>
          </template>
          <template #description>
            <div class="position-meta">
              <span>{{ pos.department || '-' }}</span>
              <span v-if="pos.city">· {{ pos.city }}</span>
              <span v-if="pos.job_type">· {{ pos.job_type }}</span>
              <span v-if="pos.headcount">· 招{{ pos.headcount }}人</span>
            </div>
          </template>
          {{ pos.description || '暂无描述' }}
          <template #action>
            <n-space>
              <n-button
                v-if="isCandidate"
                type="primary"
                size="small"
                @click="applyPosition(pos.id)"
                :loading="applyingId === pos.id"
              >
                立即投递
              </n-button>
              <n-button size="small" @click="viewDetail(pos.id)">查看详情</n-button>
            </n-space>
          </template>
        </n-thing>
      </n-list-item>
      <n-list-item v-if="positions.length === 0">
        <div style="text-align: center; color: #999; padding: 40px">
          暂无职位
        </div>
      </n-list-item>
    </n-list>

    <n-pagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :item-count="total"
      show-size-picker
      style="margin-top: 16px; justify-content: flex-end"
      @update:page="loadPositions"
      @update:page-size="loadPositions"
    />
  </n-card>

  <n-modal v-model:show="showCreate" preset="dialog" title="新建职位" :style="{ width: '600px' }">
    <n-form :model="createForm" label-placement="top">
      <n-grid :cols="2" :x-gap="16">
        <n-grid-item>
          <n-form-item label="职位名称">
            <n-input v-model:value="createForm.title" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="所属部门">
            <n-input v-model:value="createForm.department" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="工作城市">
            <n-input v-model:value="createForm.city" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="薪资范围">
            <n-input v-model:value="createForm.salary_range" placeholder="如: 20k-30k" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-form-item label="职位描述">
        <n-input v-model:value="createForm.description" type="textarea" :rows="4" />
      </n-form-item>
      <n-form-item label="任职要求">
        <n-input v-model:value="createForm.requirements" type="textarea" :rows="4" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showCreate = false">取消</n-button>
      <n-button type="primary" :loading="creating" @click="createPosition">确认创建</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SearchOutlined } from '@vicons/antd'
import { useMessage } from 'naive-ui'
import api from '~/utils/api'
import { useAuthStore } from '~/stores/auth'
import type { Position } from '~/types'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const authStore = useAuthStore()

const isCandidate = computed(() => authStore.user?.role === 'candidate')

const positions = ref<Position[]>([])
const keyword = ref('')
const filterType = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const applyingId = ref<number | null>(null)

const showCreate = ref(false)
const creating = ref(false)

const typeOptions = [
  { label: '全职', value: 'full_time' },
  { label: '实习', value: 'intern' },
  { label: '校招', value: 'campus' },
]

const createForm = ref({
  title: '',
  department: '',
  job_type: 'campus',
  city: '',
  salary_range: '',
  description: '',
  requirements: '',
  headcount: 1,
})

async function loadPositions() {
  try {
    const res = await api.get('/positions', {
      params: {
        keyword: keyword.value || undefined,
        job_type: filterType.value || undefined,
        skip: (page.value - 1) * pageSize.value,
        limit: pageSize.value,
        is_active: true,
      },
    })
    positions.value = res.data
  } catch (e) {
    // ignore
  }
}

async function applyPosition(id: number) {
  if (!authStore.isLoggedIn) {
    navigateTo('/login')
    return
  }
  applyingId.value = id
  try {
    await api.post('/applications', { position_id: id, source_channel: 'online' })
    message.success('投递成功！')
  } catch (err: any) {
    message.error(err.response?.data?.detail || '投递失败')
  } finally {
    applyingId.value = null
  }
}

function viewDetail(id: number) {
  // TODO: 详情页
  message.info('详情功能开发中')
}

async function createPosition() {
  if (!createForm.value.title) {
    message.warning('请填写职位名称')
    return
  }
  creating.value = true
  try {
    await api.post('/positions', createForm.value)
    message.success('创建成功')
    showCreate.value = false
    loadPositions()
  } catch (err: any) {
    message.error(err.response?.data?.detail || '创建失败')
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadPositions()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.actions {
  display: flex;
  gap: 8px;
}
.position-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.position-title {
  font-size: 16px;
  font-weight: 600;
}
.position-meta {
  color: #666;
  font-size: 13px;
  display: flex;
  gap: 4px;
}
</style>
