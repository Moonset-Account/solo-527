<template>
  <div class="technicians-page">
    <div class="page-header">
      <h2>师傅管理</h2>
    </div>

    <el-card class="filter-card">
      <el-form :model="filterForm" inline @submit.prevent>
        <el-form-item label="姓名">
          <el-input v-model="filterForm.keyword" placeholder="请输入姓名" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="在职" value="active" />
            <el-option label="离职" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>师傅列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增师傅</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40">
              {{ row.name?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="技能标签" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="skill in row.skills"
              :key="skill"
              size="small"
              type="info"
              style="margin-right: 6px; margin-bottom: 4px"
            >
              {{ skill }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="本月订单" width="100" />
        <el-table-column label="评分" width="150">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled size="small" />
            <span class="rating-text">{{ row.rating }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewWorkload(row)">负载</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleSkills(row)">技能</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        @change="handlePageChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑师傅' : '新增师傅'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="技能" prop="skills">
          <el-select v-model="form.skills" multiple placeholder="请选择技能" style="width: 100%">
            <el-option label="空调维修" value="空调维修" />
            <el-option label="冰箱维修" value="冰箱维修" />
            <el-option label="洗衣机维修" value="洗衣机维修" />
            <el-option label="热水器维修" value="热水器维修" />
            <el-option label="油烟机维修" value="油烟机维修" />
            <el-option label="燃气灶维修" value="燃气灶维修" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务区域">
          <el-select v-model="form.workAreas" multiple placeholder="请选择服务区域" style="width: 100%">
            <el-option label="朝阳区" value="朝阳区" />
            <el-option label="海淀区" value="海淀区" />
            <el-option label="东城区" value="东城区" />
            <el-option label="西城区" value="西城区" />
            <el-option label="丰台区" value="丰台区" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="active">在职</el-radio>
            <el-radio value="inactive">离职</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="workloadVisible" title="师傅负载分析" width="800px">
      <div class="workload-filter">
        <el-radio-group v-model="workloadPeriod" size="small" @change="loadWorkloadData">
          <el-radio-button label="day">按日</el-radio-button>
          <el-radio-button label="week">按周</el-radio-button>
          <el-radio-button label="month">按月</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="workloadChartRef" class="workload-chart"></div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import Pagination from '@/components/Pagination.vue'
import { useAppStore } from '@/stores/app'
import type { Technician } from '@/api/technician'

const appStore = useAppStore()

const loading = ref(false)
const tableData = ref<Technician[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filterForm = reactive({
  keyword: '',
  status: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  phone: '',
  skills: [] as string[],
  workAreas: [] as string[],
  status: 'active'
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  skills: [{ required: true, message: '请选择技能', trigger: 'change' }]
}

const workloadVisible = ref(false)
const workloadPeriod = ref('day')
const workloadChartRef = ref<HTMLElement>()
let workloadChartInstance: echarts.ECharts | null = null
let currentTechnician: Technician | null = null

function handleSearch() {
  page.value = 1
  fetchList()
}

function handleReset() {
  filterForm.keyword = ''
  filterForm.status = ''
  page.value = 1
  fetchList()
}

function handlePageChange() {
  fetchList()
}

async function fetchList() {
  loading.value = true
  
  if (appStore.isDemoMode) {
    setTimeout(() => {
      tableData.value = generateDemoData()
      total.value = 25
      loading.value = false
    }, 500)
    return
  }

  loading.value = false
}

function generateDemoData(): Technician[] {
  const names = ['李师傅', '王师傅', '张师傅', '刘师傅', '陈师傅', '杨师傅', '黄师傅', '赵师傅', '周师傅', '吴师傅']
  const allSkills = ['空调维修', '冰箱维修', '洗衣机维修', '热水器维修', '油烟机维修', '燃气灶维修']
  const data: Technician[] = []

  for (let i = 0; i < pageSize.value; i++) {
    const idx = (page.value - 1) * pageSize.value + i
    if (idx >= 25) break
    
    const skillCount = 2 + (i % 3)
    const skills = allSkills.slice(0, skillCount)
    
    data.push({
      id: idx + 1,
      name: names[idx % names.length],
      phone: `139${String(66000000 + idx).padStart(8, '0').slice(-8)}`,
      skills,
      status: idx % 7 === 6 ? 'inactive' : 'active',
      orderCount: 10 + idx * 2,
      rating: 4.5 + (idx % 5) * 0.1,
      workAreas: ['朝阳区', '海淀区'],
      createdAt: `2024-01-${String(1 + idx).padStart(2, '0')} 09:00:00`
    })
  }

  return data
}

function handleAdd() {
  isEdit.value = false
  form.name = ''
  form.phone = ''
  form.skills = []
  form.workAreas = []
  form.status = 'active'
  dialogVisible.value = true
}

function handleEdit(row: Technician) {
  isEdit.value = true
  form.name = row.name
  form.phone = row.phone
  form.skills = [...row.skills]
  form.workAreas = [...(row.workAreas || [])]
  form.status = row.status
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (appStore.isDemoMode) {
    ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    fetchList()
    return
  }

  // TODO: call API
  dialogVisible.value = false
}

function handleSkills(row: Technician) {
  ElMessage.info('技能管理功能开发中')
}

async function handleDelete(row: Technician) {
  try {
    await ElMessageBox.confirm(`确定要删除师傅 "${row.name}" 吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  if (appStore.isDemoMode) {
    ElMessage.success('删除成功')
    fetchList()
    return
  }

  // TODO: call API
}

function viewWorkload(row: Technician) {
  currentTechnician = row
  workloadVisible.value = true
  nextTick(() => {
    loadWorkloadData()
  })
}

function loadWorkloadData() {
  if (!workloadChartRef.value) return
  
  if (!workloadChartInstance) {
    workloadChartInstance = echarts.init(workloadChartRef.value)
  }

  let xData: string[] = []
  let orderData: number[] = []

  if (workloadPeriod.value === 'day') {
    xData = ['1月10日', '1月11日', '1月12日', '1月13日', '1月14日', '1月15日', '1月16日']
    orderData = [3, 5, 2, 4, 6, 3, 0]
  } else if (workloadPeriod.value === 'week') {
    xData = ['第1周', '第2周', '第3周', '第4周']
    orderData = [15, 22, 18, 25]
  } else {
    xData = ['1月', '2月', '3月', '4月', '5月', '6月']
    orderData = [60, 75, 68, 82, 90, 78]
  }

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData
    },
    yAxis: {
      type: 'value',
      name: '订单数'
    },
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: orderData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#66b1ff' }
          ])
        }
      }
    ]
  }

  workloadChartInstance.setOption(option)
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.technicians-page {
  .page-header {
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .rating-text {
      margin-left: 8px;
      color: #f56c6c;
      font-weight: 600;
    }
  }

  .workload-filter {
    margin-bottom: 16px;
  }

  .workload-chart {
    height: 350px;
  }
}
</style>
