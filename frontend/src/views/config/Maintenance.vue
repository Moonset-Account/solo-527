<template>
  <div class="page-container">
    <div class="page-header">
      <h2>工程报修配置</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 新建报修单
      </el-button>
    </div>
    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="状态" clearable @change="loadData" style="width:140px;">
        <el-option label="待分配" value="pending" />
        <el-option label="已分配" value="assigned" />
        <el-option label="处理中" value="in_progress" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-select v-model="filters.configStatus" placeholder="配置状态" clearable @change="loadData" style="width:140px;">
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
        <el-option label="草稿" value="draft" />
      </el-select>
      <el-input v-model="filters.location" placeholder="地点" clearable @keyup.enter="loadData" style="width:160px;" />
    </div>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="报修单号" width="160" />
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="location" label="地点" width="120" />
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="priTag[row.priority]" size="small">{{ priLabels[row.priority] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag[row.status]" size="small" effect="dark">{{ statusLabels[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="配置状态" width="110">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(s) => handleConfigStatus(row, s)">
              <el-tag :type="configTag[row.configStatus]" size="small">{{ configLabels[row.configStatus] }}</el-tag>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="enabled">启用</el-dropdown-item>
                  <el-dropdown-item command="disabled">停用</el-dropdown-item>
                  <el-dropdown-item command="draft">草稿</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <el-table-column prop="reporterName" label="报修人" width="100" />
        <el-table-column prop="assignee.realName" label="处理人" width="100" />
        <el-table-column prop="createdBy.realName" label="录入人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openView(row)">详情/处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination :current-page="page" :page-size="limit" :total="total" layout="total, prev, pager, next" @current-change="handlePage" />
      </div>
    </el-card>
    <el-dialog v-model="showForm" :title="editId ? '处理报修单' : '新建报修单'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题" required><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="描述" required><el-input type="textarea" v-model="form.description" :rows="3" /></el-form-item>
        <el-form-item label="地点" required><el-input v-model="form.location" /></el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="form.priority" style="width:100%;">
            <el-option v-for="(v, k) in priLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" v-if="editId">
          <el-select v-model="form.status" style="width:100%;">
            <el-option v-for="(v, k) in statusLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="报修人"><el-input v-model="form.reporterName" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.reporterPhone" /></el-form-item>
        <el-form-item label="处理说明" v-if="editId">
          <el-input type="textarea" v-model="form.handleContent" placeholder="填写本次处理说明，将记录操作人" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaintenances, createMaintenance, updateMaintenance, updateMaintenanceConfigStatus } from '@/api/config';
import type { Maintenance } from '@/types';

const loading = ref(false);
const list = ref<Maintenance[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const filters = reactive({ status: '', configStatus: '', location: '' });

const priLabels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' };
const priTag: Record<string, any> = { low: 'info', medium: 'warning', high: 'danger', urgent: 'danger' };
const statusLabels: Record<string, string> = { pending: '待分配', assigned: '已分配', in_progress: '处理中', completed: '已完成', cancelled: '已取消' };
const statusTag: Record<string, any> = { pending: 'warning', assigned: 'primary', in_progress: '', completed: 'success', cancelled: 'info' };
const configLabels: Record<string, string> = { enabled: '启用', disabled: '停用', draft: '草稿' };
const configTag: Record<string, any> = { enabled: 'success', disabled: 'info', draft: 'warning' };

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getMaintenances({ page: page.value, limit: limit.value, ...filters });
    list.value = res.data || [];
    total.value = res.total || 0;
  } finally { loading.value = false; }
}
function handlePage(p: number) { page.value = p; loadData(); }
onMounted(loadData);

const showForm = ref(false);
const editId = ref('');
const form = reactive<any>({ title: '', description: '', location: '', priority: 'medium', reporterName: '', reporterPhone: '', status: 'pending', handleContent: '' });
function openCreate() {
  Object.assign(form, { title: '', description: '', location: '', priority: 'medium', reporterName: '', reporterPhone: '', status: 'pending', handleContent: '' });
  editId.value = '';
  showForm.value = true;
}
function openView(row: Maintenance) {
  Object.assign(form, { ...row, handleContent: '' });
  editId.value = row._id;
  showForm.value = true;
}
async function handleSubmit() {
  if (!form.title || !form.description || !form.location) { ElMessage.warning('请填写必填项'); return; }
  try {
    if (editId.value) {
      await updateMaintenance(editId.value, form);
      ElMessage.success('更新成功,处理日志已记录操作人');
    } else {
      await createMaintenance(form);
      ElMessage.success('创建成功');
    }
    showForm.value = false;
    loadData();
  } catch (_) {}
}
async function handleConfigStatus(row: Maintenance, s: string) {
  try {
    await updateMaintenanceConfigStatus(row._id, s);
    ElMessage.success(`已切换为${configLabels[s]}`);
    loadData();
  } catch (_) {}
}
</script>
