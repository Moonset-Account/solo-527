<template>
  <div class="page-container">
    <div class="page-header">
      <h2>通行异常记录</h2>
      <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon> 录入异常</el-button>
    </div>
    <div class="filter-bar">
      <el-select v-model="filters.type" placeholder="异常类型" clearable @change="loadData" style="width:150px;">
        <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="filters.status" placeholder="处理状态" clearable @change="loadData" style="width:140px;">
        <el-option v-for="(v, k) in statusLabels" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="filters.severity" placeholder="严重程度" clearable @change="loadData" style="width:140px;">
        <el-option v-for="(v, k) in severityLabels" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="filters.configStatus" placeholder="配置状态" clearable @change="loadData" style="width:140px;">
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
        <el-option label="草稿" value="draft" />
      </el-select>
    </div>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="recordNo" label="记录编号" width="160" />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small">{{ typeLabels[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="严重" width="90">
          <template #default="{ row }">
            <el-tag :type="severityTag[row.severity]" size="small" effect="dark">{{ severityLabels[row.severity] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag[row.status]" size="small" effect="dark">{{ statusLabels[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="occurrenceTime" label="发生时间" width="170" />
        <el-table-column prop="location" label="位置" width="120" />
        <el-table-column prop="impactScope" label="影响范围" min-width="140" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
        <el-table-column prop="currentOwner.realName" label="责任人" width="100" />
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
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openView(row)">详情/处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination :current-page="page" :page-size="limit" :total="total" layout="total, prev, pager, next" @current-change="handlePage" />
      </div>
    </el-card>
    <el-dialog v-model="showForm" :title="editId ? '处理异常记录' : '录入异常'" width="640px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="异常类型" required>
          <el-select v-model="form.type" style="width:100%;">
            <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select v-model="form.severity" style="width:100%;">
            <el-option v-for="(v, k) in severityLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态" v-if="editId">
          <el-select v-model="form.status" style="width:100%;">
            <el-option v-for="(v, k) in statusLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="发生时间" required>
          <el-date-picker v-model="form.occurrenceTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%;" />
        </el-form-item>
        <el-form-item label="位置" required><el-input v-model="form.location" /></el-form-item>
        <el-form-item label="设备ID"><el-input v-model="form.deviceId" /></el-form-item>
        <el-form-item label="涉及人员"><el-input v-model="form.personName" /></el-form-item>
        <el-form-item label="卡号"><el-input v-model="form.personCardNo" /></el-form-item>
        <el-form-item label="影响范围" required>
          <el-input type="textarea" v-model="form.impactScope" placeholder="如:影响 A栋1-3楼居民通行" :rows="2" />
        </el-form-item>
        <el-form-item label="描述" required>
          <el-input type="textarea" v-model="form.description" :rows="3" />
        </el-form-item>
        <el-form-item label="当前责任人">
          <el-input v-model="form.currentOwner" placeholder="责任人ID或姓名" />
        </el-form-item>
        <el-form-item label="处理说明" v-if="editId">
          <el-input type="textarea" v-model="form.processContent" placeholder="填写处理说明，将记录操作人和时间" :rows="3" />
        </el-form-item>
        <el-form-item label="最终解决方案" v-if="editId">
          <el-input type="textarea" v-model="form.resolution" :rows="2" />
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
import { getAccessExceptions, createAccessException, updateAccessException, updateExceptionConfigStatus } from '@/api/config';
import type { AccessException } from '@/types';

const loading = ref(false);
const list = ref<AccessException[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const filters = reactive({ type: '', status: '', severity: '', configStatus: '' });

const typeLabels: Record<string, string> = { access_denied: '拒绝通行', tailgating: '尾随', invalid_card: '无效卡', after_hours: '非工作时段', stranger: '陌生人', other: '其他' };
const severityLabels: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' };
const severityTag: Record<string, any> = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' };
const statusLabels: Record<string, string> = { open: '待处理', handling: '处理中', resolved: '已解决', closed: '已关闭' };
const statusTag: Record<string, any> = { open: 'danger', handling: 'warning', resolved: 'success', closed: 'info' };
const configLabels: Record<string, string> = { enabled: '启用', disabled: '停用', draft: '草稿' };
const configTag: Record<string, any> = { enabled: 'success', disabled: 'info', draft: 'warning' };

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getAccessExceptions({ page: page.value, limit: limit.value, ...filters });
    list.value = res.data || [];
    total.value = res.total || 0;
  } finally { loading.value = false; }
}
function handlePage(p: number) { page.value = p; loadData(); }
onMounted(loadData);

const showForm = ref(false);
const editId = ref('');
const form = reactive<any>({ type: 'other', severity: 'medium', occurrenceTime: '', location: '', deviceId: '', personName: '', personCardNo: '', impactScope: '', description: '', currentOwner: '', status: 'open', processContent: '', resolution: '' });
function openCreate() {
  Object.assign(form, { type: 'other', severity: 'medium', occurrenceTime: new Date().toISOString().slice(0, 16).replace('T', ' '), location: '', deviceId: '', personName: '', personCardNo: '', impactScope: '', description: '', currentOwner: '', status: 'open', processContent: '', resolution: '' });
  editId.value = '';
  showForm.value = true;
}
function openView(row: AccessException) {
  Object.assign(form, row);
  editId.value = row._id;
  showForm.value = true;
}
async function handleSubmit() {
  if (!form.type || !form.occurrenceTime || !form.location || !form.impactScope || !form.description) {
    ElMessage.warning('请填写必填项(异常类型/发生时间/位置/影响范围/描述)');
    return;
  }
  try {
    if (editId.value) {
      await updateAccessException(editId.value, form);
      ElMessage.success('更新成功,处理日志已记录操作人');
    } else {
      await createAccessException(form);
      ElMessage.success('录入成功');
    }
    showForm.value = false;
    loadData();
  } catch (_) {}
}
async function handleConfigStatus(row: AccessException, s: string) {
  try {
    await updateExceptionConfigStatus(row._id, s);
    ElMessage.success(`已切换为${configLabels[s]}`);
    loadData();
  } catch (_) {}
}
</script>
