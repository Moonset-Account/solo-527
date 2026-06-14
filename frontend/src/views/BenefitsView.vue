<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">赞助权益管理</h2>
      <el-button type="primary" @click="dialogVisible = true">
        <el-icon><Plus /></el-icon> 新建权益
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent="loadData">
        <el-form-item label="权益类型">
          <el-select v-model="filters.benefitType" placeholder="全部" clearable style="width: 140px;">
            <el-option v-for="b in dictStore.getDict('benefit_type')" :key="b.key" :label="b.label" :value="b.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px;">
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="in_review" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="交付状态">
          <el-select v-model="filters.deliveryStatus" placeholder="全部" clearable style="width: 120px;">
            <el-option label="待交付" value="pending" />
            <el-option label="交付中" value="delivering" />
            <el-option label="已交付" value="delivered" />
            <el-option label="已延期" value="delayed" />
          </el-select>
        </el-form-item>
        <el-form-item label="修改轮次">
          <el-input-number v-model="filters.revisionRound" :min="0" :max="99" controls-position="right" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="所属合作" width="160">
          <template #default="{ row }">{{ row.partnership?.brandName || '-' }}</template>
        </el-table-column>
        <el-table-column label="权益类型" width="120">
          <template #default="{ row }">
            <el-tag :color="dictStore.getDictColor('benefit_type', row.benefitType)" effect="dark" size="small">
              {{ dictStore.getDictLabel('benefit_type', row.benefitType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="权益名称" min-width="160" />
        <el-table-column label="数量/单价/总价" width="240">
          <template #default="{ row }">
            <span>{{ row.quantity }} × ¥{{ formatMoney(row.unitPrice) }} = <b>¥{{ formatMoney(row.totalAmount) }}</b></span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'in_review' ? 'warning' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="交付" width="100">
          <template #default="{ row }">
            <el-tag :type="row.deliveryStatus === 'delivered' ? 'success' : row.deliveryStatus === 'delivering' ? 'warning' : 'info'" size="small">
              {{ row.deliveryStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="修改轮次" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.revisionRound > 0" type="danger" size="small">第 {{ row.revisionRound }} 轮</el-tag>
            <span v-else class="text-muted">原始版</span>
          </template>
        </el-table-column>
        <el-table-column label="预计交付" width="120">
          <template #default="{ row }">{{ formatDate(row.expectedDeliveryDate) }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="$router.push(`/partnerships/${row.partnershipId}`)">关联</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="perPage"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="新建赞助权益" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="所属合作"><el-input v-model="form.partnershipId" type="number" /></el-form-item>
        <el-form-item label="权益类型">
          <el-select v-model="form.benefitType" style="width: 100%;">
            <el-option v-for="b in dictStore.getDict('benefit_type')" :key="b.key" :label="b.label" :value="b.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="权益名称"><el-input v-model="form.name" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="数量"><el-input-number v-model="form.quantity" :min="1" style="width: 100%;" /></el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单价"><el-input-number v-model="form.unitPrice" :min="0" style="width: 100%;" /></el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总价"><el-input-number v-model="form.totalAmount" :min="0" style="width: 100%;" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="预计交付">
          <el-date-picker v-model="form.expectedDeliveryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { benefitApi } from '@/api/modules'
import { useDictStore } from '@/stores/dict'
import { formatMoney, formatDate, formatDateTime } from '@/utils'

const dictStore = useDictStore()
const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const dialogVisible = ref(false)
const filters = reactive({ benefitType: '', status: '', deliveryStatus: '', revisionRound: null as number | null })
const form = reactive<any>({
  partnershipId: null, benefitType: '', name: '', description: '',
  quantity: 1, unitPrice: 0, totalAmount: 0, expectedDeliveryDate: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, perPage: perPage.value, ...filters }
    if (!params.revisionRound) delete params.revisionRound
    const res: any = await benefitApi.list(params)
    list.value = res.data || res.data || []
    total.value = res.meta?.total || res.total || 0
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, { benefitType: '', status: '', deliveryStatus: '', revisionRound: null })
  page.value = 1
  loadData()
}

onMounted(loadData)
</script>
