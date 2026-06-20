<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span>经营效率报表</span>
          <div class="header-actions">
            <el-button type="primary" @click="openGenerateDialog">
              <el-icon><DocumentAdd /></el-icon>
              生成报表
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="报表类型">
          <el-select v-model="searchForm.reportType" placeholder="全部" clearable style="width: 150px">
            <el-option label="日报" value="DAILY" />
            <el-option label="周报" value="WEEKLY" />
            <el-option label="月报" value="MONTHLY" />
          </el-select>
        </el-form-item>
        <el-form-item label="报表日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
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

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="reportNo" label="报表编号" width="160" />
        <el-table-column prop="reportType" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getReportTypeTag(scope.row.reportType)">{{ getReportTypeText(scope.row.reportType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reportDate" label="报表日期" width="120">
          <template #default="scope">{{ formatDate(scope.row.reportDate) }}</template>
        </el-table-column>
        <el-table-column prop="totalOrders" label="总工单数" width="100" align="center" />
        <el-table-column prop="completedOrders" label="已完工" width="100" align="center" />
        <el-table-column prop="delayedOrders" label="延期单数" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.delayedOrders > 0" type="danger">{{ scope.row.delayedOrders }}</el-tag>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalRevenue" label="总营收(元)" width="130" align="right">
          <template #default="scope">¥{{ scope.row.totalRevenue?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="averageCompletionHours" label="平均时长(小时)" width="140" align="center" />
        <el-table-column prop="passRate" label="质检通过率(%)" width="130" align="center">
          <template #default="scope">
            <el-progress
              :percentage="Number(scope.row.passRate)"
              :color="getPassRateColor(scope.row.passRate)"
              :stroke-width="12"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="生成时间" width="180">
          <template #default="scope">{{ formatDateTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewReportDetail(scope.row)">查看详情</el-button>
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

    <el-dialog v-model="generateDialogVisible" title="生成经营效率报表" width="500px">
      <el-form :model="generateForm" :rules="generateRules" ref="generateFormRef" label-width="100px">
        <el-form-item label="报表类型" prop="reportType">
          <el-select v-model="generateForm.reportType" style="width: 100%">
            <el-option label="日报" value="DAILY" />
            <el-option label="周报" value="WEEKLY" />
            <el-option label="月报" value="MONTHLY" />
          </el-select>
        </el-form-item>
        <el-form-item label="报表日期" prop="reportDate">
          <el-date-picker
            v-model="generateForm.reportDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="generateForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-alert
          title="报表数据来源于已关闭的工单，包含总工单数、完成数、延期数、营收、效率等指标"
          type="info"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generateReport">生成报表</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="报表详情" width="1000px">
      <div v-if="currentReport">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="报表编号">{{ currentReport.reportNo }}</el-descriptions-item>
          <el-descriptions-item label="报表类型">
            <el-tag :type="getReportTypeTag(currentReport.reportType)">{{ getReportTypeText(currentReport.reportType) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="报表日期">{{ formatDate(currentReport.reportDate) }}</el-descriptions-item>
          <el-descriptions-item label="总工单数">{{ currentReport.totalOrders }}</el-descriptions-item>
          <el-descriptions-item label="已完工单数">{{ currentReport.completedOrders }}</el-descriptions-item>
          <el-descriptions-item label="延期工单数">
            <el-tag v-if="currentReport.delayedOrders > 0" type="danger">{{ currentReport.delayedOrders }}</el-tag>
            <span v-else>0</span>
          </el-descriptions-item>
          <el-descriptions-item label="总营收">
            <span style="color: #f56c6c; font-weight: bold; font-size: 18px">¥{{ currentReport.totalRevenue?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="平均完工时长">{{ currentReport.averageCompletionHours }} 小时</el-descriptions-item>
          <el-descriptions-item label="一次质检通过率">
            <el-progress
              :percentage="Number(currentReport.passRate)"
              :color="getPassRateColor(currentReport.passRate)"
              :stroke-width="15"
            />
          </el-descriptions-item>
          <el-descriptions-item label="来源工单ID" :span="3">{{ currentReport.sourceCloseOrderIds || '无' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ currentReport.remark || '无' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">核心指标</el-divider>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="总工单数" :value="currentReport.totalOrders" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="已完成单数" :value="currentReport.completedOrders" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="延期单数" :value="currentReport.delayedOrders" value-style="color: #f56c6c" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="总营收" :value="currentReport.totalRevenue" :precision="2" prefix="¥" />
          </el-col>
        </el-row>

        <el-divider content-position="left">技师效率排行</el-divider>
        <el-table :data="techEfficiencyData" border>
          <el-table-column type="index" label="排名" width="80" align="center">
            <template #default="scope">
              <el-tag v-if="scope.$index === 0" type="danger" size="large">NO.1</el-tag>
              <el-tag v-else-if="scope.$index === 1" type="warning" size="large">NO.2</el-tag>
              <el-tag v-else-if="scope.$index === 2" type="success" size="large">NO.3</el-tag>
              <span v-else>{{ scope.$index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="technicianName" label="技师姓名" width="120" />
          <el-table-column prop="orderCount" label="工单数" width="100" align="center" />
          <el-table-column prop="completedCount" label="完成数" width="100" align="center" />
          <el-table-column prop="totalHours" label="总工时(h)" width="120" align="center" />
          <el-table-column prop="totalRevenue" label="总营收(元)" width="130" align="right">
            <template #default="scope">¥{{ scope.row.totalRevenue?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="efficiency" label="效率(元/小时)" width="140" align="right">
            <template #default="scope">
              <span style="color: #67c23a; font-weight: bold">¥{{ scope.row.efficiency?.toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">工位利用率</el-divider>
        <el-table :data="stationUtilizationData" border>
          <el-table-column type="index" label="序号" width="80" align="center" />
          <el-table-column prop="workstationName" label="工位名称" width="150" />
          <el-table-column prop="orderCount" label="服务单数" width="100" align="center" />
          <el-table-column prop="occupiedHours" label="占用时长(h)" width="130" align="center" />
          <el-table-column prop="totalHours" label="总时长(h)" width="130" align="center" />
          <el-table-column prop="utilization" label="利用率" width="200">
            <template #default="scope">
              <el-progress
                :percentage="Number(scope.row.utilization)"
                :color="getUtilizationColor(scope.row.utilization)"
                :stroke-width="15"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { efficiencyReportAPI } from '@/api'
import {
  formatDateTime,
  formatDate,
  getReportTypeText,
  handleAPIError
} from '@/utils'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchForm = reactive({
  reportType: null,
  dateRange: []
})

const generateDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const generateFormRef = ref(null)
const currentReport = ref(null)
const techEfficiencyData = ref([])
const stationUtilizationData = ref([])

const generateForm = reactive({
  reportType: 'DAILY',
  reportDate: '',
  remark: ''
})

const generateRules = {
  reportType: [{ required: true, message: '请选择报表类型', trigger: 'change' }],
  reportDate: [{ required: true, message: '请选择报表日期', trigger: 'change' }]
}

const loadPage = async () => {
  loading.value = true
  try {
    const params = {
      reportType: searchForm.reportType || undefined,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1],
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await efficiencyReportAPI.getPage(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    handleAPIError(error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.reportType = null
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

const openGenerateDialog = () => {
  generateForm.reportType = 'DAILY'
  generateForm.reportDate = ''
  generateForm.remark = ''
  generateDialogVisible.value = true
}

const generateReport = async () => {
  if (!generateFormRef.value) return
  await generateFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await efficiencyReportAPI.generate(generateForm)
        ElMessage.success('报表生成成功')
        generateDialogVisible.value = false
        loadPage()
      } catch (error) {
        handleAPIError(error)
      }
    }
  })
}

const viewReportDetail = async (row) => {
  try {
    const res = await efficiencyReportAPI.getDetail(row.id)
    currentReport.value = res.data.report
    techEfficiencyData.value = res.data.techEfficiencyData || []
    stationUtilizationData.value = res.data.stationUtilizationData || []
    detailDialogVisible.value = true
  } catch (error) {
    handleAPIError(error)
  }
}

const getReportTypeTag = (type) => {
  const map = { DAILY: 'success', WEEKLY: 'primary', MONTHLY: 'warning' }
  return map[type] || 'info'
}

const getPassRateColor = (rate) => {
  const r = Number(rate)
  if (r >= 95) return '#67c23a'
  if (r >= 85) return '#e6a23c'
  return '#f56c6c'
}

const getUtilizationColor = (rate) => {
  const r = Number(rate)
  if (r >= 80) return '#67c23a'
  if (r >= 50) return '#e6a23c'
  return '#f56c6c'
}

onMounted(() => {
  loadPage()
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
</style>
