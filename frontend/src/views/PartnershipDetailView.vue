<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <div class="flex-center" style="gap: 12px;">
        <el-button link type="primary" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h2 class="page-title">合作详情 - {{ detail?.code }}</h2>
      </div>
      <el-button type="primary" @click="openStageDialog">
        <el-icon><Plus /></el-icon> 添加阶段
      </el-button>
    </div>

    <div class="detail-card mb-24">
      <div class="detail-card-header">基础信息</div>
      <div class="detail-card-body">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="品牌名称">{{ detail?.brandName }}</el-descriptions-item>
          <el-descriptions-item label="所属行业">{{ detail?.brandIndustry || '-' }}</el-descriptions-item>
          <el-descriptions-item label="合同金额">¥{{ formatMoney(detail?.contractAmount) }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detail?.contactName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail?.contactPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系邮箱">{{ detail?.contactEmail || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前阶段">
            <el-tag :color="dictStore.getDictColor('partnership_stage', detail?.currentStage)" effect="dark">
              {{ dictStore.getDictLabel('partnership_stage', detail?.currentStage) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detail?.status === 'active' ? 'success' : 'info'" size="small">
              {{ dictStore.getDictLabel('partnership_status', detail?.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ detail?.responsibleUser?.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预计签约">{{ formatDate(detail?.expectedSignDate) }}</el-descriptions-item>
          <el-descriptions-item label="实际签约">{{ formatDate(detail?.actualSignDate) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(detail?.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ detail?.description || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <div class="detail-card mb-24">
      <div class="detail-card-header">合作阶段跟进</div>
      <div class="detail-card-body">
        <el-steps :active="activeStageIndex" direction="vertical" finish-status="success">
          <el-step v-for="(stage, idx) in stages" :key="stage.id">
            <template #title>
              <span class="stage-title">
                {{ dictStore.getDictLabel('partnership_stage', stage.stage) }}
                <el-tag v-if="stage.status === 'active'" type="primary" size="small" class="ml-8">进行中</el-tag>
                <el-tag v-else-if="stage.status === 'completed'" type="success" size="small" class="ml-8">已完成</el-tag>
                <el-tag v-else type="info" size="small" class="ml-8">{{ stage.status }}</el-tag>
              </span>
            </template>
            <template #description>
              <div class="stage-desc">
                <div>{{ stage.notes || '暂无备注' }}</div>
                <div class="text-muted text-sm mt-4">
                  {{ stage.creator?.username || '系统' }} · {{ formatDateTime(stage.createdAt) }}
                  <span v-if="stage.completedAt" class="ml-8">完成时间：{{ formatDateTime(stage.completedAt) }}</span>
                </div>
              </div>
            </template>
          </el-step>
        </el-steps>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="赞助权益" name="benefits">
        <div class="table-card">
          <div class="flex-between mb-16">
            <h3 class="font-medium">权益列表（共 {{ detail?.benefits?.length || 0 }} 项）</h3>
            <el-button type="primary" size="small" @click="openBenefitDialog">
              <el-icon><Plus /></el-icon> 添加权益
            </el-button>
          </div>
          <el-table :data="detail?.benefits || []" stripe>
            <el-table-column label="权益类型" width="130">
              <template #default="{ row }">
                <el-tag :color="dictStore.getDictColor('benefit_type', row.benefitType)" effect="dark" size="small">
                  {{ dictStore.getDictLabel('benefit_type', row.benefitType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="权益名称" min-width="160" />
            <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
            <el-table-column prop="quantity" label="数量" width="70" />
            <el-table-column label="单价" width="110">
              <template #default="{ row }">¥{{ formatMoney(row.unitPrice) }}</template>
            </el-table-column>
            <el-table-column label="总价" width="120">
              <template #default="{ row }"><b>¥{{ formatMoney(row.totalAmount) }}</b></template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="交付状态" width="110">
              <template #default="{ row }">
                <el-tag :type="row.deliveryStatus === 'delivered' ? 'success' : row.deliveryStatus === 'delivering' ? 'warning' : 'info'" size="small">
                  {{ row.deliveryStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="修改轮次" width="90">
              <template #default="{ row }">第 {{ row.revisionRound }} 轮</template>
            </el-table-column>
            <el-table-column label="预计交付" width="120">
              <template #default="{ row }">{{ formatDate(row.expectedDeliveryDate) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="primary" size="small">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="订单记录" name="orders">
        <div class="table-card">
          <el-table :data="detail?.orders || []" stripe>
            <el-table-column prop="orderNo" label="订单号" width="160" />
            <el-table-column label="金额" width="120">
              <template #default="{ row }"><b>¥{{ formatMoney(row.amount) }}</b></template>
            </el-table-column>
            <el-table-column label="订单状态" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ dictStore.getDictLabel('order_status', row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="支付状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.paymentStatus === 'paid' ? 'success' : 'warning'" size="small">
                  {{ dictStore.getDictLabel('payment_status', row.paymentStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="$router.push(`/orders/${row.id}`)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="stageDialogVisible" title="添加合作阶段" width="500px">
      <el-form :model="stageForm" label-width="80px">
        <el-form-item label="阶段">
          <el-select v-model="stageForm.stage" style="width: 100%;">
            <el-option v-for="s in dictStore.getDict('partnership_stage')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stageForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addStage">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { partnershipApi, benefitApi } from '@/api/modules'
import { useDictStore } from '@/stores/dict'
import { formatMoney, formatDate, formatDateTime } from '@/utils'

const route = useRoute()
const dictStore = useDictStore()

const loading = ref(false)
const detail = ref<any>(null)
const stages = ref<any[]>([])
const activeTab = ref('benefits')
const activeStageIndex = computed(() => {
  const idx = stages.value.findIndex(s => s.status === 'active')
  return idx >= 0 ? idx + 1 : stages.value.length
})

const stageDialogVisible = ref(false)
const stageForm = reactive({ stage: '', notes: '' })

const openBenefitDialog = () => {
  ElMessage.info('可前往赞助权益页面详细操作')
}

const loadDetail = async () => {
  loading.value = true
  try {
    const res: any = await partnershipApi.detail(Number(route.params.id))
    detail.value = res.data || res
    stages.value = detail.value?.stages || []
  } finally {
    loading.value = false
  }
}

const openStageDialog = () => {
  stageForm.stage = ''
  stageForm.notes = ''
  stageDialogVisible.value = true
}

const addStage = async () => {
  if (!stageForm.stage) {
    ElMessage.warning('请选择阶段')
    return
  }
  try {
    await partnershipApi.addStage(Number(route.params.id), stageForm)
    ElMessage.success('添加成功')
    stageDialogVisible.value = false
    loadDetail()
  } catch {}
}

onMounted(loadDetail)
</script>

<style lang="scss" scoped>
.stage-title {
  font-size: 15px;
  font-weight: 500;
}
.stage-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
.mt-4 { margin-top: 4px; }
.ml-8 { margin-left: 8px; }
.mb-16 { margin-bottom: 16px; }
.font-medium { font-weight: 500; }
</style>
