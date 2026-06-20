<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span>维修工单管理</span>
          <div class="header-actions">
            <el-button type="warning" @click="openBatchDialog" :disabled="selectedIds.length === 0">
              <el-icon><List /></el-icon>
              批量状态变更 ({{ selectedIds.length }})
            </el-button>
            <el-button type="primary" @click="openOrderDialog">
              <el-icon><Plus /></el-icon>
              新增工单
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="工单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入工单号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="会员">
          <el-select v-model="searchForm.memberId" placeholder="选择会员" filterable clearable style="width: 180px">
            <el-option v-for="m in memberList" :key="m.id" :label="`${m.name} - ${m.phone}`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="技师">
          <el-select v-model="searchForm.technicianId" placeholder="选择技师" clearable style="width: 150px">
            <el-option v-for="t in technicianList" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="工位">
          <el-select v-model="searchForm.workstationId" placeholder="选择工位" clearable style="width: 150px">
            <el-option v-for="w in workstationList" :key="w.id" :label="w.stationName" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单类型">
          <el-select v-model="searchForm.orderType" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="opt in orderTypeOptions.filter(o => o.value)" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="opt in repairStatusOptions.filter(o => o.value !== null)" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="质量状态">
          <el-select v-model="searchForm.qualityStatus" placeholder="全部" clearable style="width: 130px">
            <el-option label="待质检" value="PENDING" />
            <el-option label="质检中" value="CHECKING" />
            <el-option label="质检通过" value="PASSED" />
            <el-option label="质检不通过" value="FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadPage">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="orderNo" label="工单号" width="160" />
        <el-table-column prop="memberName" label="车主" width="100" />
        <el-table-column prop="orderType" label="类型" width="100">
          <template #default="scope">{{ orderTypeText(scope.row.orderType) }}</template>
        </el-table-column>
        <el-table-column prop="technicianName" label="技师" width="100" />
        <el-table-column prop="workstationName" label="工位" width="120" />
        <el-table-column prop="planStartTime" label="计划开始" width="160">
          <template #default="scope">{{ formatDateTime(scope.row.planStartTime) }}</template>
        </el-table-column>
        <el-table-column prop="planEndTime" label="计划结束" width="160">
          <template #default="scope">{{ formatDateTime(scope.row.planEndTime) }}</template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="费用(元)" width="100">
          <template #default="scope">¥{{ scope.row.totalAmount?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="工单状态" width="100">
          <template #default="scope">
            <el-tag :type="getRepairStatusType(scope.row.status)">
              {{ getRepairStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="qualityStatus" label="质量状态" width="100">
          <template #default="scope">
            <el-tag :type="getQualityTagType(scope.row.qualityStatus)">
              {{ getQualityStatusText(scope.row.qualityStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">详情</el-button>
            <el-button size="small" @click="viewStatusHistory(scope.row)">状态历史</el-button>
            <el-button size="small" type="primary" v-if="scope.row.status === 3" @click="openDelayDialog(scope.row)">延期处理</el-button>
            <el-button size="small" type="warning" v-if="scope.row.status === 5 && scope.row.qualityStatus === 'PASSED'" @click="openCloseDialog(scope.row)">关闭</el-button>
            <el-button size="small" type="success" v-if="scope.row.status < 5" @click="openStatusDialog(scope.row)">状态流转</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="pageNum"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>

    <el-dialog v-model="orderDialogVisible" :title="orderForm.id ? '编辑工单' : '新增工单'" width="800px" :close-on-click-modal="false">
      <el-form :model="orderForm" :rules="orderRules" ref="orderFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车主" prop="memberId">
              <el-select v-model="orderForm.memberId" filterable style="width: 100%" @change="onMemberChange">
                <el-option v-for="m in memberList" :key="m.id" :label="`${m.name} - ${m.phone}`" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工单类型" prop="orderType">
              <el-select v-model="orderForm.orderType" style="width: 100%">
                <el-option v-for="opt in orderTypeOptions.filter(o => o.value)" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责技师" prop="technicianId">
              <el-select v-model="orderForm.technicianId" style="width: 100%">
                <el-option v-for="t in technicianList" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工位" prop="workstationId">
              <el-select v-model="orderForm.workstationId" style="width: 100%">
                <el-option v-for="w in workstationList" :key="w.id" :label="w.stationName" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划开始" prop="planStartTime">
              <el-date-picker v-model="orderForm.planStartTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划结束" prop="planEndTime">
              <el-date-picker v-model="orderForm.planEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联套餐单">
              <el-select v-model="orderForm.packageOrderId" filterable clearable style="width: 100%">
                <el-option v-for="p in packageOrderList" :key="p.id" :label="p.orderNo" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联检测单">
              <el-select v-model="orderForm.detectionRecordId" filterable clearable style="width: 100%">
                <el-option v-for="d in detectionRecordList" :key="d.id" :label="d.recordNo" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="问题描述" prop="problemDescription">
          <el-input v-model="orderForm.problemDescription" type="textarea" :rows="3" />
        </el-form-item>

        <el-divider content-position="left">
          <span style="font-weight: bold">维修项目明细</span>
          <el-button size="small" type="primary" @click="addRepairItem">
            <el-icon><Plus /></el-icon>
            添加项目
          </el-button>
        </el-divider>

        <el-table :data="repairItemList" border>
          <el-table-column prop="itemType" label="类型" width="100">
            <template #default="scope">
              <el-select v-model="scope.row.itemType" style="width: 100%">
                <el-option label="工时" value="LABOR" />
                <el-option label="配件" value="PART" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="itemName" label="项目名称">
            <template #default="scope">
              <el-input v-model="scope.row.itemName" placeholder="项目名称" />
            </template>
          </el-table-column>
          <el-table-column prop="itemCode" label="编码" width="120">
            <template #default="scope">
              <el-input v-model="scope.row.itemCode" placeholder="项目编码" />
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100">
            <template #default="scope">
              <el-input-number v-model="scope.row.quantity" :min="1" @change="calcSubtotal(scope.row)" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="120">
            <template #default="scope">
              <el-input-number v-model="scope.row.unitPrice" :min="0" :precision="2" @change="calcSubtotal(scope.row)" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="120">
            <template #default="scope">¥{{ scope.row.subtotal?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeRepairItem(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-row style="margin-top: 15px">
          <el-col :span="24" style="text-align: right">
            <span style="font-size: 16px; font-weight: bold">
              总金额: <el-tag type="danger" size="large">¥{{ totalAmount.toFixed(2) }}</el-tag>
            </span>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOrder">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="状态流转" width="500px">
      <el-form :model="statusForm" :rules="statusRules" ref="statusFormRef" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="getRepairStatusType(currentOrder?.status)">{{ getRepairStatusText(currentOrder?.status) }}</el-tag>
        </el-form-item>
        <el-form-item label="目标状态" prop="newStatus">
          <el-select v-model="statusForm.newStatus" style="width: 100%">
            <el-option v-for="opt in getAvailableStatuses()" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="质量状态" prop="newQualityStatus" v-if="statusForm.newStatus === 4">
          <el-select v-model="statusForm.newQualityStatus" style="width: 100%">
            <el-option label="质检中" value="CHECKING" />
            <el-option label="质检通过" value="PASSED" />
            <el-option label="质检不通过" value="FAILED" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作备注" prop="operateRemark">
          <el-input v-model="statusForm.operateRemark" type="textarea" :rows="3" placeholder="请输入操作备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateStatus">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="delayDialogVisible" title="延期处理" width="500px">
      <el-form :model="delayForm" :rules="delayRules" ref="delayFormRef" label-width="100px">
        <el-form-item label="工单号">
          <span>{{ currentOrder?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="延期原因" prop="delayReason">
          <el-input v-model="delayForm.delayReason" type="textarea" :rows="3" placeholder="请输入延期原因" />
        </el-form-item>
        <el-form-item label="处理结果" prop="delayHandleResult">
          <el-input v-model="delayForm.delayHandleResult" type="textarea" :rows="3" placeholder="请输入处理结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="delayDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDelay">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="closeDialogVisible" title="关闭工单" width="500px">
      <el-form :model="closeForm" :rules="closeRules" ref="closeFormRef" label-width="100px">
        <el-form-item label="工单号">
          <span>{{ currentOrder?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="关闭备注" prop="closeRemark">
          <el-input v-model="closeForm.closeRemark" type="textarea" :rows="3" placeholder="请输入关闭备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="closeOrder">确定关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyDialogVisible" title="状态历史记录" width="700px">
      <el-timeline v-if="statusHistoryList.length > 0">
        <el-timeline-item
          v-for="(item, index) in statusHistoryList"
          :key="item.id"
          :timestamp="formatDateTime(item.operateTime)"
          :type="getTimelineType(index)"
        >
          <el-card>
            <template #header>
              <div class="history-header">
                <span>
                  <el-tag :type="getRepairStatusType(item.newStatus)">{{ getRepairStatusText(item.newStatus) }}</el-tag>
                  <span v-if="item.newQualityStatus" style="margin-left: 10px">
                    <el-tag :type="getQualityTagType(item.newQualityStatus)">质量: {{ getQualityStatusText(item.newQualityStatus) }}</el-tag>
                  </span>
                </span>
                <span class="operator">操作人: {{ item.operatorName }}</span>
              </div>
            </template>
            <div class="history-content">
              <div v-if="item.oldStatus !== null">
                原状态: <el-tag size="small" :type="getRepairStatusType(item.oldStatus)">{{ getRepairStatusText(item.oldStatus) }}</el-tag>
                <span v-if="item.oldQualityStatus" style="margin-left: 10px">
                  原质量: <el-tag size="small" :type="getQualityTagType(item.oldQualityStatus)">{{ getQualityStatusText(item.oldQualityStatus) }}</el-tag>
                </span>
              </div>
              <div v-if="item.operateRemark" style="margin-top: 10px">
                备注: {{ item.operateRemark }}
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无状态历史" />
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="工单详情" width="800px">
      <div v-if="currentOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="工单类型">{{ orderTypeText(currentOrder.orderType) }}</el-descriptions-item>
          <el-descriptions-item label="车主">{{ currentOrder.memberName }}</el-descriptions-item>
          <el-descriptions-item label="技师">{{ currentOrder.technicianName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工位">{{ currentOrder.workstationName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="总费用">¥{{ currentOrder.totalAmount?.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="计划开始">{{ formatDateTime(currentOrder.planStartTime) }}</el-descriptions-item>
          <el-descriptions-item label="计划结束">{{ formatDateTime(currentOrder.planEndTime) }}</el-descriptions-item>
          <el-descriptions-item label="实际开始">{{ formatDateTime(currentOrder.actualStartTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际结束">{{ formatDateTime(currentOrder.actualEndTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工单状态">
            <el-tag :type="getRepairStatusType(currentOrder.status)">{{ getRepairStatusText(currentOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="质量状态">
            <el-tag :type="getQualityTagType(currentOrder.qualityStatus)">{{ getQualityStatusText(currentOrder.qualityStatus) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="关联套餐单">{{ currentOrder.packageOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关联检测单">{{ currentOrder.detectionRecordNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ currentOrder.problemDescription || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.delayReason" label="延期原因" :span="2">{{ currentOrder.delayReason }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.delayHandleResult" label="延期处理" :span="2">
            处理人: {{ currentOrder.delayHandlerName || '-' }}，结果: {{ currentOrder.delayHandleResult }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.closeRemark" label="关闭备注" :span="2">
            处理人: {{ currentOrder.closeHandlerName || '-' }}，备注: {{ currentOrder.closeRemark }}
          </el-descriptions-item>
        </el-descriptions>
        <el-divider>维修项目明细</el-divider>
        <el-table :data="currentOrder.repairItems || []" border>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="itemType" label="类型" width="80">
            <template #default="scope">{{ getItemTypeText(scope.row.itemType) }}</template>
          </el-table-column>
          <el-table-column prop="itemName" label="项目名称" />
          <el-table-column prop="itemCode" label="编码" width="120" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="unitPrice" label="单价" width="100">
            <template #default="scope">¥{{ scope.row.unitPrice?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="100">
            <template #default="scope">¥{{ scope.row.subtotal?.toFixed(2) }}</template>
          </el-table-column>
        </el-table>
        <el-divider v-if="currentOrder.statusHistories && currentOrder.statusHistories.length > 0">状态历史</el-divider>
        <el-table v-if="currentOrder.statusHistories && currentOrder.statusHistories.length > 0" :data="currentOrder.statusHistories" border size="small">
          <el-table-column prop="operateTime" label="操作时间" width="160">
            <template #default="scope">{{ formatDateTime(scope.row.operateTime) }}</template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" width="100" />
          <el-table-column prop="newStatus" label="新状态" width="100">
            <template #default="scope">
              <el-tag size="small" :type="getRepairStatusType(scope.row.newStatus)">{{ getRepairStatusText(scope.row.newStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operateRemark" label="备注" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量状态变更确认" width="600px">
      <el-alert
        title="请确认以下批量操作"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      />
      <el-descriptions :column="1" border>
        <el-descriptions-item label="操作类型">批量状态变更</el-descriptions-item>
        <el-descriptions-item label="目标工单数量">{{ selectedIds.length }} 条</el-descriptions-item>
        <el-descriptions-item label="工单ID列表">{{ selectedIds.join(', ') }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="batchForm" :rules="batchRules" ref="batchFormRef" label-width="100px" style="margin-top: 20px">
        <el-form-item label="目标状态" prop="newStatus">
          <el-select v-model="batchForm.newStatus" style="width: 100%">
            <el-option label="待开工" :value="2" />
            <el-option label="施工中" :value="3" />
            <el-option label="待质检" :value="4" />
            <el-option label="已完成" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作备注" prop="remark">
          <el-input v-model="batchForm.remark" type="textarea" :rows="2" placeholder="请输入操作备注" />
        </el-form-item>
      </el-form>
      <el-alert
        title="注意：系统将先创建批量操作记录，确认后异步执行。执行失败的记录将进入异常清单。"
        type="info"
        :closable="false"
        style="margin-top: 20px"
      />
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchOperation">确认执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { repairOrderAPI, batchOperationAPI, commonAPI, detectionRecordAPI, memberPackageOrderAPI } from '@/api'
import {
  formatDateTime,
  getRepairStatusText,
  getRepairStatusType,
  repairStatusOptions,
  orderTypeOptions,
  orderTypeText,
  handleAPIError
} from '@/utils'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchForm = reactive({
  orderNo: '',
  memberId: null,
  technicianId: null,
  workstationId: null,
  orderType: null,
  status: null,
  qualityStatus: null,
  dateRange: []
})

const memberList = ref([])
const technicianList = ref([])
const workstationList = ref([])
const packageOrderList = ref([])
const detectionRecordList = ref([])

const selectedIds = ref([])
const currentOrder = ref(null)
const statusHistoryList = ref([])

const orderDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const delayDialogVisible = ref(false)
const closeDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const batchDialogVisible = ref(false)

const orderFormRef = ref(null)
const statusFormRef = ref(null)
const delayFormRef = ref(null)
const closeFormRef = ref(null)
const batchFormRef = ref(null)

const orderForm = reactive({
  id: null,
  memberId: null,
  orderType: '',
  technicianId: null,
  workstationId: null,
  planStartTime: '',
  planEndTime: '',
  packageOrderId: null,
  detectionRecordId: null,
  problemDescription: '',
  createBy: 3
})

const orderRules = {
  memberId: [{ required: true, message: '请选择车主', trigger: 'change' }],
  orderType: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  technicianId: [{ required: true, message: '请选择技师', trigger: 'change' }],
  workstationId: [{ required: true, message: '请选择工位', trigger: 'change' }],
  planStartTime: [{ required: true, message: '请选择计划开始时间', trigger: 'change' }],
  planEndTime: [{ required: true, message: '请选择计划结束时间', trigger: 'change' }],
  problemDescription: [{ required: true, message: '请输入问题描述', trigger: 'blur' }]
}

const repairItemList = ref([])

const statusForm = reactive({
  repairOrderId: null,
  newStatus: null,
  newQualityStatus: null,
  operatorId: 3,
  operateRemark: ''
})

const statusRules = {
  newStatus: [{ required: true, message: '请选择目标状态', trigger: 'change' }],
  operateRemark: [{ required: true, message: '请输入操作备注', trigger: 'blur' }]
}

const delayForm = reactive({
  repairOrderId: null,
  delayReason: '',
  delayHandleResult: '',
  handlerId: 3
})

const delayRules = {
  delayReason: [{ required: true, message: '请输入延期原因', trigger: 'blur' }],
  delayHandleResult: [{ required: true, message: '请输入处理结果', trigger: 'blur' }]
}

const closeForm = reactive({
  repairOrderId: null,
  closeRemark: '',
  handlerId: 3
})

const closeRules = {
  closeRemark: [{ required: true, message: '请输入关闭备注', trigger: 'blur' }]
}

const batchForm = reactive({
  newStatus: null,
  remark: '',
  operatorId: 3
})

const batchRules = {
  newStatus: [{ required: true, message: '请选择目标状态', trigger: 'change' }],
  remark: [{ required: true, message: '请输入操作备注', trigger: 'blur' }]
}

const totalAmount = computed(() => {
  return repairItemList.value.reduce((sum, item) => sum + (item.subtotal || 0), 0)
})

const loadPage = async () => {
  loading.value = true
  try {
    const params = {
      orderNo: searchForm.orderNo || undefined,
      memberId: searchForm.memberId,
      technicianId: searchForm.technicianId,
      workstationId: searchForm.workstationId,
      orderType: searchForm.orderType || undefined,
      status: searchForm.status,
      qualityStatus: searchForm.qualityStatus || undefined,
      startTime: searchForm.dateRange?.[0],
      endTime: searchForm.dateRange?.[1],
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await repairOrderAPI.getPage(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    handleAPIError(error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.orderNo = ''
  searchForm.memberId = null
  searchForm.technicianId = null
  searchForm.workstationId = null
  searchForm.orderType = null
  searchForm.status = null
  searchForm.qualityStatus = null
  searchForm.dateRange = []
  pageNum.value = 1
  loadPage()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadPage()
}

const handlePageChange = (page) => {
  pageNum.value = page
  loadPage()
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

const openOrderDialog = async (row = null) => {
  repairItemList.value = []
  if (row) {
    Object.assign(orderForm, row)
    if (row.repairItems) {
      repairItemList.value = JSON.parse(JSON.stringify(row.repairItems))
    }
    if (row.memberId) {
      await onMemberChange()
    }
  } else {
    Object.assign(orderForm, {
      id: null,
      memberId: null,
      orderType: '',
      technicianId: null,
      workstationId: null,
      planStartTime: '',
      planEndTime: '',
      packageOrderId: null,
      detectionRecordId: null,
      problemDescription: '',
      createBy: 3
    })
    packageOrderList.value = []
    detectionRecordList.value = []
  }
  orderDialogVisible.value = true
}

const addRepairItem = () => {
  repairItemList.value.push({
    itemType: 'LABOR',
    itemName: '',
    itemCode: '',
    quantity: 1,
    unitPrice: 0,
    subtotal: 0
  })
}

const removeRepairItem = (index) => {
  repairItemList.value.splice(index, 1)
}

const calcSubtotal = (row) => {
  row.subtotal = (row.quantity || 0) * (row.unitPrice || 0)
}

const saveOrder = async () => {
  if (!orderFormRef.value) return
  await orderFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const data = {
          order: orderForm,
          items: repairItemList.value
        }
        if (orderForm.id) {
          await repairOrderAPI.update(data)
          ElMessage.success('更新成功')
        } else {
          await repairOrderAPI.create(data)
          ElMessage.success('创建成功')
        }
        orderDialogVisible.value = false
        loadPage()
      } catch (error) {
        handleAPIError(error)
      }
    }
  })
}

const openStatusDialog = (row) => {
  currentOrder.value = row
  statusForm.repairOrderId = row.id
  statusForm.newStatus = null
  statusForm.newQualityStatus = null
  statusForm.operateRemark = ''
  statusDialogVisible.value = true
}

const getAvailableStatuses = () => {
  if (!currentOrder.value) return []
  const current = currentOrder.value.status
  const available = []
  if (current === 1) available.push({ label: '待开工', value: 2 })
  if (current === 2) available.push({ label: '施工中', value: 3 })
  if (current === 3) available.push({ label: '待质检', value: 4 })
  if (current === 4) {
    available.push({ label: '已完成', value: 5 })
    available.push({ label: '施工中(返工)', value: 3 })
  }
  return available
}

const updateStatus = async () => {
  if (!statusFormRef.value) return
  await statusFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await repairOrderAPI.updateStatus(statusForm)
        ElMessage.success('状态更新成功')
        statusDialogVisible.value = false
        loadPage()
      } catch (error) {
        handleAPIError(error)
      }
    }
  })
}

const openDelayDialog = (row) => {
  currentOrder.value = row
  delayForm.repairOrderId = row.id
  delayForm.delayReason = row.delayReason || ''
  delayForm.delayHandleResult = ''
  delayDialogVisible.value = true
}

const handleDelay = async () => {
  if (!delayFormRef.value) return
  await delayFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await repairOrderAPI.handleDelay(delayForm)
        ElMessage.success('延期处理成功')
        delayDialogVisible.value = false
        loadPage()
      } catch (error) {
        handleAPIError(error)
      }
    }
  })
}

const openCloseDialog = (row) => {
  currentOrder.value = row
  closeForm.repairOrderId = row.id
  closeForm.closeRemark = ''
  closeDialogVisible.value = true
}

const closeOrder = async () => {
  if (!closeFormRef.value) return
  await closeFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await repairOrderAPI.closeOrder(closeForm)
        ElMessage.success('工单已关闭，数据将进入经营效率报表')
        closeDialogVisible.value = false
        loadPage()
      } catch (error) {
        handleAPIError(error)
      }
    }
  })
}

const viewStatusHistory = async (row) => {
  try {
    const res = await repairOrderAPI.getStatusHistory(row.id)
    statusHistoryList.value = res.data
    historyDialogVisible.value = true
  } catch (error) {
    handleAPIError(error)
  }
}

const viewDetail = async (row) => {
  try {
    const res = await repairOrderAPI.getById(row.id)
    currentOrder.value = res.data
    detailDialogVisible.value = true
  } catch (error) {
    handleAPIError(error)
  }
}

const openBatchDialog = () => {
  batchForm.newStatus = null
  batchForm.remark = ''
  batchDialogVisible.value = true
}

const confirmBatchOperation = async () => {
  if (!batchFormRef.value) return
  await batchFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const operationDetail = JSON.stringify({
          newStatus: batchForm.newStatus,
          remark: batchForm.remark
        })
        const batchData = {
          operationType: 'STATUS_CHANGE',
          operationName: '批量状态变更',
          targetType: 'REPAIR_ORDER',
          targetIds: selectedIds.value,
          operationDetail,
          operatorId: batchForm.operatorId
        }
        const res = await batchOperationAPI.create(batchData)
        await batchOperationAPI.confirm({
          batchOperationId: res.data.id,
          confirmed: true
        })
        ElMessage.success('批量操作已提交，正在后台执行，请在异常清单中查看执行结果')
        batchDialogVisible.value = false
        selectedIds.value = []
        loadPage()
      } catch (error) {
        handleAPIError(error)
      }
    }
  })
}

const getQualityTagType = (status) => {
  const map = { PENDING: 'info', CHECKING: 'warning', PASSED: 'success', FAILED: 'danger' }
  return map[status] || 'info'
}

const getQualityStatusText = (status) => {
  const map = { PENDING: '待质检', CHECKING: '质检中', PASSED: '质检通过', FAILED: '质检不通过' }
  return map[status] || status
}

const getTimelineType = (index) => {
  const types = ['primary', 'success', 'warning', 'danger', 'info']
  return types[index % types.length]
}

const getItemTypeText = (type) => {
  const map = { LABOR: '工时', PART: '配件', OTHER: '其他' }
  return map[type] || type
}

const onMemberChange = async () => {
  if (!orderForm.memberId) {
    packageOrderList.value = []
    detectionRecordList.value = []
    return
  }
  try {
    const [pkgRes, detRes] = await Promise.all([
      memberPackageOrderAPI.getPage({ memberId: orderForm.memberId, status: 1, pageNum: 1, pageSize: 50 }),
      detectionRecordAPI.getPage({ memberId: orderForm.memberId, pageNum: 1, pageSize: 50 })
    ])
    packageOrderList.value = pkgRes.data.list || []
    detectionRecordList.value = detRes.data.list || []
  } catch (error) {
    handleAPIError(error)
  }
}

const loadBaseData = async () => {
  try {
    const [members, techs, stations] = await Promise.all([
      commonAPI.getAllMembers(),
      commonAPI.getEnabledTechnicians(),
      commonAPI.getEnabledWorkstations()
    ])
    memberList.value = members.data
    technicianList.value = techs.data
    workstationList.value = stations.data
  } catch (error) {
    handleAPIError(error)
  }
}

onMounted(() => {
  loadPage()
  loadBaseData()
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
.header-actions {
  display: flex;
  gap: 10px;
}
.search-form {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.operator {
  color: #909399;
  font-size: 12px;
}
</style>
