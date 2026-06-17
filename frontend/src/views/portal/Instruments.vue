<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">仪器预约</h2>
      <el-button type="primary" @click="showBookingDialog = true">
        <el-icon><Plus /></el-icon>新增预约
      </el-button>
    </div>

    <div class="card-shadow">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="仪器列表" name="instruments">
          <div class="filter-bar">
            <el-input v-model="filter.keyword" placeholder="搜索仪器名称/编号" clearable style="width: 240px" />
            <el-select v-model="filter.laboratory" placeholder="实验室" clearable style="width: 160px">
              <el-option v-for="item in labDict" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" @click="loadInstruments">查询</el-button>
          </div>

          <el-table :data="instrumentList" v-loading="instrLoading" stripe>
            <el-table-column prop="instrumentNo" label="仪器编号" width="140" />
            <el-table-column prop="name" label="仪器名称" />
            <el-table-column prop="model" label="型号" />
            <el-table-column prop="manufacturer" label="厂家" show-overflow-tooltip />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'available' ? 'success' : row.status === 'maintenance' ? 'warning' : 'info'">
                  {{ InstrumentStatusLabel[row.status as keyof typeof InstrumentStatusLabel] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置" />
            <el-table-column prop="managerName" label="负责人" width="100" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  :disabled="row.status !== 'available'"
                  @click="openBooking(row)"
                >预约</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="我的预约" name="bookings">
          <el-table :data="bookingList" v-loading="bookingLoading" stripe>
            <el-table-column prop="bookingNo" label="预约单号" width="160" />
            <el-table-column prop="instrumentName" label="仪器名称" />
            <el-table-column label="预约时段" width="320">
              <template #default="{ row }">
                {{ formatDate(row.startTime) }} ~ {{ formatDate(row.endTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="bookerName" label="预约人" width="100" />
            <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button v-if="row.status === 'confirmed'" link type="danger" @click="cancelBooking(row)">
                  取消
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showBookingDialog" title="仪器预约" width="600px">
      <el-form ref="bookingFormRef" :model="bookingForm" :rules="bookingRules" label-width="100px">
        <el-form-item label="仪器" prop="instrumentId">
          <el-select v-model="bookingForm.instrumentId" placeholder="选择仪器" filterable style="width: 100%">
            <el-option v-for="i in instrumentList.filter((i) => i.status === 'available')" :key="i._id" :label="i.name" :value="i._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预约时段" prop="timeRange">
          <el-date-picker
            v-model="bookingForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="用途" prop="purpose">
          <el-input v-model="bookingForm.purpose" type="textarea" :rows="3" placeholder="请输入使用用途" />
        </el-form-item>
        <el-form-item label="关联课题">
          <el-select v-model="bookingForm.projectId" placeholder="可选" clearable style="width: 100%">
            <el-option v-for="p in projects" :key="p._id" :label="p.name" :value="p._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="bookingForm.remarks" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBookingDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitBooking">确认预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { instrumentApi, configApi, projectApi } from '@/api'
import { InstrumentStatusLabel, type Instrument, type InstrumentBooking, type Project, type DictionaryItem } from '@/types'
import dayjs from 'dayjs'
import { Plus } from '@element-plus/icons-vue'

const activeTab = ref('instruments')
const instrLoading = ref(false)
const bookingLoading = ref(false)
const submitting = ref(false)
const showBookingDialog = ref(false)
const bookingFormRef = ref<FormInstance>()

const instrumentList = ref<Instrument[]>([])
const bookingList = ref<InstrumentBooking[]>([])
const projects = ref<Project[]>([])
const labDict = ref<DictionaryItem[]>([])

const filter = reactive({
  keyword: '',
  laboratory: '',
})

const bookingForm = reactive({
  instrumentId: '',
  timeRange: [] as string[],
  purpose: '',
  projectId: '',
  remarks: '',
})

const bookingRules: FormRules = {
  instrumentId: [{ required: true, message: '请选择仪器', trigger: 'change' }],
  timeRange: [{ required: true, message: '请选择时段', trigger: 'change' }],
  purpose: [{ required: true, message: '请输入用途', trigger: 'blur' }],
}

function formatDate(d: string) {
  return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'
}

async function loadInstruments() {
  instrLoading.value = true
  try {
    const res = await instrumentApi.list({ ...filter, pageSize: 100, page: 1 })
    instrumentList.value = res.list
  } finally {
    instrLoading.value = false
  }
}

async function loadBookings() {
  bookingLoading.value = true
  try {
    const res = await instrumentApi.listBookings({ pageSize: 50, page: 1 })
    bookingList.value = res.list
  } finally {
    bookingLoading.value = false
  }
}

function openBooking(row: Instrument) {
  bookingForm.instrumentId = row._id
  showBookingDialog.value = true
}

async function submitBooking() {
  if (!bookingFormRef.value) return
  await bookingFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await instrumentApi.createBooking({
        instrumentId: bookingForm.instrumentId,
        startTime: bookingForm.timeRange[0],
        endTime: bookingForm.timeRange[1],
        purpose: bookingForm.purpose,
        projectId: bookingForm.projectId || undefined,
        remarks: bookingForm.remarks,
      })
      ElMessage.success('预约成功')
      showBookingDialog.value = false
      loadBookings()
      loadInstruments()
    } finally {
      submitting.value = false
    }
  })
}

async function cancelBooking(row: InstrumentBooking) {
  try {
    await ElMessageBox.confirm(`确定取消预约 ${row.bookingNo}？`, '提示', { type: 'warning' })
    await instrumentApi.cancelBooking(row._id)
    ElMessage.success('已取消')
    loadBookings()
  } catch {}
}

onMounted(async () => {
  await Promise.all([loadInstruments(), loadBookings()])
  try {
    labDict.value = await configApi.getDictionaryItems('laboratory')
  } catch {}
  try {
    const res = await projectApi.list({ pageSize: 100, page: 1 })
    projects.value = res.list
  } catch {}
})
</script>
