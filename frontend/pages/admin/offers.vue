<template>
  <n-card :bordered="false">
    <template #header>
      <div class="header">
        <span>录用管理</span>
        <n-button type="primary" @click="showCreate = true">新建Offer</n-button>
      </div>
    </template>

    <n-data-table
      :columns="columns"
      :data="offers"
      :loading="loading"
      :row-key="(row: any) => row.id"
    />
  </n-card>

  <n-modal v-model:show="showCreate" preset="dialog" title="新建Offer" :style="{ width: '600px' }">
    <n-form :model="form" label-placement="top">
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="Offer标题">
            <n-input v-model:value="form.offer_title" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="关联投递ID">
            <n-input-number v-model:value="form.application_id" :min="1" style="width: 100%" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="基本工资">
            <n-input-number v-model:value="form.salary_base" :min="0" style="width: 100%" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="试用期(月)">
            <n-input-number v-model:value="form.probation_months" :min="0" :max="12" style="width: 100%" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="所属部门">
            <n-input v-model:value="form.department" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="工作地点">
            <n-input v-model:value="form.work_location" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-form-item label="福利待遇">
        <n-input v-model:value="form.benefits" type="textarea" :rows="2" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showCreate = false">取消</n-button>
      <n-button type="primary" :loading="creating" @click="createOffer">创建</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useMessage } from 'naive-ui'
import api from '~/utils/api'
import { offerStatusLabels } from '~/utils/dict'
import type { Offer } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()

const offers = ref<Offer[]>([])
const loading = ref(false)

const showCreate = ref(false)
const creating = ref(false)

const form = ref<any>({
  application_id: null,
  offer_title: '',
  salary_base: null,
  department: '',
  work_location: '',
  probation_months: 3,
  benefits: '',
  status: 'draft',
})

const statusTypeMap: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  draft: 'default',
  sent: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
  cancelled: 'default',
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: 'Offer标题', key: 'offer_title' },
  { title: '部门', key: 'department' },
  {
    title: '基本工资',
    key: 'salary_base',
    render(row: any) {
      return row.salary_base ? `¥${row.salary_base}` : '-'
    },
  },
  {
    title: '状态',
    key: 'status',
    render(row: any) {
      return h('n-tag', { type: statusTypeMap[row.status] }, () => offerStatusLabels[row.status])
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render(row: any) {
      return h(
        'n-space',
        { size: 'small' },
        () => [
          h('n-button', { size: 'small', onClick: () => sendOffer(row.id) }, () => '发送'),
          h('n-button', { size: 'small', quaternary: true }, () => '编辑'),
        ]
      )
    },
  },
]

async function loadOffers() {
  loading.value = true
  try {
    const res = await api.get('/admin/offers')
    offers.value = res.data
  } catch (e) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function createOffer() {
  if (!form.value.offer_title) {
    message.warning('请输入Offer标题')
    return
  }
  creating.value = true
  try {
    await api.post('/admin/offers', form.value)
    message.success('创建成功')
    showCreate.value = false
    loadOffers()
  } catch (e) {
    message.error('创建失败')
  } finally {
    creating.value = false
  }
}

async function sendOffer(id: number) {
  try {
    await api.post(`/admin/offers/${id}/send`)
    message.success('发送成功')
    loadOffers()
  } catch (e) {
    message.error('发送失败')
  }
}

onMounted(() => {
  loadOffers()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
