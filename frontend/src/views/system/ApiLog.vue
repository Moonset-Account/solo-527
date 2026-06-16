<template>
  <div class="api-log">
    <el-card>
      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="接口路径">
            <el-input v-model="searchForm.apiPath" placeholder="请输入接口路径" clearable />
          </el-form-item>
          <el-form-item label="请求方法">
            <el-select v-model="searchForm.apiMethod" placeholder="请选择方法" clearable>
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
              <el-option label="PUT" value="PUT" />
              <el-option label="DELETE" value="DELETE" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="成功" :value="0" />
              <el-option label="失败" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户ID">
            <el-input v-model="searchForm.userId" placeholder="请输入用户ID" clearable />
          </el-form-item>
          <el-form-item label="链路ID">
            <el-input v-model="searchForm.traceId" placeholder="请输入链路ID" clearable />
          </el-form-item>
          <el-form-item label="创建时间">
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
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="toolbar">
        <el-button type="warning" @click="handleViewRetryList">查看重试列表</el-button>
        <el-button type="success" @click="handleExport">导出</el-button>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="traceId" label="链路ID" width="180" show-overflow-tooltip />
        <el-table-column prop="apiPath" label="接口路径" width="200" show-overflow-tooltip />
        <el-table-column prop="apiMethod" label="方法" width="80">
          <template #default="{ row }">
            <el-tag :type="getMethodTagType(row.apiMethod)" size="small">{{ row.apiMethod }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
              {{ row.status === 0 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorMsg" label="错误信息" width="150" show-overflow-tooltip />
        <el-table-column prop="costTime" label="耗时(ms)" width="100" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="needRetry" label="需重试" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.needRetry === 1" type="warning" size="small">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="retryCount" label="重试次数" width="90" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button v-if="row.status === 1" type="warning" link @click="handleMarkRetry(row)">标记重试</el-button>
            <el-button v-if="row.needRetry === 1" type="success" link :loading="retryingMap[row.id]" @click="handleRetry(row)">立即重试</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="日志详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日志ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="链路ID">{{ detailData.traceId }}</el-descriptions-item>
        <el-descriptions-item label="接口路径" :span="2">{{ detailData.apiPath }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ detailData.apiMethod }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 0 ? 'success' : 'danger'">
            {{ detailData.status === 0 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailData.costTime }}ms</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ detailData.userId }}</el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ detailData.retryCount }}/{{ detailData.maxRetry }}</el-descriptions-item>
        <el-descriptions-item label="是否需重试">
          <el-tag v-if="detailData.needRetry === 1" type="warning">是</el-tag>
          <span v-else>否</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDate(detailData.createTime) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>请求参数</el-divider>
      <pre class="code-block">{{ formatJson(detailData.requestParams) }}</pre>

      <el-divider>响应数据</el-divider>
      <pre class="code-block">{{ formatJson(detailData.responseData) }}</pre>

      <el-divider v-if="detailData.errorMsg">错误信息</el-divider>
      <el-alert v-if="detailData.errorMsg" :title="detailData.errorMsg" type="error" show-icon />
    </el-dialog>

    <el-dialog v-model="retryDialogVisible" title="重试列表" width="800px">
      <el-table :data="retryList" border stripe size="small">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="apiPath" label="接口路径" width="200" show-overflow-tooltip />
        <el-table-column prop="apiMethod" label="方法" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
              {{ row.status === 0 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorMsg" label="错误信息" width="150" show-overflow-tooltip />
        <el-table-column prop="retryCount" label="重试次数" width="90" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="success" link :loading="retryingMap[row.id]" @click="handleRetryItem(row)">重试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getApiLogPage, getApiLogDetail, getRetryList, markForRetry, updateRetryResult, exportApiLog, executeRetryRequest } from '@/api/apiLog'

const searchForm = reactive({
  apiPath: '',
  apiMethod: '',
  status: null,
  userId: '',
  traceId: '',
  dateRange: []
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const loading = ref(false)
const tableData = ref([])
const detailDialogVisible = ref(false)
const retryDialogVisible = ref(false)
const detailData = ref({})
const retryList = ref([])
const retryingMap = reactive({})

const getMethodTagType = (method) => {
  const map = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger' }
  return map[method] || 'info'
}

const formatDate = (date) => {
  if (!date) return '-'
  return date
}

const formatJson = (str) => {
  if (!str) return '-'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch (e) {
    return str
  }
}

const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
    if (searchForm.apiPath) params.apiPath = searchForm.apiPath
    if (searchForm.apiMethod) params.apiMethod = searchForm.apiMethod
    if (searchForm.status !== null && searchForm.status !== '') params.status = searchForm.status
    if (searchForm.userId) params.userId = searchForm.userId
    if (searchForm.traceId) params.traceId = searchForm.traceId
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startTime = searchForm.dateRange[0]
      params.endTime = searchForm.dateRange[1]
    }
    const res = await getApiLogPage(params)
    tableData.value = res.records
    pagination.total = res.total
  } catch (error) {
    console.error('获取接口日志失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchData()
}

const handleReset = () => {
  searchForm.apiPath = ''
  searchForm.apiMethod = ''
  searchForm.status = null
  searchForm.userId = ''
  searchForm.traceId = ''
  searchForm.dateRange = []
  handleSearch()
}

const handleView = async (row) => {
  try {
    const res = await getApiLogDetail(row.id)
    detailData.value = res
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

const handleMarkRetry = async (row) => {
  try {
    await markForRetry(row.id)
    ElMessage.success('已标记为重试')
    fetchData()
  } catch (error) {
    console.error('标记重试失败:', error)
  }
}

const doRetry = async (row) => {
  retryingMap[row.id] = true
  const startTime = Date.now()
  let success = false
  let errorMsg = null
  let responseData = null

  try {
    const response = await executeRetryRequest(row.apiPath, row.apiMethod, row.requestParams)
    responseData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    if (responseData && responseData.length > 5000) {
      responseData = responseData.substring(0, 5000) + '...'
    }
    if (response.status >= 200 && response.status < 300) {
      const data = response.data
      if (data && typeof data === 'object' && data.code !== undefined) {
        success = data.code === 200
        if (!success) {
          errorMsg = data.message || '业务失败'
        }
      } else {
        success = true
      }
    } else {
      errorMsg = 'HTTP状态码: ' + response.status
    }
  } catch (error) {
    if (error.response) {
      errorMsg = 'HTTP ' + error.response.status + ': ' + (error.response.statusText || '请求失败')
      try {
        responseData = JSON.stringify(error.response.data)
      } catch (e) {
        responseData = error.response.statusText
      }
    } else {
      errorMsg = error.message || '请求异常'
    }
  }

  const costTime = Date.now() - startTime

  try {
    await updateRetryResult(row.id, {
      success,
      errorMsg,
      responseData,
      costTime
    })
    if (success) {
      ElMessage.success('重试成功，接口已恢复正常')
    } else {
      ElMessage.warning('重试执行完成，但接口仍返回失败：' + (errorMsg || '未知错误'))
    }
  } catch (updateError) {
    console.error('更新重试结果失败:', updateError)
    ElMessage.error('重试结果回写失败')
  }

  retryingMap[row.id] = false
  fetchData()
}

const handleRetry = (row) => {
  doRetry(row)
}

const handleViewRetryList = async () => {
  try {
    const res = await getRetryList()
    retryList.value = res
    retryDialogVisible.value = true
  } catch (error) {
    console.error('获取重试列表失败:', error)
  }
}

const handleRetryItem = (row) => {
  doRetry(row)
}

const handleExport = async () => {
  try {
    const params = {}
    if (searchForm.apiPath) params.apiPath = searchForm.apiPath
    if (searchForm.apiMethod) params.apiMethod = searchForm.apiMethod
    if (searchForm.status !== null && searchForm.status !== '') params.status = searchForm.status
    if (searchForm.userId) params.userId = searchForm.userId
    if (searchForm.traceId) params.traceId = searchForm.traceId
    const blob = await exportApiLog(params)
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '接口调用日志.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.api-log {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.code-block {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
