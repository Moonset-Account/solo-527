<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const { get, put } = useApi()
const datasetId = route.params.id

interface Field {
  id: number
  name: string
  type: string
  isDesensitized: boolean
  desensitizationType: string
  description: string
  desensitizationRules: Array<{ id: number; type: string; params: string; version: number }>
}

interface Version {
  id: number
  version: number
  snapshot: any
  changedByName: string
  changedAt: string
  changeDescription: string
}

const dataset = ref<any>(null)
const fields = ref<Field[]>([])
const versions = ref<Version[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  const data = await get<any>(`/api/datasets/${datasetId}`)
  if (data) {
    dataset.value = data
    fields.value = data.fields || []
  }
  const vData = await get<any[]>(`/api/datasets/${datasetId}/versions`)
  if (vData) {
    versions.value = vData
  }
  loading.value = false
})

async function handleSave() {
  const ok = await put(`/api/datasets/${datasetId}`, {
    name: dataset.value.name,
    description: dataset.value.description,
    source: dataset.value.source,
    fields: fields.value,
  })
  if (ok !== null) {
    ElMessage.success('保存成功')
  }
}
</script>

<template>
  <div v-loading="loading" class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold" style="color: var(--color-text)">{{ dataset?.name || '加载中...' }}</h2>
        <div class="flex items-center gap-4 mt-1 text-sm" style="color: var(--color-text-secondary)">
          <span>来源: {{ dataset?.source || '-' }}</span>
          <span>版本: <span class="font-mono">v{{ dataset?.version || 0 }}</span></span>
          <span>创建人: {{ dataset?.createdByName || '-' }}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <el-button @click="router.push('/datasets')">返回</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 p-5 rounded-lg" style="background: var(--color-bg-card); border: 1px solid var(--color-border)">
        <h3 class="text-base font-semibold mb-4" style="color: var(--color-text)">字段列表</h3>
        <el-table :data="fields" stripe>
          <el-table-column prop="name" label="字段名" min-width="120" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column label="是否脱敏" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.isDesensitized" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="脱敏方式" width="140">
            <template #default="{ row }">
              <el-select v-if="row.isDesensitized" v-model="row.desensitizationType" size="small" style="width: 120px">
                <el-option label="掩码" value="mask" />
                <el-option label="哈希" value="hash" />
                <el-option label="替换" value="replace" />
                <el-option label="截断" value="truncate" />
              </el-select>
              <span v-else style="color: var(--color-text-muted)">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.description" size="small" placeholder="描述" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="space-y-4">
        <div class="p-5 rounded-lg" style="background: var(--color-bg-card); border: 1px solid var(--color-border)">
          <h3 class="text-base font-semibold mb-4" style="color: var(--color-text)">脱敏规则详情</h3>
          <div v-for="field in fields.filter(f => f.isDesensitized)" :key="field.id" class="mb-3 p-3 rounded" style="background: var(--color-bg); border: 1px solid var(--color-border)">
            <div class="font-medium text-sm mb-1">{{ field.name }}</div>
            <div class="text-xs" style="color: var(--color-text-secondary)">方式: {{ field.desensitizationType || '未设置' }}</div>
            <div v-if="field.desensitizationRules?.length" class="mt-1">
              <div v-for="rule in field.desensitizationRules" :key="rule.id" class="text-xs" style="color: var(--color-text-muted)">
                规则: {{ rule.type }} (v{{ rule.version }})
              </div>
            </div>
          </div>
          <div v-if="!fields.some(f => f.isDesensitized)" class="text-sm" style="color: var(--color-text-muted)">暂无脱敏字段</div>
        </div>
      </div>
    </div>

    <div class="p-5 rounded-lg" style="background: var(--color-bg-card); border: 1px solid var(--color-border)">
      <h3 class="text-base font-semibold mb-4" style="color: var(--color-text)">版本历史</h3>
      <el-timeline v-if="versions.length">
        <el-timeline-item v-for="v in versions" :key="v.id" :timestamp="v.changedAt" placement="top">
          <div class="text-sm font-medium" style="color: var(--color-text)">
            版本 <span class="font-mono">v{{ v.version }}</span>
          </div>
          <div class="text-xs" style="color: var(--color-text-secondary)">
            {{ v.changeDescription }} - {{ v.changedByName }}
          </div>
        </el-timeline-item>
      </el-timeline>
      <div v-else class="text-sm" style="color: var(--color-text-muted)">暂无版本记录</div>
    </div>
  </div>
</template>
