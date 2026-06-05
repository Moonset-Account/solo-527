<template>
  <div class="inspection">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="never" class="mb-20">
          <template #header>
            <span>巡检打卡</span>
          </template>
          <el-form :model="checkinForm" label-width="100px">
            <el-form-item label="巡检点">
              <el-select v-model="checkinForm.pointId" placeholder="请选择巡检点" style="width: 100%;">
                <el-option v-for="point in pointList" :key="point.id" :label="point.pointName + ' - ' + point.location" :value="point.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="检查状态">
              <el-radio-group v-model="checkinForm.status">
                <el-radio value="NORMAL">正常</el-radio>
                <el-radio value="ABNORMAL">异常</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="异常描述" v-if="checkinForm.status === 'ABNORMAL'">
              <el-input v-model="checkinForm.abnormalDescription" type="textarea" :rows="3" placeholder="请描述异常情况" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleCheckin" :loading="loading">
                <el-icon><Location /></el-icon>
                打卡
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>巡检记录</span>
          </template>
          <el-table :data="recordList" v-loading="loading">
            <el-table-column prop="pointName" label="巡检点" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'NORMAL' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'NORMAL' ? '正常' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="inspectorName" label="巡检人" width="100" />
            <el-table-column prop="checkTime" label="检查时间" width="160" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mt-20">
      <template #header>
        <span>巡检点列表</span>
      </template>
      <el-table :data="pointList">
        <el-table-column prop="pointCode" label="编号" width="120" />
        <el-table-column prop="pointName" label="名称" width="150" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag type="success" size="small">启用</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { checkIn, getRecordPage, getPointPage } from '@/api/inspection'

const loading = ref(false)
const recordList = ref([])
const pointList = ref([])

const checkinForm = reactive({
  pointId: null,
  status: 'NORMAL',
  abnormalDescription: ''
})

async function handleCheckin() {
  if (!checkinForm.pointId) {
    ElMessage.warning('请选择巡检点')
    return
  }
  loading.value = true
  try {
    await checkIn(checkinForm.pointId, checkinForm.status, checkinForm.abnormalDescription, null, null)
    ElMessage.success('打卡成功')
    loadRecords()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadRecords() {
  try {
    const res = await getRecordPage({ page: 1, size: 10 })
    recordList.value = res.data.records
  } catch (e) {
    console.error(e)
  }
}

async function loadPoints() {
  try {
    const res = await getPointPage({ page: 1, size: 50 })
    pointList.value = res.data.records
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadRecords()
  loadPoints()
})
</script>
