<template>
  <div class="page-container">
    <div class="page-header">
      <h2>系统配置 (支持灰度: 启用 / 停用 / 草稿)</h2>
      <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon> 新增配置</el-button>
    </div>
    <div class="filter-bar">
      <el-select v-model="filters.category" placeholder="分类" clearable @change="loadData" style="width:160px;">
        <el-option v-for="(v, k) in categoryLabels" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable @change="loadData" style="width:140px;">
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
        <el-option label="草稿" value="draft" />
      </el-select>
      <el-input v-model="filters.key" placeholder="配置key" clearable @keyup.enter="loadData" style="width:200px;" />
    </div>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="key" label="配置Key" width="220" />
        <el-table-column prop="name" label="名称" width="160" />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ categoryLabels[row.category] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前值" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <code style="background:#f5f7fa; padding:4px 8px; border-radius:4px;">
              {{ typeof row.value === 'object' ? JSON.stringify(row.value) : row.value }}
            </code>
          </template>
        </el-table-column>
        <el-table-column label="默认值" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <code style="background:#f5f7fa; padding:4px 8px; border-radius:4px; color:#909399;">
              {{ typeof row.defaultValue === 'object' ? JSON.stringify(row.defaultValue) : row.defaultValue }}
            </code>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(s) => handleStatus(row, s)">
              <el-tag :type="statusTag[row.status]" size="small" effect="dark">{{ statusLabels[row.status] }}</el-tag>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="enabled">启用 (生效)</el-dropdown-item>
                  <el-dropdown-item command="disabled">停用 (隐藏)</el-dropdown-item>
                  <el-dropdown-item command="draft">草稿 (灰度)</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="140" show-overflow-tooltip />
        <el-table-column prop="updatedBy.realName" label="修改人" width="100" />
        <el-table-column prop="updatedAt" label="修改时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="info" link @click="openLogs(row)">变更日志</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination :current-page="page" :page-size="limit" :total="total" layout="total, prev, pager, next" @current-change="handlePage" />
      </div>
    </el-card>
    <el-dialog v-model="showForm" :title="editId ? '编辑配置' : '新增配置'" width="560px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="配置Key" required><el-input v-model="form.key" :disabled="!!editId" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="form.category" style="width:100%;">
            <el-option v-for="(v, k) in categoryLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="值类型">
          <el-radio-group v-model="valueType">
            <el-radio label="string">字符串</el-radio>
            <el-radio label="number">数字</el-radio>
            <el-radio label="boolean">布尔</el-radio>
            <el-radio label="json">JSON</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="值" required>
          <el-input v-if="valueType === 'json'" type="textarea" v-model="form.value" :rows="3" placeholder='如: ["1","2"] 或 {"a":1}' />
          <el-switch v-else-if="valueType === 'boolean'" v-model="boolValue" />
          <el-input-number v-else-if="valueType === 'number'" v-model="numValue" :precision="4" style="width:100%;" />
          <el-input v-else v-model="form.value" />
        </el-form-item>
        <el-form-item label="默认值">
          <el-input v-model="form.defaultValue" placeholder="留空则与值相同" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%;">
            <el-option label="启用 (正式生效)" value="enabled" />
            <el-option label="停用 (不生效)" value="disabled" />
            <el-option label="草稿 (灰度中)" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明"><el-input type="textarea" v-model="form.description" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="showLogs" title="变更日志" width="640px">
      <el-timeline v-if="current?.changeLogs?.length">
        <el-timeline-item
          v-for="(log, idx) in current.changeLogs.slice().reverse()"
          :key="idx"
          :timestamp="log.date"
          :type="idx === 0 ? 'primary' : 'default'"
          size="large"
        >
          <div>
            <div>
              <b>{{ log.operator?.realName || '系统' }}</b> 修改
            </div>
            <div style="margin-top:8px;">
              <div style="color:#F56C6C;">
                旧值: {{ typeof log.from === 'object' ? JSON.stringify(log.from) : (log.from ?? '(空)') }}
              </div>
              <div style="color:#67C23A;">
                新值: {{ typeof log.to === 'object' ? JSON.stringify(log.to) : (log.to ?? '(空)') }}
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无变更日志" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getConfigs, createConfig, updateConfig, updateConfigStatus } from '@/api/config';
import type { ConfigItem } from '@/types';

const loading = ref(false);
const list = ref<ConfigItem[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const filters = reactive({ category: '', status: '', key: '' });

const categoryLabels: Record<string, string> = {
  billing: '账单配置', maintenance: '报修配置', inspection: '巡检配置',
  pricing: '价格配置', access: '通行配置', system: '系统配置',
};
const statusLabels: Record<string, string> = { enabled: '启用', disabled: '停用', draft: '草稿' };
const statusTag: Record<string, any> = { enabled: 'success', disabled: 'info', draft: 'warning' };

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getConfigs({ page: page.value, limit: limit.value, ...filters });
    list.value = res.data || [];
    total.value = res.total || 0;
  } finally { loading.value = false; }
}
function handlePage(p: number) { page.value = p; loadData(); }
onMounted(loadData);

const showForm = ref(false);
const editId = ref('');
const form = reactive<any>({ key: '', name: '', category: 'system', value: '', defaultValue: '', status: 'draft', description: '' });
const valueType = ref('string');
const boolValue = ref(false);
const numValue = ref(0);

watch(boolValue, v => { if (valueType.value === 'boolean') form.value = v; });
watch(numValue, v => { if (valueType.value === 'number') form.value = v; });

function openCreate() {
  Object.assign(form, { key: '', name: '', category: 'system', value: '', defaultValue: '', status: 'draft', description: '' });
  valueType.value = 'string';
  boolValue.value = false;
  numValue.value = 0;
  editId.value = '';
  showForm.value = true;
}
function openEdit(row: ConfigItem) {
  Object.assign(form, row);
  const v = row.value;
  if (typeof v === 'boolean') { valueType.value = 'boolean'; boolValue.value = v; }
  else if (typeof v === 'number') { valueType.value = 'number'; numValue.value = v; }
  else if (typeof v === 'object') { valueType.value = 'json'; form.value = JSON.stringify(v); }
  else { valueType.value = 'string'; }
  editId.value = row._id;
  showForm.value = true;
}
async function handleSubmit() {
  let finalValue = form.value;
  if (valueType.value === 'json') {
    try { finalValue = JSON.parse(form.value); } catch { ElMessage.error('JSON格式错误'); return; }
  }
  const payload = { ...form, value: finalValue };
  try {
    if (editId.value) {
      await updateConfig(editId.value, payload);
      ElMessage.success('更新成功,变更日志已记录');
    } else {
      if (!form.key || !form.name) { ElMessage.warning('请填写Key和名称'); return; }
      await createConfig(payload);
      ElMessage.success('创建成功');
    }
    showForm.value = false;
    loadData();
  } catch (_) {}
}
async function handleStatus(row: ConfigItem, s: string) {
  try {
    await updateConfigStatus(row._id, s);
    ElMessage.success(`已切换为${statusLabels[s]}, 灰度调整已生效`);
    loadData();
  } catch (_) {}
}

const showLogs = ref(false);
const current = ref<ConfigItem | null>(null);
function openLogs(row: ConfigItem) {
  current.value = row;
  showLogs.value = true;
}
</script>
