<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span>套餐管理</span>
          <el-button type="primary" @click="openPackageDialog">
            <el-icon><Plus /></el-icon>
            新增套餐
          </el-button>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="套餐名称/编码" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="套餐类型">
          <el-select v-model="searchForm.packageType" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="opt in packageTypeOptions.filter(o => o.value)" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="opt in enableStatusOptions.filter(o => o.value !== null)" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
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
        <el-table-column prop="packageCode" label="套餐编码" width="140" />
        <el-table-column prop="packageName" label="套餐名称" />
        <el-table-column prop="packageType" label="套餐类型" width="120">
          <template #default="scope">{{ getPackageTypeText(scope.row.packageType) }}</template>
        </el-table-column>
        <el-table-column prop="originalPrice" label="原价(元)" width="100">
          <template #default="scope">¥{{ scope.row.originalPrice?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="packagePrice" label="套餐价(元)" width="110">
          <template #default="scope">
            <el-tag type="danger">¥{{ scope.row.packagePrice?.toFixed(2) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="validDays" label="有效期(天)" width="100" />
        <el-table-column prop="maxUsage" label="使用次数" width="90" />
        <el-table-column prop="sourceDetectionRecordNo" label="来源检测单" width="140" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ getPackageStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewBenefits(scope.row)">权益明细</el-button>
            <el-button size="small" @click="openPackageDialog(scope.row)">编辑</el-button>
            <el-button size="small" :type="scope.row.status === 1 ? 'info' : 'success'" @click="toggleStatus(scope.row)">
              {{ scope.row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="danger" @click="deletePackage(scope.row)" :disabled="scope.row.status === 1">删除</el-button>
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

    <el-dialog v-model="packageDialogVisible" :title="packageForm.id ? '编辑套餐' : '新增套餐'" width="800px" :close-on-click-modal="false">
      <el-form :model="packageForm" :rules="packageRules" ref="packageFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="套餐编码" prop="packageCode">
              <el-input v-model="packageForm.packageCode" :disabled="!!packageForm.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐名称" prop="packageName">
              <el-input v-model="packageForm.packageName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="套餐类型" prop="packageType">
              <el-select v-model="packageForm.packageType" style="width: 100%">
                <el-option v-for="opt in packageTypeOptions.filter(o => o.value)" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源检测单">
              <el-select v-model="packageForm.sourceDetectionRecordId" placeholder="可选，关联检测记录" filterable clearable style="width: 100%">
                <el-option v-for="r in detectionRecordList" :key="r.id" :label="`${r.recordNo} - ${r.memberName}`" :value="r.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="原价" prop="originalPrice">
              <el-input-number v-model="packageForm.originalPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="套餐价" prop="packagePrice">
              <el-input-number v-model="packageForm.packagePrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="有效期(天)" prop="validDays">
              <el-input-number v-model="packageForm.validDays" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最大使用次数" prop="maxUsage">
              <el-input-number v-model="packageForm.maxUsage" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="packageForm.status">
                <el-radio :value="0">下架</el-radio>
                <el-radio :value="1">上架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="套餐说明" prop="description">
          <el-input v-model="packageForm.description" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider content-position="left">
          <span style="font-weight: bold">套餐权益配置</span>
          <el-button size="small" type="primary" @click="addBenefit">
            <el-icon><Plus /></el-icon>
            添加权益
          </el-button>
        </el-divider>

        <el-table :data="benefitList" border>
          <el-table-column prop="benefitType" label="权益类型" width="120">
            <template #default="scope">
              <el-select v-model="scope.row.benefitType" style="width: 100%">
                <el-option label="检测项目" value="ITEM" />
                <el-option label="折扣" value="DISCOUNT" />
                <el-option label="优惠券" value="COUPON" />
                <el-option label="赠送" value="GIFT" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="benefitName" label="权益名称">
            <template #default="scope">
              <el-input v-model="scope.row.benefitName" placeholder="请输入权益名称" />
            </template>
          </el-table-column>
          <el-table-column prop="benefitValue" label="权益值" width="150">
            <template #default="scope">
              <el-input-number v-model="scope.row.benefitValue" :min="0" :precision="2" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column prop="benefitDetail" label="权益详情">
            <template #default="scope">
              <el-input v-model="scope.row.benefitDetail" placeholder="权益详细说明" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeBenefit(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <el-button @click="packageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePackage">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="benefitDialogVisible" title="权益明细" width="700px">
      <div v-if="currentPackage">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="套餐编码">{{ currentPackage.packageCode }}</el-descriptions-item>
          <el-descriptions-item label="套餐名称">{{ currentPackage.packageName }}</el-descriptions-item>
          <el-descriptions-item label="套餐类型">{{ getPackageTypeText(currentPackage.packageType) }}</el-descriptions-item>
          <el-descriptions-item label="有效期">{{ currentPackage.validDays }}天</el-descriptions-item>
          <el-descriptions-item label="原价">¥{{ currentPackage.originalPrice?.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="套餐价">¥{{ currentPackage.packagePrice?.toFixed(2) }}</el-descriptions-item>
        </el-descriptions>
        <el-divider>权益清单</el-divider>
        <el-table :data="currentPackage.benefits || []" border>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="benefitType" label="类型" width="100">
            <template #default="scope">
              <el-tag :type="getBenefitType(scope.row.benefitType)">{{ getBenefitTypeText(scope.row.benefitType) }}</el-tag>
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
      </div>
      <template #footer>
        <el-button @click="benefitDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { memberPackageAPI, commonAPI, detectionRecordAPI } from '@/api'
import {
  getPackageTypeText,
  getPackageStatusText,
  packageTypeOptions,
  enableStatusOptions,
  handleAPIError
} from '@/utils'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchForm = reactive({
  keyword: '',
  packageType: null,
  status: null
})

const detectionRecordList = ref([])
const currentPackage = ref(null)

const packageDialogVisible = ref(false)
const benefitDialogVisible = ref(false)
const packageFormRef = ref(null)

const packageForm = reactive({
  id: null,
  packageCode: '',
  packageName: '',
  packageType: '',
  originalPrice: 0,
  packagePrice: 0,
  validDays: 365,
  maxUsage: 1,
  description: '',
  status: 0,
  sourceDetectionRecordId: null,
  createBy: 2
})

const packageRules = {
  packageCode: [{ required: true, message: '请输入套餐编码', trigger: 'blur' }],
  packageName: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  packageType: [{ required: true, message: '请选择套餐类型', trigger: 'change' }],
  originalPrice: [{ required: true, message: '请输入原价', trigger: 'blur' }],
  packagePrice: [{ required: true, message: '请输入套餐价', trigger: 'blur' }],
  validDays: [{ required: true, message: '请输入有效期', trigger: 'blur' }],
  maxUsage: [{ required: true, message: '请输入使用次数', trigger: 'blur' }]
}

const benefitList = ref([])

const loadPage = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchForm.keyword || undefined,
      packageType: searchForm.packageType || undefined,
      status: searchForm.status,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await memberPackageAPI.getPage(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    handleAPIError(error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.packageType = null
  searchForm.status = null
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

const openPackageDialog = async (row = null) => {
  benefitList.value = []
  if (row) {
    const res = await memberPackageAPI.getById(row.id)
    Object.assign(packageForm, res.data)
    if (res.data.benefits) {
      benefitList.value = JSON.parse(JSON.stringify(res.data.benefits))
    }
  } else {
    Object.assign(packageForm, {
      id: null,
      packageCode: '',
      packageName: '',
      packageType: '',
      originalPrice: 0,
      packagePrice: 0,
      validDays: 365,
      maxUsage: 1,
      description: '',
      status: 0,
      sourceDetectionRecordId: null,
      createBy: 2
    })
  }
  packageDialogVisible.value = true
}

const addBenefit = () => {
  benefitList.value.push({
    benefitType: 'ITEM',
    benefitName: '',
    benefitValue: 1,
    benefitDetail: '',
    sortOrder: benefitList.value.length
  })
}

const removeBenefit = (index) => {
  benefitList.value.splice(index, 1)
}

const savePackage = async () => {
  if (!packageFormRef.value) return
  await packageFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const data = {
          pkg: packageForm,
          benefits: benefitList.value
        }
        if (packageForm.id) {
          await memberPackageAPI.update(data)
          ElMessage.success('更新成功')
        } else {
          await memberPackageAPI.create(data)
          ElMessage.success('创建成功')
        }
        packageDialogVisible.value = false
        loadPage()
      } catch (error) {
        handleAPIError(error)
      }
    }
  })
}

const toggleStatus = async (row) => {
  try {
    await memberPackageAPI.toggleStatus(row.id)
    ElMessage.success(row.status === 1 ? '下架成功' : '上架成功')
    loadPage()
  } catch (error) {
    handleAPIError(error)
  }
}

const deletePackage = async (row) => {
  ElMessageBox.confirm(`确定要删除"${row.packageName}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await memberPackageAPI.delete(row.id)
      ElMessage.success('删除成功')
      loadPage()
    } catch (error) {
      handleAPIError(error)
    }
  }).catch(() => {})
}

const viewBenefits = async (row) => {
  const res = await memberPackageAPI.getById(row.id)
  currentPackage.value = res.data
  benefitDialogVisible.value = true
}

const getBenefitTypeText = (type) => {
  const map = { ITEM: '检测项目', DISCOUNT: '折扣', COUPON: '优惠券', GIFT: '赠送' }
  return map[type] || type
}

const getBenefitType = (type) => {
  const map = { ITEM: 'primary', DISCOUNT: 'success', COUPON: 'danger', GIFT: 'warning' }
  return map[type] || 'info'
}

const loadDetectionRecords = async () => {
  try {
    const res = await detectionRecordAPI.getPage({ pageNum: 1, pageSize: 100 })
    detectionRecordList.value = res.data.list
  } catch (error) {
    handleAPIError(error)
  }
}

onMounted(() => {
  loadPage()
  loadDetectionRecords()
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
.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
