<template>
  <div class="ds-detail page-container" v-loading="loading">
    <div v-if="detail" class="card-wrapper">
      <el-breadcrumb separator="/" class="crumb" style="margin-bottom: 16px;">
        <el-breadcrumb-item @click="router.push('/datasets/list')">数据集列表</el-breadcrumb-item>
        <el-breadcrumb-item>详情</el-breadcrumb-item>
      </el-breadcrumb>

      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 20px; margin: 0; display: flex; align-items: center; gap: 10px;">
            <el-icon style="color:#409eff"><FolderOpened /></el-icon>
            {{ detail.name }}
            <el-tag size="small" type="info">{{ detail.code }}</el-tag>
            <el-tag size="small" effect="plain">{{ detail.category || '未分类' }}</el-tag>
          </h1>
          <div style="margin-top: 8px; color: $text-secondary; font-size: 13px;">
            数据源: {{ detail.dataSource || '-' }}
            · 拥有者: {{ detail.ownerName || '-' }}
            · 创建于 {{ formatDate(detail.createdAt) }}
          </div>
        </div>
      </div>

      <el-divider />

      <el-descriptions :column="2" border style="margin-bottom: 20px;">
        <el-descriptions-item label="描述" :span="2">
          {{ detail.description || '暂无描述' }}
        </el-descriptions-item>
        <el-descriptions-item label="指标数量">{{ detail.metrics?.length || 0 }} 个</el-descriptions-item>
        <el-descriptions-item label="授权用户">{{ detail.permissions?.length || 0 }} 人</el-descriptions-item>
        <el-descriptions-item label="关联异常数">{{ detail.anomalyCount || 0 }} 条</el-descriptions-item>
        <el-descriptions-item label="告警规则数">{{ detail.ruleCount || 0 }} 条</el-descriptions-item>
      </el-descriptions>

      <h3 style="margin: 0 0 12px;">指标定义</h3>
      <el-table :data="detail.metrics || []" size="small" border>
        <el-table-column prop="name" label="指标名" width="160" />
        <el-table-column prop="displayName" label="显示名" width="180" />
        <el-table-column prop="description" label="说明" />
        <el-table-column prop="unit" label="单位" width="100" align="center" />
      </el-table>
      <el-empty v-if="!detail.metrics?.length" description="暂无指标定义" :image-size="60" style="padding: 20px 0;" />

      <h3 style="margin: 24px 0 12px;">授权列表</h3>
      <el-table :data="detail.permissions || []" size="small" border>
        <el-table-column label="用户" width="160">
          <template #default="{ row }">{{ row.userName }}</template>
        </el-table-column>
        <el-table-column label="权限" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.level === 'manage'" type="danger" effect="plain">管理</el-tag>
            <el-tag v-else-if="row.level === 'write'" type="warning" effect="plain">读写</el-tag>
            <el-tag v-else type="success" effect="plain">读取</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有效期">
          <template #default="{ row }">
            <template v-if="row.expireAt">
              {{ formatDateShort(row.expireAt) }}
              <el-tag
                v-if="getExpireDays(row.expireAt) <= 7"
                type="danger"
                size="small"
                style="margin-left: 6px;"
              >
                {{ getExpireDays(row.expireAt) }}天后过期
              </el-tag>
            </template>
            <span v-else style="color: $text-secondary;">永久有效</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!detail.permissions?.length" description="暂无授权用户" :image-size="60" style="padding: 20px 0;" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getDataset } from '@/api/datasets'
import { formatDate, formatDateShort } from '@/utils'
import { FolderOpened } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const detail = ref<any>(null)

function getExpireDays(d: any) {
  if (!d) return 9999
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

async function load() {
  loading.value = true
  try {
    detail.value = await getDataset(route.params.id as string)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.crumb {
  :deep(.el-breadcrumb__inner) { cursor: pointer; }
}
</style>
