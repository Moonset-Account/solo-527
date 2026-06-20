<template>
  <div class="schedule-list">
    <div class="page-header">
      <h2 class="page-title">讲师档期管理</h2>
      <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
        添加档期
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :model="searchForm" class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="讲师">
          <el-select
            v-model="searchForm.interviewerId"
            placeholder="全部讲师"
            clearable
            style="width: 140px"
            filterable
          >
            <el-option
              v-for="item in interviewers"
              :key="item._id"
              :label="item.name"
              :value="item._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="可预约" value="available" />
            <el-option label="已预约" value="booked" />
            <el-option label="不可用" value="unavailable" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="warning" :icon="Calendar" @click="showBatchDialog = true">
            批量创建
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-container">
      <el-alert
        v-if="scheduleStats.warning > 0"
        :title="`档期使用率警告：当前已有 ${scheduleStats.used}/${scheduleStats.total} 个档期被预约，使用率 ${scheduleStats.rate}%`"
        type="warning"
        :closable="false"
        class="mb-20"
        show-icon
      />
      <el-alert
        v-if="scheduleStats.rate >= 100"
        title="阻断告警：档期已满，无法继续预约！请及时增加档期。"
        type="error"
        :closable="false"
        class="mb-20"
        show-icon
      />

      <el-table :data="schedules" v-loading="loading" style="width: 100%" stripe>
        <el-table-column prop="interviewerId.name" label="讲师" width="120" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column label="时间" width="140">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ ScheduleStatusLabel[row.status as keyof typeof ScheduleStatusLabel] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联面试" width="120">
          <template #default="{ row }">
            <el-link v-if="row.interviewId" type="primary" @click="$router.push('/interviews/' + row.interviewId)">
              查看面试
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'available'"
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button
              v-if="row.status === 'available'"
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>

    <el-dialog v-model="showCreateDialog" title="添加档期" width="500px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="讲师" prop="interviewerId">
          <el-select v-model="createForm.interviewerId" placeholder="请选择讲师" filterable style="width: 100%">
            <el-option
              v-for="item in interviewers"
              :key="item._id"
              :label="item.name"
              :value="item._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="createForm.date"
            type="date"
            placeholder="请选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker
            v-model="createForm.startTime"
            placeholder="选择开始时间"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-time-picker
            v-model="createForm.endTime"
            placeholder="选择结束时间"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="createForm.location" placeholder="面试间编号或线上会议链接" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.notes" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchDialog" title="批量创建档期" width="600px">
      <el-form ref="batchFormRef" :model="batchForm" :rules="batchRules" label-width="100px">
        <el-form-item label="讲师" prop="interviewerId">
          <el-select v-model="batchForm.interviewerId" placeholder="请选择讲师" filterable style="width: 100%">
            <el-option
              v-for="item in interviewers"
              :key="item._id"
              :label="item.name"
              :value="item._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="batchForm.startDate"
            type="date"
            placeholder="请选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="batchForm.endDate"
            type="date"
            placeholder="请选择结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="星期" prop="weekdays">
          <el-checkbox-group v-model="batchForm.weekdays">
            <el-checkbox :label="1">周一</el-checkbox>
            <el-checkbox :label="2">周二</el-checkbox>
            <el-checkbox :label="3">周三</el-checkbox>
            <el-checkbox :label="4">周四</el-checkbox>
            <el-checkbox :label="5">周五</el-checkbox>
            <el-checkbox :label="6">周六</el-checkbox>
            <el-checkbox :label="0">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="时间段" prop="timeSlots">
          <div v-for="(slot, index) in batchForm.timeSlots" :key="index" class="time-slot-item">
            <el-input
              v-model="batchForm.timeSlots[index]"
              placeholder="如：09:00-10:00"
              style="width: 200px"
            />
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click="removeTimeSlot(index)"
            />
          </div>
          <el-button type="dashed" style="width: 100%; margin-top: 8px" @click="addTimeSlot">
            <el-icon><Plus /></el-icon> 添加时间段
          </el-button>
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="batchForm.location" placeholder="面试间编号或线上会议链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleBatchCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Search, Refresh, Calendar, Delete } from '@element-plus/icons-vue';
import * as usersApi from '../../api/users';
import * as schedulesApi from '../../api/schedules';
import { ScheduleStatusLabel, ScheduleStatus, type User, type Schedule } from '../../types';

