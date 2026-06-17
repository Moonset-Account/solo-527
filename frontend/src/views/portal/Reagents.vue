<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">试剂查询</h2>
    </div>

    <div class="card-shadow">
      <div class="filter-bar">
        <el-input v-model="filter.keyword" placeholder="搜索名称/CAS/批号" clearable style="width: 240px" />
        <el-select v-model="filter.category" placeholder="分类" clearable style="width: 140px">
          <el-option v-for="item in categoryDict" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-switch v-model="filter.lowStock" active-text="库存预警" style="margin-right: 12px" />
        <el-switch v-model="filter.nearExpiry" active-text="近效期" style="margin-right: 12px" />
        <el-switch v-model="filter.isHazardous" active-text="危化品" />
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="name" label="试剂名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="casNo" label="CAS号" width="140" />
        <el-table-column prop="batchNo" label="批号" width="140" />
        <el-table-column label="规格">
          <template #default="{ row }">
            {{ row.specification || '-' }} {{ row.purity || '' }}
          </template>
        </el-table-column>
        <el-table-column label="库存" width="160">
          <template #default="{ row }">
            <span :style="{ color: row.availableQuantity <= row.warningThreshold ? '#f56c6c' : '' }">
              {{ row.availableQuantity }} {{ row.unit }}
            </span>
            <span style="color: #909399; margin-left: 8px">/ {{ row.totalQuantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="140">
          <template #default="{ row }">
            <span :style="{ color: isNearExpiry(row.expiryDate) ? '#f56c6c' : '' }">
              {{ formatDate(row.expiryDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="危化品" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isHazardous" type="danger" size="small">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="manufacturer" label="生产厂家" show-overflow-tooltip />
        <el-table-column label="存储" width="160">
          <template #default="{ row }">
            {{ row.storage?.location || '-' }} {{ row.storage?.cabinet || '' }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 16px"
        background
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { reagentApi, configApi } from '@/api'
import type { Reagent, DictionaryItem } from '@/types'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref<Reagent[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const categoryDict = ref<DictionaryItem[]>([])

const filter = reactive({
  keyword: '',
  category: '',
  lowStock: false,
  nearExpiry: false,
  isHazardous: false,
})

function formatDate(d: string) {
  return d ? dayjs(d).format('YYYY-MM-DD') : '-'
}

function isNearExpiry(d: string) {
  if (!d) return false
  return dayjs(d).diff(dayjs(), 'month') <= 3
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      ...filter,
    }
    const res = await reagentApi.list(params)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function loadDict() {
  try {
    categoryDict.value = await configApi.getDictionaryItems('reagent_category')
  } catch {}
}

onMounted(() => {
  loadDict()
  loadData()
})
</script>
