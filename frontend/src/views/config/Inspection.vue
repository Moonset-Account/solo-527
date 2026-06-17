<template>
  <div class="page-container">
    <div class="page-header">
      <h2>巡检任务配置</h2>
      <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon> 新建巡检</el-button>
    </div>
    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="状态" clearable @change="loadData" style="width:140px;">
        <el-option label="待执行" value="pending" />
        <el-option label="执行中" value="in_progress" />
        <el-option label="已完成" value="completed" />
        <el-option label="异常" value="exception" />
      </el-select>
      <el-select v-model="filters.configStatus" placeholder="配置状态" clearable @change="loadData" style="width:140px;">
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
        <el-option label="草稿" value="draft" />
      </el-select>
      <el-input v-model="filters.area" placeholder="区域" clearable @keyup.enter="loadData" style="width:160px;" />
    </div>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="taskNo" label="任务编号" width="160" />
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column prop="area" label="区域" width="120" />
        <el-table-column prop="scheduledAt" label="计划时间" width="170" />
        <el-table-column prop="inspector.realName" label="巡检员" width="100" />
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
        <el-table-column prop="createdBy.realName" label="创建人" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openView(row)">详情/编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination :current-page="page" :page-size="limit" :total="total" layout="total, prev, pager, next" @current-change="handlePage" />
      </div>
    </el-card>
    <el-dialog v-model="showForm" :title="editId ? '编辑巡检任务' : '新建巡检任务'" width="640px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="标题" required><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="区域" required><el-input v-model="form.area" placeholder="如 A栋-1楼" /></el-form-item>
        <el-form-item label="计划时间" required>
          <el-date-picker v-model="form.scheduledAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%;" />
        </el-form-item>
        <el-form-item label="巡检员">
          <el-input v-model="form.inspector" placeholder="填入巡检员ID或姓名" />
        </el-form-item>
        <el-form-item label="状态" v-if="editId">
          <el-select v-model="form.status" style="width:100%;">
            <el-option v-for="(v, k) in statusLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="检查项">
          <div style="width:100%;">
            <div v-for="(it, idx) in form.checkItems" :key="idx" style="display:flex; gap:8px; margin-bottom:8px;">
              <el-input v-model="it.item" placeholder="检查项名称" style="width:180px;" />
              <el-select v-model="it.result" placeholder="结果" style="width:120px;">
                <el-option label="正常" value="正常" />
                <el-option label="异常" value="异常" />
                <el-option label="待检" value="待检" />
              </el-select>
              <el-input v-model="it.remark" placeholder="备注" style="flex:1;" />
              <el-button type="danger" link @click="form.checkItems.splice(idx, 1)">删</el-button>
            </div>
            <el-button size="small" type="primary" plain @click="addCheckItem">+ 添加检查项</el-button>
          </div>
        </el-form-item>
        <el-form-item label="结论"><el-input type="textarea" v-model="form.conclusion" :rows="2" /></el-form-item>
        <el-form-item label="配置状态" v-if="editId">
          <el-select v-model="form.configStatus" style="width:100%;">
            <el-option v-for="(v, k) in configLabels" :key="k" :label="v" :value="k" />
          </el-select>
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
import { getInspections, createInspection, updateInspection, updateInspectionConfigStatus } from '@/api/config';
import type { Inspection } from '@/types';

const loading = ref(false);
const list = ref<Inspection[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const filters = reactive({ status: '', configStatus: '', area: '' });

const statusLabels: Record<string, string> = { pending: '待执行', in_progress: '执行中', completed: '已完成', exception: '异常' };
const statusTag: Record<string, any> = { pending: 'warning', in_progress: 'primary', completed: 'success', exception: 'danger' };
const configLabels: Record<string, string> = { enabled: '启用', disabled: '停用', draft: '草稿' };
const configTag: Record<string, any> = { enabled: 'success', disabled: 'info', draft: 'warning' };

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getInspections({ page: page.value, limit: limit.value, ...filters });
    list.value = res.data || [];
    total.value = res.total || 0;
  } finally { loading.value = false; }
}
function handlePage(p: number) { page.value = p; loadData(); }
onMounted(loadData);

const showForm = ref(false);
const editId = ref('');
const form = reactive<any>({ title: '', area: '', scheduledAt: '', inspector: '', status: 'pending', checkItems: [], conclusion: '', configStatus: 'enabled' });
function addCheckItem() { form.checkItems.push({ item: '', result: '待检', remark: '' }); }
function openCreate() {
  Object.assign(form, { title: '', area: '', scheduledAt: '', inspector: '', status: 'pending', checkItems: [], conclusion: '', configStatus: 'enabled' });
  form.checkItems = [];
  addCheckItem();
  editId.value = '';
  showForm.value = true;
}
function openView(row: Inspection) {
  Object.assign(form, { ...row, checkItems: JSON.parse(JSON.stringify(row.checkItems || [])) });
  editId.value = row._id;
  showForm.value = true;
}
async function handleSubmit() {
  if (!form.title || !form.area || !form.scheduledAt) { ElMessage.warning('请填写必填项'); return; }
  try {
    if (editId.value) {
      await updateInspection(editId.value, form);
      ElMessage.success('更新成功,已记录操作人');
    } else {
      await createInspection(form);
      ElMessage.success('创建成功');
    }
    showForm.value = false;
    loadData();
  } catch (_) {}
}
async function handleConfigStatus(row: Inspection, s: string) {
  try {
    await updateInspectionConfigStatus(row._id, s);
    ElMessage.success(`已切换为${configLabels[s]}`);
    loadData();
  } catch (_) {}
}
</script>
