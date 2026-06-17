<template>
  <div class="page-container">
    <div class="page-header">
      <h2>生成收费账单</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="单个创建" name="single">
        <el-card>
          <el-form :model="form" label-width="120px" label-position="right" style="max-width: 700px;">
            <el-form-item label="费用类型" required>
              <el-select v-model="form.type" style="width: 100%;">
                <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="房间号" required><el-input v-model="form.roomNo" placeholder="如 A101" /></el-form-item>
            <el-form-item label="住户姓名" required><el-input v-model="form.residentName" /></el-form-item>
            <el-form-item label="联系电话"><el-input v-model="form.residentPhone" /></el-form-item>
            <el-form-item label="账期" required><el-input v-model="form.billingPeriod" placeholder="如 2025-06" /></el-form-item>
            <el-form-item label="金额 (元)" required>
              <el-input-number v-model="form.totalAmount" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="到期日" required>
              <el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="备注"><el-input type="textarea" v-model="form.remark" /></el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleCreate">创建账单</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="批量创建" name="batch">
        <el-card>
          <el-alert
            type="info"
            :closable="false"
            show-icon
            title="批量生成账单：可一次为多个房间生成同一账期同类型账单"
            style="margin-bottom: 20px;"
          />
          <el-form :model="batchForm" label-width="120px" style="max-width: 700px;">
            <el-form-item label="费用类型" required>
              <el-select v-model="batchForm.type" style="width: 100%;">
                <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="账期" required>
              <el-input v-model="batchForm.billingPeriod" placeholder="如 2025-06" />
            </el-form-item>
            <el-form-item label="到期日" required>
              <el-date-picker v-model="batchForm.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="房间列表" required>
              <div style="width: 100%;">
                <div v-for="(r, idx) in rooms" :key="idx" style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <el-input v-model="r.roomNo" placeholder="房间号" style="width: 140px;" />
                  <el-input v-model="r.residentName" placeholder="住户" style="width: 160px;" />
                  <el-input v-model="r.residentPhone" placeholder="电话(选填)" style="width: 160px;" />
                  <el-input-number v-model="r.totalAmount" :min="0" :precision="2" placeholder="金额" style="flex: 1;" />
                  <el-button type="danger" link @click="rooms.splice(idx, 1)">删除</el-button>
                </div>
                <el-button size="small" type="primary" plain @click="addRoom">+ 添加房间</el-button>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleBatchCreate">批量创建</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { createBill, createBatchBills } from '@/api/bill';

const router = useRouter();
const activeTab = ref('single');
const typeLabels: Record<string, string> = {
  rent: '租金', water: '水费', electricity: '电费', gas: '燃气费',
  network: '网费', property: '物业费', other: '其他',
};
const form = reactive<any>({ type: 'rent', roomNo: '', residentName: '', residentPhone: '', billingPeriod: '', totalAmount: 0, dueDate: '', remark: '' });
function resetForm() {
  Object.assign(form, { type: 'rent', roomNo: '', residentName: '', residentPhone: '', billingPeriod: '', totalAmount: 0, dueDate: '', remark: '' });
}
async function handleCreate() {
  if (!form.type || !form.roomNo || !form.residentName || !form.billingPeriod || !form.totalAmount || !form.dueDate) {
    ElMessage.warning('请填写必填项');
    return;
  }
  try {
    await createBill(form);
    ElMessage.success('账单创建成功');
    router.push('/bills');
  } catch (_) {}
}
const batchForm = reactive<any>({ type: 'rent', billingPeriod: '', dueDate: '' });
const rooms = ref<any[]>([{ roomNo: '', residentName: '', residentPhone: '', totalAmount: 0 }]);
function addRoom() {
  rooms.value.push({ roomNo: '', residentName: '', residentPhone: '', totalAmount: 0 });
}
async function handleBatchCreate() {
  const valid = rooms.value.filter(r => r.roomNo && r.residentName && r.totalAmount > 0);
  if (!batchForm.type || !batchForm.billingPeriod || !batchForm.dueDate || valid.length === 0) {
    ElMessage.warning('请填写必要信息并至少添加一条有效房间数据');
    return;
  }
  const data = valid.map(r => ({ ...r, type: batchForm.type, billingPeriod: batchForm.billingPeriod, dueDate: batchForm.dueDate }));
  try {
    await createBatchBills(data);
    ElMessage.success(`成功创建 ${data.length} 条账单`);
    router.push('/bills');
  } catch (_) {}
}
</script>
