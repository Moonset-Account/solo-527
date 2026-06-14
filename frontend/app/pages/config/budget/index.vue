<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px">
      <n-text strong style="font-size: 16px">预算版本管理</n-text>
      <n-space>
        <n-select v-model:value="contractIdFilter" :options="contractOptions" placeholder="选择合同" clearable style="width: 200px" @update:value="handleFilter" />
        <n-button type="primary" @click="showAddModal = true">新增版本</n-button>
      </n-space>
    </n-space>

    <n-grid :cols="2" :x-gap="16" :y-gap="16">
      <n-gi>
        <n-card title="版本列表" size="small">
          <n-data-table :columns="versionColumns" :data="store.budgetVersions" :loading="store.loading" :bordered="false" />
          <n-empty v-if="store.budgetVersions.length === 0" description="暂无预算版本" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="变更日志" size="small">
          <n-timeline>
            <n-timeline-item v-for="log in store.changelog" :key="log.id" :title="`${log.action} - ${log.entity_type}`" :time="log.changed_at">
              <n-text depth="3">{{ log.changed_by }} - {{ log.detail || '' }}</n-text>
            </n-timeline-item>
          </n-timeline>
          <n-empty v-if="store.changelog.length === 0" description="暂无变更记录" />
        </n-card>
      </n-gi>
    </n-grid>

    <n-modal v-model:show="showAddModal" preset="dialog" title="新增预算版本" positive-text="确认" negative-text="取消" @positive-click="handleAdd">
      <n-form :model="addForm" label-placement="left" label-width="80">
        <n-form-item label="合同ID">
          <n-input-number v-model:value="addForm.contract_id" placeholder="合同ID" style="width: 100%" />
        </n-form-item>
        <n-form-item label="版本号">
          <n-input v-model:value="addForm.version" placeholder="如 v1.0" />
        </n-form-item>
        <n-form-item label="预算明细">
          <n-dynamic-input v-model:value="addForm.items" :on-create="createBudgetItem">
            <template #default="{ value: item }">
              <n-space>
                <n-input v-model:value="item.name" placeholder="项目名" style="width: 120px" />
                <n-input-number v-model:value="item.amount" placeholder="金额" style="width: 120px" />
                <n-input v-model:value="item.unit" placeholder="单位" style="width: 80px" />
              </n-space>
            </template>
          </n-dynamic-input>
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, NTag } from 'naive-ui'
import { useConfigStore } from '~/stores/config'
import { contractApi } from '~/utils/api'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const store = useConfigStore()
const showAddModal = ref(false)
const contractIdFilter = ref<number | null>(null)
const contractOptions = ref<{ label: string; value: number }[]>([])

const addForm = reactive({
  contract_id: undefined as number | undefined,
  version: '',
  items: [] as { name: string; amount: number; unit: string }[],
})

function createBudgetItem() {
  return { name: '', amount: 0, unit: '' }
}

const versionColumns = [
  { title: '版本', key: 'version' },
  {
    title: '明细', key: 'items',
    render: (row: any) => h('div', {}, (row.items || []).map((item: any) =>
      h(NTag, { size: 'small', style: 'margin: 2px' }, { default: () => `${item.name}: ¥${item.amount}` })
    )),
  },
  { title: '总额', key: 'total', render: (row: any) => `¥${row.total?.toLocaleString() ?? 0}` },
  { title: '创建时间', key: 'created_at', render: (row: any) => row.created_at?.slice(0, 10) ?? '' },
]

function handleFilter() {
  store.fetchBudgetVersions(contractIdFilter.value ? { contract_id: contractIdFilter.value } : undefined)
  store.fetchChangelog({ entity_type: 'budget_version' })
}

async function handleAdd() {
  if (!addForm.contract_id || !addForm.version) {
    message.warning('请填写合同和版本号')
    return
  }
  try {
    await store.createBudgetVersion(addForm)
    message.success('版本创建成功')
    store.fetchBudgetVersions(contractIdFilter.value ? { contract_id: contractIdFilter.value } : undefined)
    store.fetchChangelog({ entity_type: 'budget_version' })
  } catch (e: any) {
    message.error(e?.data?.detail || '创建失败')
  }
}

async function loadContracts() {
  try {
    const res = await contractApi.list({ page: 1, size: 100 })
    contractOptions.value = res.items.map((c: any) => ({ label: c.name, value: c.id }))
  } catch {}
}

onMounted(() => {
  loadContracts()
  store.fetchBudgetVersions()
  store.fetchChangelog({ entity_type: 'budget_version' })
})
</script>
