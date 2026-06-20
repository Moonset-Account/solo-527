<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span>数据溯源查询</span>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="溯源类型">
          <el-radio-group v-model="traceType">
            <el-radio-button value="PACKAGE_ORDER">会员套餐</el-radio-button>
            <el-radio-button value="TECHNICIAN_WORKSTATION">技师工位</el-radio-button>
            <el-radio-button value="TEST_DRIVE">试驾记录</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择工单/记录">
          <el-select v-model="sourceId" placeholder="请选择" filterable clearable style="width: 300px">
            <el-option v-for="item in optionList" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doTrace" :disabled="!sourceId">
            <el-icon><Search /></el-icon>
            溯源查询
          </el-button>
        </el-form-item>
      </el-form>

      <el-divider v-if="traceData">溯源结果</el-divider>

      <div v-if="traceData && traceType === 'PACKAGE_ORDER'" class="trace-result">
        <el-steps :active="4" finish-status="success" class="trace-steps">
          <el-step title="检测记录" description="车辆检测" />
          <el-step title="套餐配置" description="管理员配置" />
          <el-step title="套餐购买" description="会员购买" />
          <el-step title="维修使用" description="工单使用" />
        </el-steps>

        <el-row :gutter="20" style="margin-top: 30px">
          <el-col :span="12">
            <el-card class="trace-card" v-if="traceData.packageOrder">
              <template #header>
                <div class="card-title">
                  <el-tag type="primary">套餐订单</el-tag>
                  <span class="trace-no">{{ traceData.packageOrder.orderNo }}</span>
                </div>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="套餐名称">{{ traceData.packageOrder.packageName }}</el-descriptions-item>
                <el-descriptions-item label="购买价格">¥{{ traceData.packageOrder.packagePrice?.toFixed(2) }}</el-descriptions-item>
                <el-descriptions-item label="购买日期">{{ formatDate(traceData.packageOrder.purchaseDate) }}</el-descriptions-item>
                <el-descriptions-item label="有效期">{{ formatDate(traceData.packageOrder.validStartDate) }} 至 {{ formatDate(traceData.packageOrder.validEndDate) }}</el-descriptions-item>
                <el-descriptions-item label="使用情况">剩余 {{ traceData.packageOrder.remainingUsage }} / {{ traceData.packageOrder.totalUsage }} 次</el-descriptions-item>
                <el-descriptions-item label="来源检测单">
                  <el-tag v-if="traceData.packageOrder.sourceDetectionRecordId" type="success" effect="plain">
                    可追溯
                  </el-tag>
                  <span v-else>无</span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="trace-card" v-if="traceData.member">
              <template #header>
                <div class="card-title">
                  <el-tag type="success">会员信息</el-tag>
                </div>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="会员编号">{{ traceData.member.memberNo }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ traceData.member.name }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ traceData.member.phone }}</el-descriptions-item>
                <el-descriptions-item label="车辆">{{ traceData.member.carBrand }} {{ traceData.member.carModel }}</el-descriptions-item>
                <el-descriptions-item label="车牌号">{{ traceData.member.plateNumber }}</el-descriptions-item>
                <el-descriptions-item label="车架号">{{ traceData.member.vin }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>

        <el-card class="trace-card" style="margin-top: 20px" v-if="traceData.memberPackage">
          <template #header>
            <div class="card-title">
              <el-tag type="warning">套餐配置</el-tag>
              <span class="trace-no">{{ traceData.memberPackage.packageCode }}</span>
              <span class="trace-source">
                <el-icon><Link /></el-icon>
                来源: {{ traceData.memberPackage.sourceDetectionRecordNo || '手动创建' }}
              </span>
            </div>
          </template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="套餐名称">{{ traceData.memberPackage.packageName }}</el-descriptions-item>
            <el-descriptions-item label="套餐类型">{{ getPackageTypeText(traceData.memberPackage.packageType) }}</el-descriptions-item>
            <el-descriptions-item label="原价">¥{{ traceData.memberPackage.originalPrice?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="套餐价">¥{{ traceData.memberPackage.packagePrice?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="有效期">{{ traceData.memberPackage.validDays }}天</el-descriptions-item>
            <el-descriptions-item label="使用次数">{{ traceData.memberPackage.maxUsage }}次</el-descriptions-item>
            <el-descriptions-item label="套餐说明" :span="2">{{ traceData.memberPackage.description }}</el-descriptions-item>
          </el-descriptions>
          <el-divider>包含权益</el-divider>
          <el-table :data="traceData.benefits || []" border size="small">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="benefitType" label="类型" width="100">
              <template #default="scope">
                <el-tag size="small" :type="getBenefitType(scope.row.benefitType)">{{ getBenefitTypeText(scope.row.benefitType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="benefitName" label="权益名称" />
            <el-table-column prop="benefitValue" label="权益值" width="100">
              <template #default="scope">
                <span v-if="scope.row.benefitType === 'DISCOUNT'">{{ (scope.row.benefitValue * 10).toFixed(1) }}折</span>
                <span v-else-if="scope.row.benefitType === 'COUPON'">¥{{ scope.row.benefitValue }}</span>
                <span v-else>{{ scope.row.benefitValue }}次</span>
              </template>
            </el-table-column>
            <el-table-column prop="benefitDetail" label="详情说明" />
          </el-table>
        </el-card>

        <el-card class="trace-card" style="margin-top: 20px" v-if="traceData.detectionRecord">
          <template #header>
            <div class="card-title">
              <el-tag type="info">来源检测记录</el-tag>
              <span class="trace-no">{{ traceData.detectionRecord.recordNo }}</span>
            </div>
          </template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="检测日期">{{ formatDate(traceData.detectionRecord.checkDate) }}</el-descriptions-item>
            <el-descriptions-item label="总费用">¥{{ traceData.detectionRecord.totalAmount?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="检测结果" :span="2">{{ traceData.detectionRecord.resultSummary }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="trace-card" style="margin-top: 20px" v-if="traceData.repairOrders && traceData.repairOrders.length > 0">
          <template #header>
            <div class="card-title">
              <el-tag type="danger">关联维修工单</el-tag>
              <span>共 {{ traceData.repairOrders.length }} 条</span>
            </div>
          </template>
          <el-table :data="traceData.repairOrders" border size="small">
            <el-table-column prop="orderNo" label="工单号" width="160" />
            <el-table-column prop="orderType" label="类型" width="100">
              <template #default="scope">{{ orderTypeText(scope.row.orderType) }}</template>
            </el-table-column>
            <el-table-column prop="technicianName" label="技师" width="100" />
            <el-table-column prop="workstationName" label="工位" width="120" />
            <el-table-column prop="totalAmount" label="费用" width="100">
              <template #default="scope">¥{{ scope.row.totalAmount?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag size="small" :type="getRepairStatusType(scope.row.status)">{{ getRepairStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180">
              <template #default="scope">{{ formatDateTime(scope.row.createTime) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <div v-if="traceData && traceType === 'TECHNICIAN_WORKSTATION'" class="trace-result">
        <el-card class="trace-card" v-if="traceData.repairOrder">
          <template #header>
            <div class="card-title">
              <el-tag type="primary">维修工单</el-tag>
              <span class="trace-no">{{ traceData.repairOrder.orderNo }}</span>
            </div>
          </template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="工单类型">{{ orderTypeText(traceData.repairOrder.orderType) }}</el-descriptions-item>
            <el-descriptions-item label="问题描述">{{ traceData.repairOrder.problemDescription }}</el-descriptions-item>
            <el-descriptions-item label="计划时间">
              {{ formatDateTime(traceData.repairOrder.planStartTime) }} ~ {{ formatDateTime(traceData.repairOrder.planEndTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="实际时间">
              {{ formatDateTime(traceData.repairOrder.actualStartTime) }} ~ {{ formatDateTime(traceData.repairOrder.actualEndTime) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="工单状态">
              <el-tag :type="getRepairStatusType(traceData.repairOrder.status)">{{ getRepairStatusText(traceData.repairOrder.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="质量状态">
              <el-tag :type="getQualityTagType(traceData.repairOrder.qualityStatus)">{{ getQualityStatusText(traceData.repairOrder.qualityStatus) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card class="trace-card" v-if="traceData.technician">
              <template #header>
                <div class="card-title">
                  <el-tag type="success">负责技师</el-tag>
                  <span class="trace-no">{{ traceData.technician.techNo }}</span>
                </div>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="姓名">{{ traceData.technician.name }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ traceData.technician.phone }}</el-descriptions-item>
                <el-descriptions-item label="技能等级">{{ traceData.technician.skillLevel }}</el-descriptions-item>
                <el-descriptions-item label="专长">{{ traceData.technician.specialty }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="trace-card" v-if="traceData.workstation">
              <template #header>
                <div class="card-title">
                  <el-tag type="warning">分配工位</el-tag>
                  <span class="trace-no">{{ traceData.workstation.stationNo }}</span>
                </div>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="工位名称">{{ traceData.workstation.stationName }}</el-descriptions-item>
                <el-descriptions-item label="工位类型">{{ traceData.workstation.stationType }}</el-descriptions-item>
                <el-descriptions-item label="最大容量">{{ traceData.workstation.maxCapacity }}台</el-descriptions-item>
                <el-descriptions-item label="配备设备">{{ traceData.workstation.equipment }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>

        <el-card class="trace-card" style="margin-top: 20px" v-if="traceData.testDriveRecords && traceData.testDriveRecords.length > 0">
          <template #header>
            <div class="card-title">
              <el-tag type="info">关联试驾记录</el-tag>
              <span>共 {{ traceData.testDriveRecords.length }} 条</span>
            </div>
          </template>
          <el-table :data="traceData.testDriveRecords" border size="small">
            <el-table-column prop="driveNo" label="试驾单号" width="160" />
            <el-table-column prop="technicianName" label="试驾技师" width="100" />
            <el-table-column prop="workstationName" label="来源工位" width="120" />
            <el-table-column prop="driveStartTime" label="开始时间" width="180">
              <template #default="scope">{{ formatDateTime(scope.row.driveStartTime) }}</template>
            </el-table-column>
            <el-table-column prop="driveEndTime" label="结束时间" width="180">
              <template #default="scope">{{ formatDateTime(scope.row.driveEndTime) || '-' }}</template>
            </el-table-column>
            <el-table-column prop="driveDistance" label="里程(km)" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag size="small" :type="getTestDriveStatusType(scope.row.status)">{{ getTestDriveStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button size="small" type="primary" link @click="traceTestDrive(scope.row.id)">溯源</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <div v-if="traceData && traceType === 'TEST_DRIVE'" class="trace-result">
        <el-card class="trace-card" v-if="traceData.testDrive">
          <template #header>
            <div class="card-title">
              <el-tag type="primary">试驾记录</el-tag>
              <span class="trace-no">{{ traceData.testDrive.driveNo }}</span>
            </div>
          </template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="试驾技师">{{ traceData.testDrive.technicianName }}</el-descriptions-item>
            <el-descriptions-item label="来源工位">{{ traceData.testDrive.workstationName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatDateTime(traceData.testDrive.driveStartTime) }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ formatDateTime(traceData.testDrive.driveEndTime) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="试驾路线">{{ traceData.testDrive.driveRoute }}</el-descriptions-item>
            <el-descriptions-item label="试驾里程">{{ traceData.testDrive.driveDistance }} km</el-descriptions-item>
            <el-descriptions-item label="试驾结果" :span="2">{{ traceData.testDrive.driveResult }}</el-descriptions-item>
            <el-descriptions-item label="发现问题" :span="2">{{ traceData.testDrive.problemsFound || '无' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card class="trace-card" v-if="traceData.member">
              <template #header>
                <div class="card-title">
                  <el-tag type="success">会员信息</el-tag>
                </div>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="会员编号">{{ traceData.member.memberNo }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ traceData.member.name }}</el-descriptions-item>
                <el-descriptions-item label="车辆">{{ traceData.member.carBrand }} {{ traceData.member.carModel }}</el-descriptions-item>
                <el-descriptions-item label="车牌号">{{ traceData.member.plateNumber }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="trace-card" v-if="traceData.repairOrder">
              <template #header>
                <div class="card-title">
                  <el-tag type="warning">关联维修单</el-tag>
                  <span class="trace-no">{{ traceData.testDrive.repairOrderNo }}</span>
                </div>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="工单类型">{{ orderTypeText(traceData.repairOrder.orderType) }}</el-descriptions-item>
                <el-descriptions-item label="负责技师">{{ traceData.repairOrder.technicianName }}</el-descriptions-item>
                <el-descriptions-item label="分配工位">{{ traceData.repairOrder.workstationName }}</el-descriptions-item>
                <el-descriptions-item label="工单状态">
                  <el-tag :type="getRepairStatusType(traceData.repairOrder.status)">{{ getRepairStatusText(traceData.repairOrder.status) }}</el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card class="trace-card" v-if="traceData.technician">
              <template #header>
                <div class="card-title">
                  <el-tag type="info">试驾技师详情</el-tag>
                </div>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="技师编号">{{ traceData.technician.techNo }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ traceData.technician.name }}</el-descriptions-item>
                <el-descriptions-item label="技能等级">{{ traceData.technician.skillLevel }}</el-descriptions-item>
                <el-descriptions-item label="专长">{{ traceData.technician.specialty }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="trace-card" v-if="traceData.workstation">
              <template #header>
                <div class="card-title">
                  <el-tag type="info">来源工位详情</el-tag>
                </div>
              </template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="工位编号">{{ traceData.workstation.stationNo }}</el-descriptions-item>
                <el-descriptions-item label="工位名称">{{ traceData.workstation.stationName }}</el-descriptions-item>
                <el-descriptions-item label="工位类型">{{ traceData.workstation.stationType }}</el-descriptions-item>
                <el-descriptions-item label="配备设备">{{ traceData.workstation.equipment }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <el-empty v-if="!traceData && hasSearched" description="暂无溯源数据，请选择记录后查询" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { traceAPI, repairOrderAPI, testDriveRecordAPI } from '@/api'
import {
  formatDateTime,
  formatDate,
  getRepairStatusText,
  getRepairStatusType,
  getTestDriveStatusText,
  getTestDriveStatusType,
  getPackageTypeText,
  orderTypeText,
  handleAPIError
} from '@/utils'

const traceType = ref('PACKAGE_ORDER')
const sourceId = ref(null)
const traceData = ref(null)
const hasSearched = ref(false)
const optionList = ref([])
const loading = ref(false)

const loadOptions = async () => {
  loading.value = true
  try {
    let res
    if (traceType.value === 'PACKAGE_ORDER') {
      res = await repairOrderAPI.getPage({ pageNum: 1, pageSize: 100 })
      optionList.value = res.data.list
        .filter(item => item.packageOrderId)
        .map(item => ({
          id: item.packageOrderId,
          label: `${item.packageOrderNo} - ${item.memberName}`
        }))
    } else if (traceType.value === 'TECHNICIAN_WORKSTATION') {
      res = await repairOrderAPI.getPage({ pageNum: 1, pageSize: 100 })
      optionList.value = res.data.list.map(item => ({
        id: item.id,
        label: `${item.orderNo} - ${item.memberName}`
      }))
    } else if (traceType.value === 'TEST_DRIVE') {
      res = await testDriveRecordAPI.getPage({ pageNum: 1, pageSize: 100 })
      optionList.value = res.data.list.map(item => ({
        id: item.id,
        label: `${item.driveNo} - ${item.memberName || '试驾'}`
      }))
    }
  } catch (error) {
    handleAPIError(error)
  } finally {
    loading.value = false
  }
}

const doTrace = async () => {
  if (!sourceId.value) return
  hasSearched.value = true
  loading.value = true
  try {
    const res = await traceAPI.trace({
      traceType: traceType.value,
      sourceId: sourceId.value
    })
    traceData.value = res.data
  } catch (error) {
    handleAPIError(error)
  } finally {
    loading.value = false
  }
}

const traceTestDrive = (testDriveId) => {
  traceType.value = 'TEST_DRIVE'
  sourceId.value = testDriveId
  loadOptions()
  doTrace()
}

const getBenefitTypeText = (type) => {
  const map = { ITEM: '检测项目', DISCOUNT: '折扣', COUPON: '优惠券', GIFT: '赠送' }
  return map[type] || type
}

const getBenefitType = (type) => {
  const map = { ITEM: 'primary', DISCOUNT: 'success', COUPON: 'danger', GIFT: 'warning' }
  return map[type] || 'info'
}

const getQualityTagType = (status) => {
  const map = { PENDING: 'info', CHECKING: 'warning', PASSED: 'success', FAILED: 'danger' }
  return map[status] || 'info'
}

const getQualityStatusText = (status) => {
  const map = { PENDING: '待质检', CHECKING: '质检中', PASSED: '质检通过', FAILED: '质检不通过' }
  return map[status] || status
}

watch(traceType, () => {
  sourceId.value = null
  traceData.value = null
  hasSearched.value = false
  loadOptions()
})

onMounted(() => {
  loadOptions()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-form {
  margin-bottom: 20px;
}
.trace-steps {
  margin-bottom: 30px;
}
.trace-card {
  height: 100%;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.trace-no {
  font-weight: bold;
  color: #409eff;
}
.trace-source {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