const loading = ref(false);
const submitting = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const schedules = ref<Schedule[]>([]);
const interviewers = ref<User[]>([]);
const showCreateDialog = ref(false);
const showBatchDialog = ref(false);
const createFormRef = ref<FormInstance>();
const batchFormRef = ref<FormInstance>();
const editingId = ref<string | null>(null);

const dateRange = ref<string[]>([]);
const searchForm = reactive({
  interviewerId: '',
  status: '',
});

const createForm = reactive({
  interviewerId: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  notes: '',
  status: ScheduleStatus.AVAILABLE,
});

const batchForm = reactive({
  interviewerId: '',
  startDate: '',
  endDate: '',
  weekdays: [1, 2, 3, 4, 5],
  timeSlots: [
    '09:00-10:00',
    '10:30-11:30',
    '14:00-15:00',
    '15:30-16:30',
  ] as string[],
  location: '',
});

const createRules: FormRules = {
  interviewerId: [{ required: true, message: '请选择讲师', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
};

const batchRules: FormRules = {
  interviewerId: [{ required: true, message: '请选择讲师', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  weekdays: [{ required: true, message: '请选择星期', trigger: 'change' }],
  timeSlots: [{ required: true, message: '请添加时间段', trigger: 'change' }],
};

const scheduleStats = computed(() => {
  const total = schedules.value.length;
  const used = schedules.value.filter(s => s.status === 'booked').length;
  const rate = total > 0 ? Math.round((used / total) * 100) : 0;
  const warning = rate >= 80 ? used : 0;
  return { total, used, rate, warning };
});

function getStatusType(status: string) {
  const map: Record<string, string> = {
    available: 'success',
    booked: 'warning',
    unavailable: 'info',
  };
  return map[status] || 'info';
}

function addTimeSlot() {
  batchForm.timeSlots.push('');
}

function removeTimeSlot(index: number) {
  batchForm.timeSlots.splice(index, 1);
}

async function fetchInterviewers() {
  try {
    const result = await usersApi.getInterviewers();
    interviewers.value = result;
  } catch (e) {
    console.error('Failed to fetch interviewers:', e);
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: 'date',
      sortOrder: 'desc',
    };
    if (searchForm.interviewerId) params.interviewerId = searchForm.interviewerId;
    if (searchForm.status) params.status = searchForm.status;
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }

    const result = await schedulesApi.getSchedules(params);
    schedules.value = result.data;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  fetchData();
}

function handleReset() {
  dateRange.value = [];
  searchForm.interviewerId = '';
  searchForm.status = '';
  handleSearch();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  fetchData();
}

function handleCurrentChange(page: number) {
  currentPage.value = page;
  fetchData();
}

function handleEdit(row: Schedule) {
  editingId.value = row._id;
  createForm.interviewerId = row.interviewerId._id;
  createForm.date = row.date;
  createForm.startTime = row.startTime;
  createForm.endTime = row.endTime;
  createForm.location = row.location || '';
  createForm.notes = row.notes || '';
  showCreateDialog.value = true;
}

async function handleCreate() {
  if (!createFormRef.value) return;
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        if (editingId.value) {
          await schedulesApi.updateSchedule(editingId.value, createForm);
          ElMessage.success('更新成功');
        } else {
          await schedulesApi.createSchedule(createForm);
          ElMessage.success('创建成功');
        }
        showCreateDialog.value = false;
        editingId.value = null;
        Object.assign(createForm, {
          interviewerId: '',
          date: '',
          startTime: '',
          endTime: '',
          location: '',
          notes: '',
          status: ScheduleStatus.AVAILABLE,
        });
        await fetchData();
      } catch (e: any) {
        ElMessage.error(e.response?.data?.message || '操作失败');
      } finally {
        submitting.value = false;
      }
    }
  });
}

async function handleBatchCreate() {
  if (!batchFormRef.value) return;
  await batchFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        await schedulesApi.createScheduleBatch(batchForm);
        ElMessage.success('批量创建成功');
        showBatchDialog.value = false;
        await fetchData();
      } catch (e: any) {
        ElMessage.error(e.response?.data?.message || '操作失败');
      } finally {
        submitting.value = false;
      }
    }
  });
}

async function handleDelete(row: Schedule) {
  ElMessageBox.confirm('确定要删除这个档期吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await schedulesApi.deleteSchedule(row._id);
      ElMessage.success('删除成功');
      await fetchData();
    } catch (e: any) {
      ElMessage.error(e.response?.data?.message || '删除失败');
    }
  }).catch(() => {});
}

onMounted(() => {
  fetchInterviewers();
  fetchData();
});
</script>

<style scoped>
.schedule-list {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.page-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.time-slot-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>
