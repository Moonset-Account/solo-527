<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">关联管理</h2>
      <el-alert
        title="用于在仪器预约、危化标签、课题报表、样本与原始单据之间建立关联，便于复盘时追溯完整链路"
        type="info"
        show-icon
        :closable="false"
        style="margin-left: 20px"
      />
    </div>

    <div class="card-shadow">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="申请 - 仪器预约关联" name="application-instrument">
          <div class="section-title">选择申请单后，可关联已有的仪器预约记录</div>
          <el-form label-width="120px" style="margin-top: 16px">
            <el-form-item label="申请单">
              <el-input
                v-model="appSearch"
                placeholder="输入申请单号搜索"
                style="width: 300px"
                clearable
              />
              <el-button type="primary" style="margin-left: 8px" @click="searchApplication">搜索</el-button>
            </el-form-item>
          </el-form>
          <el-table v-if="selectedApp" :data="[{ app: selectedApp }]" border style="margin-bottom: 16px">
            <el-table-column prop="applicationNo" label="申请单号" />
            <el-table-column prop="applicantName" label="申请人" />
            <el-table-column prop="purpose" label="用途" />
            <el-table-column label="关联仪器预约">
              <template #default="{ row }">
                <el-tag v-if="row.app.relatedInstrumentBookingId">
                  {{ row.app.relatedInstrumentBookingId }}
                </el-tag>
                <span v-else style="color: #909399">未关联</span>
              </template>
            </el-table-column>
          </el-table>
          <el-form-item label="关联预约单">
            <el-select v-model="bookingToLink" filterable placeholder="搜索仪器预约单号" style="width: 400px">
              <el-option
                v-for="b in bookingList"
                :key="b._id"
                :label="`${b.bookingNo} - ${b.instrumentName}`"
                :value="b._id"
              />
            </el-select>
            <el-button type="primary" style="margin-left: 8px" :disabled="!bookingToLink || !selectedApp">
              建立关联
            </el-button>
          </el-form-item>
        </el-tab-pane>

        <el-tab-pane label="试剂 / 申请 - 危化标签关联" name="reagent-hazardous">
          <div class="section-title">将试剂或领用申请与危化品安全标签关联，合规提醒可发送给相关人员</div>
          <el-row :gutter="20" style="margin-top: 16px">
            <el-col :span="12">
              <div class="sub-title">试剂列表</div>
              <el-table :data="reagentList" size="small" height="400" border @selection-change="onReagentSelect">
                <el-table-column type="selection" width="40" />
                <el-table-column prop="name" label="试剂" show-overflow-tooltip />
                <el-table-column prop="batchNo" label="批号" />
              </el-table>
            </el-col>
            <el-col :span="12">
              <div class="sub-title">危化标签</div>
              <el-table :data="hazardousList" size="small" height="400" border @selection-change="onHazardousSelect">
                <el-table-column type="selection" width="40" />
                <el-table-column prop="name" label="标签名称" />
                <el-table-column prop="category" label="类别" />
              </el-table>
            </el-col>
          </el-row>
          <div style="margin-top: 16px; text-align: right">
            <el-button type="primary" :disabled="selectedReagents.length === 0 || selectedHazardous.length === 0">
              建立关联（已选 {{ selectedReagents.length }} 试剂, {{ selectedHazardous.length }} 标签）
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="课题报表 - 原始单据关联" name="project-document">
          <div class="section-title">课题报表与采购入库、领用、检测等原始单据建立关联</div>
          <el-form label-width="120px" style="margin-top: 16px">
            <el-form-item label="选择课题">
              <el-select v-model="selectedProject" filterable placeholder="搜索课题" style="width: 400px">
                <el-option
                  v-for="p in projectList"
                  :key="p._id"
                  :label="`${p.projectNo} - ${p.name}`"
                  :value="p._id"
                />
              </el-select>
            </el-form-item>
          </el-form>
          <el-row :gutter="20" v-if="selectedProject">
            <el-col :span="12">
              <div class="sub-title">课题报表</div>
              <el-table :data="reportList" size="small" height="400" border @selection-change="onReportSelect">
                <el-table-column type="selection" width="40" />
                <el-table-column prop="reportNo" label="报表编号" />
                <el-table-column prop="title" label="标题" show-overflow-tooltip />
              </el-table>
            </el-col>
            <el-col :span="12">
              <div class="sub-title">原始单据</div>
              <el-table :data="documentList" size="small" height="400" border @selection-change="onDocumentSelect">
                <el-table-column type="selection" width="40" />
                <el-table-column prop="documentNo" label="单据编号" />
                <el-table-column prop="title" label="标题" />
                <el-table-column prop="documentType" label="类型" />
              </el-table>
            </el-col>
          </el-row>
          <div style="margin-top: 16px; text-align: right" v-if="selectedProject">
            <el-button type="primary" :disabled="selectedReports.length === 0 && selectedDocuments.length === 0">
              保存关联
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="申请 - 样本关联" name="application-sample">
          <div class="section-title">建立领用申请与对应样本的关联，用于追溯样本去向</div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  applicationApi,
  instrumentApi,
  reagentApi,
  hazardousApi,
  projectApi,
  dashboardApi,
} from '@/api'
import type {
  Application,
  InstrumentBooking,
  Reagent,
  Project,
  OriginalDocument,
} from '@/types'

const activeTab = ref('application-instrument')
const appSearch = ref('')
const selectedApp = ref<Application | null>(null)
const bookingToLink = ref('')
const bookingList = ref<InstrumentBooking[]>([])

const reagentList = ref<Reagent[]>([])
const hazardousList = ref<any[]>([])
const selectedReagents = ref<any[]>([])
const selectedHazardous = ref<any[]>([])

const projectList = ref<Project[]>([])
const selectedProject = ref('')
const reportList = ref<any[]>([])
const documentList = ref<OriginalDocument[]>([])
const selectedReports = ref<any[]>([])
const selectedDocuments = ref<any[]>([])

async function searchApplication() {
  if (!appSearch.value) return
  try {
    const res = await applicationApi.list({ keyword: appSearch.value, pageSize: 1, page: 1 })
    if (res.list.length > 0) {
      selectedApp.value = res.list[0]
    } else {
      ElMessage.warning('未找到申请单')
    }
  } catch {}
}

function onReagentSelect(rows: any[]) {
  selectedReagents.value = rows
}
function onHazardousSelect(rows: any[]) {
  selectedHazardous.value = rows
}
function onReportSelect(rows: any[]) {
  selectedReports.value = rows
}
function onDocumentSelect(rows: any[]) {
  selectedDocuments.value = rows
}

onMounted(async () => {
  try {
    const [bookings, reagents, hazardous, projects, docs] = await Promise.all([
      instrumentApi.listBookings({ pageSize: 50, page: 1 }),
      reagentApi.list({ pageSize: 20, page: 1 }),
      hazardousApi.list({ pageSize: 50, page: 1 }),
      projectApi.list({ pageSize: 50, page: 1 }),
      dashboardApi.listDocuments({ pageSize: 50, page: 1 }),
    ])
    bookingList.value = bookings.list
    reagentList.value = reagents.list
    hazardousList.value = hazardous.list
    projectList.value = projects.list
    documentList.value = docs.list
  } catch {}
})
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}
.sub-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
