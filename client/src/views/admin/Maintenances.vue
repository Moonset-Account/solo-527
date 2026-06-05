<template>
  <div class="admin-maintenances">
    <div class="admin-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3>维修管理</h3>
        <div>
          <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 150px; margin-right: 10px;" @change="fetchData">
            <el-option label="全部" value="" />
            <el-option label="已申报" value="reported" />
            <el-option label="维修中" value="repairing" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-button type="primary" @click="fetchData">刷新</el-button>
        </div>
      </div>

      <el-table :data="maintenances" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="tool.name" label="工具" />
        <el-table-column prop="reporter.realName" label="申报人" />
        <el-table-column prop="description" label="问题描述" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="repairCost" label="维修费用" :formatter="formatCost" />
        <el-table-column prop="createdAt" label="申报时间" :formatter="formatTime" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'reported'" 
              type="primary" 
              size="small" 
              @click="startRepair(row.id)"
            >
              开始维修
            </el-button>
            <el-button 
              v-if="row.status === 'repairing'" 
              type="success" 
              size="small" 
              @click="completeRepair(row)"
            >
              完成维修
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showCompleteDialog" title="完成维修" width="500px">
      <el-form label-width="100px">
        <el-form-item label="维修备注">
          <el-input v-model="completeForm.repairNote" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="维修费用(元)">
          <el-input-number v-model="completeForm.repairCost" :min="0" :precision="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompleteDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确认完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { maintenanceAPI } from '@/api';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';

const maintenances = ref([]);
const filterStatus = ref('');
const showCompleteDialog = ref(false);
const currentMaintId = ref(null);
const completeForm = reactive({
  repairNote: '',
  repairCost: 0
});

const getStatusText = (s) => {
  const m = { reported: '已申报', repairing: '维修中', completed: '已完成', cancelled: '已取消' };
  return m[s] || s;
};
const getStatusType = (s) => {
  const m = { reported: 'warning', repairing: 'primary', completed: 'success', cancelled: 'info' };
  return m[s] || '';
};
const formatCost = (row, col, v) => v > 0 ? '¥' + v : '-';
const formatTime = (row, col, v) => dayjs(v).format('YYYY-MM-DD HH:mm');

const startRepair = async (id) => {
  try {
    await maintenanceAPI.updateMaintenanceStatus(id, { status: 'repairing' });
    ElMessage.success('已开始维修');
    fetchData();
  } catch (e) {}
};

const completeRepair = (row) => {
  currentMaintId.value = row.id;
  completeForm.repairNote = '';
  completeForm.repairCost = 0;
  showCompleteDialog.value = true;
};

const confirmComplete = async () => {
  try {
    await maintenanceAPI.updateMaintenanceStatus(currentMaintId.value, {
      status: 'completed',
      repairNote: completeForm.repairNote,
      repairCost: completeForm.repairCost
    });
    ElMessage.success('维修已完成');
    showCompleteDialog.value = false;
    fetchData();
  } catch (e) {}
};

const fetchData = async () => {
  try {
    const res = await maintenanceAPI.getAllMaintenances({ status: filterStatus.value || undefined });
    maintenances.value = res.maintenances;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchData();
});
</script>
