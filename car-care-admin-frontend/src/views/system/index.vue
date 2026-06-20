<template>
  <div class="page-container">
    <el-card class="page-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="批量操作记录" name="batch">
          <template #label>
            <el-icon><List /></el-icon>
            批量操作记录
          </template>

          <div class="tab-toolbar">
            <el-form :inline="true" class="search-form">
              <el-form-item label="批次号">
                <el-input v-model="batchSearch.batchNo" placeholder="请输入批次号" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item label="操作类型">
                <el-select v-model="batchSearch.operationType" placeholder="全部" clearable style="width: 150px">
                  <el-option label="状态变更" value="STATUS_CHANGE" />
                  <el-option label="价格变更" value="PRICE_CHANGE" />
                  <el-option label="分配" value="ASSIGN" />
                  <el-option label="导出" value="EXPORT" />
                </el-select>
              </el-form-item>
              <el-form-item label="目标类型">
                <el-select v-model="batchSearch.targetType" placeholder="全部" clearable style="width: 150px">
                  <el-option label="维修单" value="REPAIR_ORDER" />
                  <el-option label="套餐" value="PACKAGE" />
                  <el-option label="会员" value="MEMBER" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="batchSearch.status" placeholder="全部" clearable style="width: 120px">
                  <el-option label="待确认" :value="0" />
                  <el-option label="执行中" :value="1" />
                  <el-option label="已完成" :value="2" />
                  <el-option label="已取消" :value="3" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadBatchPage">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="resetBatchSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="batchList" border stripe v-loading="batchLoading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="batchNo" label="批次号" width="180" />
            <el-table-column prop="operationName" label="操作名称" />
            <el-table-column prop="operationType" label="操作类型" width="120">
              <template #default="scope">{{ getOperationTypeText(scope.row.operationType) }}</template>
            </el-table-column>
            <el-table-column prop="targetType" label="目标类型" width="100">
              <template #default="scope">{{ getTargetTypeText(scope.row.targetType) }}</template>
            </el-table-column>
            <el-table-column prop="totalCount" label="总数" width="80" align="center" />
            <el-table-column prop="successCount" label="成功" width="80" align="center">
              <template #default="scope">
                <span style="color: #67c23a">{{ scope.row.successCount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="failCount" label="失败" width="80" align="center">
              <template #default="scope">
                <span v-if="scope.row.failCount > 0" style="color: #f56c6c; font-weight: bold">{{ scope.row.failCount }}</span>
                <span v-else>0</span>
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="100" />
            <el-table-column prop="confirmTime" label="确认时间" width="180">
              <template #default="scope">{{ formatDateTime(scope.row.confirmTime) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getBatchStatusType(scope.row.status)">{{ getBatchStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="viewBatchDetail(scope.row)">详情</el-button>
                <el-button size="small" type="primary" v-if="scope.row.status === 0" @click="confirmBatch(scope.row)">确认</el-button>
                <el-button size="small" type="warning" v-if="scope.row.failCount > 0" @click="viewExceptions(scope.row)">查看异常</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            class="pagination"
            layout="total, sizes, prev, pager, next, jumper"
            :total="batchTotal"
            :page-size="batchPageSize"
            :current-page="batchPageNum"
            @size-change="handleBatchSizeChange"
            @current-change="handleBatchPageChange"
          />
        </el-tab-pane>

        <el-tab-pane label="异常清单" name="exception">
          <template #label>
            <el-icon><Warning /></el-icon>
            异常清单
          </template>

          <div class="tab-toolbar">
            <el-form :inline="true" class="search-form">
              <el-form-item label="异常编号">
                <el-input v-model="exceptionSearch.exceptionNo" placeholder="请输入异常编号" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item label="异常类型">
                <el-select v-model="exceptionSearch.exceptionType" placeholder="全部" clearable style="width: 150px">
                  <el-option label="批量操作失败" value="BATCH_FAIL" />
                  <el-option label="状态变更失败" value="STATUS_CHANGE_FAIL" />
                  <el-option label="支付失败" value="PAYMENT_FAIL" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="exceptionSearch.status" placeholder="全部" clearable style="width: 120px">
                  <el-option label="待处理" :value="0" />
                  <el-option label="处理中" :value="1" />
                  <el-option label="已处理" :value="2" />
                  <el-option label="已忽略" :value="3" />
                </el-select>
              </el-form-item>
              <el-form-item label="创建时间">
                <el-date-picker
                  v-model="exceptionSearch.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadExceptionPage">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="resetExceptionSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="exceptionList" border stripe v-loading="exceptionLoading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="exceptionNo" label="异常编号" width="180" />
            <el-table-column prop="exceptionType" label="异常类型" width="130">
              <template #default="scope">
                <el-tag type="danger" size="small">{{ getExceptionTypeText(scope.row.exceptionType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sourceType" label="来源类型" width="100">
              <template #default="scope">{{ getTargetTypeText(scope.row.sourceType) }}</template>
            </el-table-column>
            <el-table-column prop="sourceId" label="来源ID" width="80" align="center" />
            <el-table-column prop="batchOperationId" label="关联批次" width="120" />
            <el-table-column prop="errorCode" label="错误码" width="100" />
            <el-table-column prop="errorMessage" label="错误信息" show-overflow-tooltip />
            <el-table-column prop="handlerName" label="处理人" width="100" />
            <el-table-column prop="handleResult" label="处理结果" show-overflow-tooltip />
            <el-table-column prop="handleTime" label="处理时间" width="180">
              <template #default="scope">{{ formatDateTime(scope.row.handleTime) }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180">
              <template #default="scope">{{ formatDateTime(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getExceptionStatusType(scope.row.status)">{{ getExceptionStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="viewExceptionDetail(scope.row)">详情</el-button>
                <el-button size="small" type="primary" v-if="scope.row.status === 0" @click="openHandleDialog(scope.row)">处理</el-button>
                <el-button size="small" type="success" v-if="scope.row.status === 0" @click="retryException(scope.row)">重试</el-button>
                <el-button size="small" type="info" v-if="scope.row.status === 0" @click="ignoreException(scope.row)">忽略</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            class="pagination"
            layout="total, sizes, prev, pager, next, jumper"
            :total="exceptionTotal"
            :page-size="exceptionPageSize"
            :current-page="exceptionPageNum"
            @size-change="handleExceptionSizeChange"
            @current-change="handleExceptionPageChange"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="batchConfirmVisible" title="确认批量操作" width="500px">
      <div v-if="currentBatch">
        <el-alert
          title="请仔细确认以下批量操作信息"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-descriptions :column="1" border>
          <el-descriptions-item label="批次号">{{ currentBatch.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="操作名称">{{ currentBatch.operationName }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ getOperationTypeText(currentBatch.operationType) }}</el-descriptions-item>
          <el-descriptions-item label="目标类型">{{ getTargetTypeText(currentBatch.targetType) }}</el-descriptions-item>
          <el-descriptions-item label="目标数量">{{ currentBatch.totalCount }} 条</el-descriptions-item>
          <el-descriptions-item label="目标ID列表">{{ currentBatch.targetIds }}</el-descriptions-item>
          <el-descriptions-item label="操作详情">{{ currentBatch.operationDetail || '无' }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentBatch.operatorName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentBatch.createTime) }}</el-descriptions-item>
        </el-descriptions>
        <el-alert
          title="确认后系统将异步执行批量操作，执行失败的记录将自动进入异常清单，请谨慎操作！"
          type="error"
          :closable="false"
          show-icon
          style="margin-top: 20px"
        />
      </div>
      <template #footer>
        <el-button @click="cancelBatch">取消</el-button>
        <el-button type="danger" @click="confirmBatchExecute">确认执行</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDetailVisible" title="批量操作详情" width="800px">
      <div v-if="currentBatch">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="批次号">{{ currentBatch.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getBatchStatusType(currentBatch.status)">{{ getBatchStatusText(currentBatch.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作名称">{{ currentBatch.operationName }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ getOperationTypeText(currentBatch.operationType) }}</el-descriptions-item>
          <el-descriptions-item label="目标类型">{{ getTargetTypeText(currentBatch.targetType) }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentBatch.operatorName }}</el-descriptions-item>
          <el-descriptions-item label="总数">{{ currentBatch.totalCount }}</el-descriptions-item>
          <el-descriptions-item label="成功/失败">
            <span style="color: #67c23a">{{ currentBatch.successCount }}</span>
            <span style="margin: 0 10px">/</span>
            <span style="color: #f56c6c">{{ currentBatch.failCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentBatch.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="确认时间">{{ formatDateTime(currentBatch.confirmTime) }}</el-descriptions-item>
          <el-descriptions-item label="目标ID列表" :span="2">{{ currentBatch.targetIds }}</el-descriptions-item>
          <el-descriptions-item label="操作详情" :span="2">{{ currentBatch.operationDetail || '无' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider v-if="currentBatch.failCount > 0">失败记录 (点击跳转到异常清单)</el-divider>
        <el-button
          v-if="currentBatch.failCount > 0"
          type="warning"
          @click="viewExceptions(currentBatch)"
        >
          查看 {{ currentBatch.failCount }} 条失败记录
        </el-button>
      </div>
      <template #footer>
        <el-button @click="batchDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exceptionDetailVisible" title="异常详情" width="700px">
      <div v-if="currentException">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="异常编号">{{ currentException.exceptionNo }}</el-descriptions-item>
          <el-descriptions-item label="异常类型">
            <el-tag type="danger">{{ getExceptionTypeText(currentException.exceptionType) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源类型">{{ getTargetTypeText(currentException.sourceType) }}</el-descriptions-item>
          <el-descriptions-item label="来源ID">{{ currentException.sourceId }}</el-descriptions-item>
          <el-descriptions-item label="关联批次">{{ currentException.batchOperationId || '无' }}</el-descriptions-item>
          <el-descriptions-item label="错误码">{{ currentException.errorCode || '无' }}</el-descriptions-item>
          <el-descriptions-item label="错误信息" :span="2">{{ currentException.errorMessage }}</el-descriptions-item>
          <el-descriptions-item label="错误详情" :span="2">{{ currentException.errorDetail || '无' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getExceptionStatusType(currentException.status)">{{ getExceptionStatusText(currentException.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentException.handlerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理结果" :span="2">{{ currentException.handleResult || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理时间" :span="2">{{ formatDateTime(currentException.handleTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(currentException.createTime) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="exceptionDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="handleDialogVisible" title="处理异常" width="500px">
      <el-form :model="handleForm" :rules="handleRules" ref="handleFormRef" label-width="100px">
        <el-form-item label="异常编号">
          <span>{{ currentException?.exceptionNo }}</span>
        </el-form-item>
        <el-form-item label="错误信息">
          <span>{{ currentException?.errorMessage }}</span>
        </el-form-item>
        <el-form-item label="处理结果" prop="handleResult">
          <el-input v-model="handleForm.handleResult" type="textarea" :rows="4" placeholder="请输入处理结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { batchOperationAPI, exceptionRecordAPI } from '@/api'
import {
  formatDateTime,
  getBatchStatusText,
  getBatchStatusType,
  getExceptionStatusText,
  getExceptionStatusType,
  handleAPIError
} from '@/utils'

const activeTab = ref('batch')

const batchLoading = ref(false)
const batchList = ref([])
const batchTotal = ref(0)
const batchPageNum = ref(1)
const batchPageSize = ref(10)
const batchSearch = reactive({
  batchNo: '',
  operationType: null,
  targetType: null,
  status: null
})

const exceptionLoading = ref(false)
const exceptionList = ref([])
const exceptionTotal = ref(0)
const exceptionPageNum = ref(1)
const exceptionPageSize = ref(10)
const exceptionSearch = reactive({
  exceptionNo: '',
  exceptionType: null,
  status: null,
  dateRange: []
})

const currentBatch = ref(null)
const currentException = ref(null)
const batchConfirmVisible = ref(false)
const batchDetailVisible = ref(false)
const exceptionDetailVisible = ref(false)
const handleDialogVisible = ref(false)
const handleFormRef = ref(null)

const handleForm = reactive({
  exceptionId: null,
  handleResult: '',
  handlerId: 2
})

const handleRules = {
  handleResult: [{ required: true, message: '请输入处理结果', trigger: 'blur' }]
}

const loadBatchPage = async () => {
  batchLoading.value = true
  try {
    const params = {
      batchNo: batchSearch.batchNo || undefined,
      operationType: batchSearch.operationType || undefined,
      targetType: batchSearch.targetType || undefined,
      status: batchSearch.status,
      pageNum: batchPageNum.value,
      pageSize: batchPageSize.value
    }
    const res = await batchOperationAPI.getPage(params)
    batchList.value = res.data.list
    batchTotal.value = res.data.total
  } catch (error) {
    handleAPIError(error)
  } finally {
    batchLoading.value = false
  }
}

const resetBatchSearch = () => {
  batchSearch.batchNo = ''
  batchSearch.operationType = null
  batchSearch.targetType = null
  batchSearch.status = null
  batchPageNum.value = 1
  loadBatchPage()
}

const handleBatchSizeChange = (size) => {
  batchPageSize.value = size
  loadBatchPage()
}

const handleBatchPageChange = (page) => {
  batchPageNum.value = page
  loadBatchPage()
}

const loadExceptionPage = async () => {
  exceptionLoading.value = true
  try {
    const params = {
      exceptionNo: exceptionSearch.exceptionNo || undefined,
      exceptionType: exceptionSearch.exceptionType || undefined,
      status: exceptionSearch.status,
      startTime: exceptionSearch.dateRange?.[0],
      endTime: exceptionSearch.dateRange?.[1],
      pageNum: exceptionPageNum.value,
      pageSize: exceptionPageSize.value
    }
    const res = await exceptionRecordAPI.getPage(params)
    exceptionList.value = res.data.list
    exceptionTotal.value = res.data.total
  } catch (error) {
    handleAPIError(error)
  } finally {
    exceptionLoading.value = false
  }
}

const resetExceptionSearch = () => {
  exceptionSearch.exceptionNo = ''
  exceptionSearch.exceptionType = null
  exceptionSearch.status = null
  exceptionSearch.dateRange = []
  exceptionPageNum.value = 1
  loadExceptionPage()
}

const handleExceptionSizeChange = (size) => {
  exceptionPageSize.value = size
  loadExceptionPage()
}

const handleExceptionPageChange = (page) => {
  exceptionPageNum.value = page
  loadExceptionPage()
}

const confirmBatch = (row) => {
  currentBatch.value = row
  batchConfirmVisible.value = true
}

const cancelBatch = async () => {
  try {
    await batchOperationAPI.confirm({
      batchOperationId: currentBatch.value.id,
      confirmed: false
    })
    ElMessage.success('已取消批量操作')
    batchConfirmVisible.value = false
    loadBatchPage()
  } catch (error) {
    handleAPIError(error)
  }
}

const confirmBatchExecute = async () => {
  try {
    await batchOperationAPI.confirm({
      batchOperationId: currentBatch.value.id,
      confirmed: true
    })
    ElMessage.success('批量操作已提交执行，结果将异步更新')
    batchConfirmVisible.value = false
    loadBatchPage()
  } catch (error) {
    handleAPIError(error)
  }
}

const viewBatchDetail = async (row) => {
  try {
    const res = await batchOperationAPI.getById(row.id)
    currentBatch.value = res.data
    batchDetailVisible.value = true
  } catch (error) {
    handleAPIError(error)
  }
}

const viewExceptions = (row) => {
  activeTab.value = 'exception'
  exceptionSearch.batchOperationId = row.id
  loadExceptionPage()
}

const viewExceptionDetail = async (row) => {
  try {
    const res = await exceptionRecordAPI.getById(row.id)
    currentException.value = res.data
    exceptionDetailVisible.value = true
  } catch (error) {
    handleAPIError(error)
  }
}

const openHandleDialog = (row) => {
  currentException.value = row
  handleForm.exceptionId = row.id
  handleForm.handleResult = ''
  handleDialogVisible.value = true
}

const submitHandle = async () => {
  if (!handleFormRef.value) return
  await handleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await exceptionRecordAPI.handleException(handleForm.exceptionId, handleForm)
        ElMessage.success('处理成功')
        handleDialogVisible.value = false
        loadExceptionPage()
        loadBatchPage()
      } catch (error) {
        handleAPIError(error)
      }
    }
  })
}

const retryException = async (row) => {
  ElMessageBox.confirm(`确定要重试异常"${row.exceptionNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await exceptionRecordAPI.retryException(row.id)
      ElMessage.success('重试成功')
      loadExceptionPage()
    } catch (error) {
      handleAPIError(error)
    }
  }).catch(() => {})
}

const ignoreException = async (row) => {
  ElMessageBox.confirm(`确定要忽略异常"${row.exceptionNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await exceptionRecordAPI.ignoreException(row.id, { handlerId: 2, handleResult: '手动忽略' })
      ElMessage.success('已忽略')
      loadExceptionPage()
    } catch (error) {
      handleAPIError(error)
    }
  }).catch(() => {})
}

const getOperationTypeText = (type) => {
  const map = { STATUS_CHANGE: '状态变更', PRICE_CHANGE: '价格变更', ASSIGN: '分配', EXPORT: '导出' }
  return map[type] || type
}

const getTargetTypeText = (type) => {
  const map = { REPAIR_ORDER: '维修单', PACKAGE: '套餐', MEMBER: '会员' }
  return map[type] || type || '-'
}

const getExceptionTypeText = (type) => {
  const map = { BATCH_FAIL: '批量操作失败', STATUS_CHANGE_FAIL: '状态变更失败', PAYMENT_FAIL: '支付失败' }
  return map[type] || type
}

onMounted(() => {
  loadBatchPage()
  loadExceptionPage()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.tab-toolbar {
  margin-bottom: 20px;
}
.search-form {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
