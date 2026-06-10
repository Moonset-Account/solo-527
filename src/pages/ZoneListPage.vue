<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { zoneApi } from '@/api'
import type { Zone } from '@/types'

const router = useRouter()

const loading = ref(false)
const zones = ref<Zone[]>([])

function truncate(text: string, maxLen: number = 20) {
  if (!text) return '-'
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

async function fetchZones() {
  loading.value = true
  try {
    zones.value = await zoneApi.getList()
  } catch {
    ElMessage.error('获取分区列表失败')
  } finally {
    loading.value = false
  }
}

function handleNameClick(zone: Zone) {
  router.push(`/zones/${zone.id}`)
}

function handleView(zone: Zone) {
  router.push(`/zones/${zone.id}`)
}

function handleEdit(zone: Zone) {
  router.push(`/zones/${zone.id}`)
}

onMounted(() => {
  fetchZones()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>分区管理</h2>
      <el-button type="primary">新增分区</el-button>
    </div>

    <el-table :data="zones" v-loading="loading" stripe style="width: 100%">
      <el-table-column label="分区名称" min-width="140">
        <template #default="{ row }">
          <span class="link-text" @click="handleNameClick(row)">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="meterCount" label="表计数量" width="120" />
      <el-table-column label="总能耗" width="160">
        <template #default="{ row }">
          {{ row.totalUsage.toLocaleString() }} kWh
        </template>
      </el-table-column>
      <el-table-column label="来源单据" min-width="150">
        <template #default="{ row }">
          <span class="link-text">{{ row.sourceDocumentNo }}</span>
        </template>
      </el-table-column>
      <el-table-column label="补充说明" min-width="200">
        <template #default="{ row }">
          <el-tooltip v-if="row.remark && row.remark.length > 20" :content="row.remark" placement="top">
            <span>{{ truncate(row.remark) }}</span>
          </el-tooltip>
          <span v-else>{{ truncate(row.remark) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleView(row)">查看详情</el-button>
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
