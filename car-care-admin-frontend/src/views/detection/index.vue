<template>
  <div class="page-container">
    <el-card class="page-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="检测项目" name="items">
          <template #label>
            <el-icon><Search /></el-icon>
            检测项目
          </template>
          <div class="tab-toolbar">
            <el-form :inline="true" class="search-form">
              <el-form-item label="关键词">
                <el-input v-model="itemSearch.keyword" placeholder="项目名称/编码" clearable style="width: 200px" />
              </el-form-item>
              <el-form-item label="分类">
                <el-select v-model="itemSearch.category" placeholder="全部" clearable style="width: 150px">
                  <el-option v-for="opt in itemCategoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="itemSearch.status" placeholder="全部" clearable style="width: 120px">
                  <el-option v-for="opt in enableStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadItemPage">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="resetItemSearch">重置</el-button>
              </el-form-item>
            </el-form>
            <el-button type="primary" @click="openItemDialog">
              <el-icon><Plus /></el-icon>
              新增检测项目
            </el-button>
          </div>
          <el-table :data="itemList" border stripe v-loading="itemLoading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="itemCode" label="项目编码" width="120" />
            <el-table-column prop="itemName" label="项目名称" />
            <el-table-column prop="itemCategory" label="分类" width="120">
              <template #default="scope">{{ itemCategoryText(scope.row.itemCategory) }}</template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="价格(元)" width="100" />
            <el-table-column prop="duration" label="时长(分钟)" width="100" />
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                  {{ scope.row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="openItemDialog(scope.row)">编辑</el-button>
                <el-button size="small" :type="scope.row.status === 1 ? 'info' : 'success'" @click="toggleItemStatus(scope.row)">
                  {{ scope.row.status === 1 ? '禁用' : '启用' }}
                </el-button>
                <el-button size="small" type="danger" @click="deleteItem(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            class="pagination"
            layout="total, sizes, prev, pager, next, jumper"
            :total="itemTotal"
            :page-size="itemPageSize"
            :current-page="itemPageNum"
            @size-change="handleItemSizeChange"
            @current-change="handleItemPageChange"
          />
        </el-tab-pane>

        <el-tab-pane label="检测记录" name="records">
          <template #label>
            <el-icon><Document /></el-icon>
            检测记录
          </template>
          <div class="tab-toolbar">
            <el-form :inline="true" class="search-form">
              <el-form-item label="记录编号">
                <el-input v-model="recordSearch.recordNo" placeholder="检测记录编号" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item label="会员">
                <el-select v-model="recordSearch.memberId" placeholder="选择会员" clearable filterable style="width: 180px">
                  <el-option v-for="m in memberList" :key="m.id" :label="`${m.name} - ${m.phone}`" :value="m.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="recordSearch.status" placeholder="全部" clearable style="width: 120px">
                  <el-option label="已取消" :value="0" />
                  <el-option label="待检测" :value="1" />
                  <el-option label="检测中" :value="2" />
                  <el-option label="已完成" :value="3" />
                </el-select>
              </el-form-item>
              <el-form-item label="检测日期">
                <el-date-picker
                  v-model="recordSearch.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadRecordPage">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="resetRecordSearch">重置</el-button>
              </el-form-item>
            </el-form>
            <el-button type="primary" @click="openRecordDialog">
              <el-icon><Plus /></el-icon>
              新增检测记录
            </el-button>
          </div>
          <el-table :data="recordList" border stripe v-loading="recordLoading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="recordNo" label="记录编号" width="160" />
            <el-table-column prop="memberName" label="车主姓名" width="100" />
            <el-table-column prop="carInfo" label="车牌号" width="120">
              <template #default="scope">{{ parseCarInfo(scope.row.carInfo).plateNumber || '-' }}</template>
            </el-table-column>
            <el-table-column prop="carInfo" label="车型" width="120">
              <template #default="scope">{{ parseCarInfo(scope.row.carInfo).carModel || '-' }}</template>
            </el-table-column>
            <el-table-column prop="totalAmount" label="总金额(元)" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getDetectionStatusType(scope.row.status)">
                  {{ getDetectionStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="checkDate" label="检测日期" width="120">
              <template #default="scope">{{ formatDate(scope.row.checkDate) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="viewRecordDetail(scope.row)">查看详情</el-button>
                <el-button size="small" type="primary" v-if="scope.row.status === 1" @click="updateRecordStatus(scope.row, 2)">开始检测</el-button>
                <el-button size="small" type="success" v-if="scope.row.status === 2" @click="updateRecordStatus(scope.row, 3)">完成检测</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            class="pagination"
            layout="total, sizes, prev, pager, next, jumper"
            :total="recordTotal"
            :page-size="recordPageSize"
            :current-page="recordPageNum"
            @size-change="handleRecordSizeChange"
            @current-change="handleRecordPageChange"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="itemDialogVisible" :title="itemForm.id ? '编辑检测项目' : '新增检测项目'" width="600px">
      <el-form :model="itemForm" :rules="itemRules" ref="itemFormRef" label-width="100px">
        <el-form-item label="项目编码" prop="itemCode">
          <el-input v-model="itemForm.itemCode" placeholder="请输入项目编码" :disabled="!!itemForm.id" />
        </el-form-item>
        <el-form-item label="项目名称" prop="itemName">
          <el-input v-model="itemForm.itemName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="分类" prop="itemCategory">
          <el-select v-model="itemForm.itemCategory" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="opt in itemCategoryOptions.filter(o => o.value)" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格(元)" prop="unitPrice">
          <el-input-number v-model="itemForm.unitPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时长(分钟)" prop="duration">
          <el-input-number v-model="itemForm.duration" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="itemForm.description" type="textarea" :rows="3" placeholder="请输入项目描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="itemForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordDialogVisible" title="新增检测记录" width="700px">
      <el-form :model="recordForm" :rules="recordRules" ref="recordFormRef" label-width="100px">
        <el-form-item label="车主" prop="memberId">
          <el-select v-model="recordForm.memberId" placeholder="请选择车主" filterable style="width: 100%">
            <el-option v-for="m in memberList" :key="m.id" :label="`${m.name} - ${m.phone}`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌号" prop="carInfoPlateNumber">
          <el-input v-model="recordForm.carInfoPlateNumber" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="车型" prop="carInfoCarModel">
          <el-input v-model="recordForm.carInfoCarModel" placeholder="请输入车型" />
        </el-form-item>
        <el-form-item label="里程数" prop="carInfoMileage">
          <el-input-number v-model="recordForm.carInfoMileage" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="检测日期" prop="checkDate">
          <el-date-picker v-model="recordForm.checkDate" type="date" placeholder="请选择检测日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="检测技师">
          <el-select v-model="recordForm.checkTechnicianId" placeholder="请选择检测技师" clearable filterable style="width: 100%">
            <el-option v-for="t in technicianList" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="检测项目">
          <div>
            <el-checkbox :indeterminate="isItemIndeterminate" v-model="isItemAllChecked" @change="handleCheckAllItem">全选</el-checkbox>
            <el-checkbox-group v-model="selectedItemIds" @change="handleCheckedItemChange">
              <el-row>
                <el-col :span="12" v-for="item in detectionItemList" :key="item.id">
                  <el-checkbox :label="item.id" border>
                    {{ item.itemName }} - ¥{{ item.unitPrice }}
                  </el-checkbox>
                </el-col>
              </el-row>
            </el-checkbox-group>
          </div>
        </el-form-item>
        <el-form-item label="总金额">
          <el-tag type="danger" size="large">¥{{ recordTotalAmount.toFixed(2) }}</el-tag>
        </el-form-item>
        <el-form-item label="结果摘要">
          <el-input v-model="recordForm.resultSummary" type="textarea" :rows="2" placeholder="请输入结果摘要" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordDetailVisible" title="检测记录详情" width="800px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="记录编号">{{ currentRecord.recordNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getDetectionStatusType(currentRecord.status)">{{ getDetectionStatusText(currentRecord.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车主ID">{{ currentRecord.memberId }}</el-descriptions-item>
        <el-descriptions-item label="检测技师">{{ currentRecord.checkTechnicianId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ parsedCarInfo.plateNumber || '-' }}</el-descriptions-item>
        <el-descriptions-item label="车型">{{ parsedCarInfo.carModel || '-' }}</el-descriptions-item>
        <el-descriptions-item label="里程数">{{ parsedCarInfo.mileage != null ? parsedCarInfo.mileage + ' km' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ currentRecord.totalAmount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="检测日期">{{ formatDate(currentRecord.checkDate) }}</el-descriptions-item>
        <el-descriptions-item label="结果摘要" :span="2">{{ currentRecord.resultSummary || '无' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider>检测项目明细</el-divider>
      <el-table :data="recordItemList" border v-loading="recordItemLoading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="itemName" label="检测项目" />
        <el-table-column prop="unitPrice" label="单价(元)" width="100" />
        <el-table-column prop="itemResult" label="检测结果" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.itemResult === '正常'" type="success">正常</el-tag>
            <el-tag v-else-if="scope.row.itemResult === '异常'" type="danger">异常</el-tag>
            <el-tag v-else-if="scope.row.itemResult === '待观察'" type="warning">待观察</el-tag>
            <el-tag v-else type="info">未检测</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="itemDetail" label="检测详情" />
        <el-table-column prop="suggestion" label="建议" />
      </el-table>
      <template #footer>
        <el-button @click="recordDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { detectionItemAPI, detectionRecordAPI, commonAPI } from '@/api'
import {
  formatDateTime,
  formatDate,
  getDetectionStatusText,
  getDetectionStatusType,
  itemCategoryOptions,
  itemCategoryText,
  enableStatusOptions,
  handleAPIError
} from '@/utils'

const activeTab = ref('items')

const itemList = ref([])
const itemLoading = ref(false)
const itemTotal = ref(0)
const itemPageNum = ref(1)
const itemPageSize = ref(10)
const itemSearch = reactive({
  keyword: '',
  category: null,
  status: null
})

const recordList = ref([])
const recordLoading = ref(false)
const recordTotal = ref(0)
const recordPageNum = ref(1)
const recordPageSize = ref(10)
const recordSearch = reactive({
  recordNo: '',
  memberId: null,
  status: null,
  dateRange: []
})

const memberList = ref([])
const technicianList = ref([])
const detectionItemList = ref([])
const currentRecord = ref(null)
const recordItemList = ref([])
const recordItemLoading = ref(false)

const itemDialogVisible = ref(false)
const recordDialogVisible = ref(false)
const recordDetailVisible = ref(false)

const itemFormRef = ref(null)
const recordFormRef = ref(null)

const itemForm = reactive({
  id: null,
  itemCode: '',
  itemName: '',
  itemCategory: '',
  unitPrice: 0,
  duration: 30,
  description: '',
  status: 1
})

const itemRules = {
  itemCode: [{ required: true, message: '请输入项目编码', trigger: 'blur' }],
  itemName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  itemCategory: [{ required: true, message: '请选择分类', trigger: 'change' }],
  unitPrice: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入时长', trigger: 'blur' }]
}

const recordForm = reactive({
  memberId: null,
  carInfoPlateNumber: '',
  carInfoCarModel: '',
  carInfoMileage: 0,
  checkDate: '',
  checkTechnicianId: null,
  resultSummary: ''
})

const recordRules = {
  memberId: [{ required: true, message: '请选择车主', trigger: 'change' }],
  carInfoPlateNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  carInfoCarModel: [{ required: true, message: '请输入车型', trigger: 'blur' }],
  checkDate: [{ required: true, message: '请选择检测日期', trigger: 'change' }]
}

const selectedItemIds = ref([])
const isItemAllChecked = ref(false)
const isItemIndeterminate = ref(false)

const recordTotalAmount = computed(() => {
  return selectedItemIds.value.reduce((sum, id) => {
    const item = detectionItemList.value.find(i => i.id === id)
    return sum + (item ? item.unitPrice : 0)
  }, 0)
})

const parseCarInfo = (carInfo) => {
  if (!carInfo) return {}
  try {
    return typeof carInfo === 'string' ? JSON.parse(carInfo) : carInfo
  } catch {
    return {}
  }
}

const parsedCarInfo = computed(() => {
  return parseCarInfo(currentRecord.value?.carInfo)
})

const loadItemPage = async () => {
  itemLoading.value = true
  try {
    const params = {
      keyword: itemSearch.keyword || undefined,
      category: itemSearch.category || undefined,
      status: itemSearch.status,
      pageNum: itemPageNum.value,
      pageSize: itemPageSize.value
    }
    const res = await detectionItemAPI.getPage(params)
    itemList.value = res.data.list
    itemTotal.value = res.data.total
  } catch (error) {
    handleAPIError(error)
  } finally {
    itemLoading.value = false
  }
}

const resetItemSearch = () => {
  itemSearch.keyword = ''
  itemSearch.category = null
  itemSearch.status = null
  itemPageNum.value = 1
  loadItemPage()
}

const handleItemSizeChange = (size) => {
  itemPageSize.value = size
  loadItemPage()
}

const handleItemPageChange = (page) => {
  itemPageNum.value = page
  loadItemPage()
}

const openItemDialog = (row = null) => {
  if (row) {
    Object.assign(itemForm, row)
  } else {
    Object.assign(itemForm, {
      id: null,
      itemCode: '',
      itemName: '',
      itemCategory: '',
      unitPrice: 0,
      duration: 30,
      description: '',
      status: 1
    })
  }
  itemDialogVisible.value = true
}

const saveItem = async () => {
  if (!itemFormRef.value) return
  await itemFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (itemForm.id) {
          await detectionItemAPI.update(itemForm)
          ElMessage.success('更新成功')
        } else {
          await detectionItemAPI.create(itemForm)
          ElMessage.success('创建成功')
        }
        itemDialogVisible.value = false
        loadItemPage()
      } catch (error) {
        handleAPIError(error)
      }
    }
  })
}

const toggleItemStatus = async (row) => {
  try {
    await detectionItemAPI.toggleStatus(row.id)
    ElMessage.success('状态切换成功')
    loadItemPage()
  } catch (error) {
    handleAPIError(error)
  }
}

const deleteItem = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除检测项目【${row.itemName}】吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await detectionItemAPI.delete(row.id)
    ElMessage.success('删除成功')
    loadItemPage()
  } catch (error) {
    if (error !== 'cancel') {
      handleAPIError(error)
    }
  }
}

const loadRecordPage = async () => {
  recordLoading.value = true
  try {
    const params = {
      recordNo: recordSearch.recordNo || undefined,
      memberId: recordSearch.memberId,
      status: recordSearch.status,
      pageNum: recordPageNum.value,
      pageSize: recordPageSize.value
    }
    if (recordSearch.dateRange && recordSearch.dateRange.length === 2) {
      params.startDate = recordSearch.dateRange[0]
      params.endDate = recordSearch.dateRange[1]
    }
    const res = await detectionRecordAPI.getPage(params)
    recordList.value = res.data.list
    recordTotal.value = res.data.total
  } catch (error) {
    handleAPIError(error)
  } finally {
    recordLoading.value = false
  }
}

const resetRecordSearch = () => {
  recordSearch.recordNo = ''
  recordSearch.memberId = null
  recordSearch.status = null
  recordSearch.dateRange = []
  recordPageNum.value = 1
  loadRecordPage()
}

const handleRecordSizeChange = (size) => {
  recordPageSize.value = size
  loadRecordPage()
}

const handleRecordPageChange = (page) => {
  recordPageNum.value = page
  loadRecordPage()
}

const loadMembers = async () => {
  try {
    const res = await commonAPI.getAllMembers()
    memberList.value = res.data
  } catch (error) {
    handleAPIError(error)
  }
}

const loadTechnicians = async () => {
  try {
    const res = await commonAPI.getEnabledTechnicians()
    technicianList.value = res.data
  } catch (error) {
    handleAPIError(error)
  }
}

const loadDetectionItems = async () => {
  try {
    const res = await detectionItemAPI.getEnabled()
    detectionItemList.value = res.data
  } catch (error) {
    handleAPIError(error)
  }
}

const openRecordDialog = () => {
  Object.assign(recordForm, {
    memberId: null,
    carInfoPlateNumber: '',
    carInfoCarModel: '',
    carInfoMileage: 0,
    checkDate: '',
    checkTechnicianId: null,
    resultSummary: ''
  })
  selectedItemIds.value = []
  isItemAllChecked.value = false
  isItemIndeterminate.value = false
  recordDialogVisible.value = true
  loadDetectionItems()
}

const handleCheckAllItem = (val) => {
  selectedItemIds.value = val ? detectionItemList.value.map(i => i.id) : []
  isItemIndeterminate.value = false
}

const handleCheckedItemChange = (value) => {
  const total = detectionItemList.value.length
  const checked = value.length
  isItemAllChecked.value = checked === total
  isItemIndeterminate.value = checked > 0 && checked < total
}

const saveRecord = async () => {
  if (!recordFormRef.value) return
  await recordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const carInfo = JSON.stringify({
          plateNumber: recordForm.carInfoPlateNumber,
          carModel: recordForm.carInfoCarModel,
          mileage: recordForm.carInfoMileage
        })
        const record = {
          memberId: recordForm.memberId,
          carInfo,
          checkDate: recordForm.checkDate,
          checkTechnicianId: recordForm.checkTechnicianId,
          totalAmount: recordTotalAmount.value,
          resultSummary: recordForm.resultSummary
        }
        const items = selectedItemIds.value.map(itemId => {
          const item = detectionItemList.value.find(i => i.id === itemId)
          return {
            itemId: item.id,
            itemName: item.itemName,
            unitPrice: item.unitPrice
          }
        })
        await detectionRecordAPI.create({ record, items })
        ElMessage.success('创建成功')
        recordDialogVisible.value = false
        loadRecordPage()
      } catch (error) {
        handleAPIError(error)
      }
    }
  })
}

const viewRecordDetail = async (row) => {
  currentRecord.value = row
  recordDetailVisible.value = true
  recordItemLoading.value = true
  try {
    const res = await detectionRecordAPI.getItems(row.id)
    recordItemList.value = res.data
  } catch (error) {
    handleAPIError(error)
  } finally {
    recordItemLoading.value = false
  }
}

const updateRecordStatus = async (row, newStatus) => {
  try {
    await detectionRecordAPI.updateStatus(row.id, newStatus)
    ElMessage.success('状态更新成功')
    loadRecordPage()
  } catch (error) {
    handleAPIError(error)
  }
}

onMounted(() => {
  loadItemPage()
  loadMembers()
  loadTechnicians()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-card {
  min-height: calc(100vh - 120px);
}

.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-form {
  flex: 1;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
