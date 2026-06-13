<template>
  <AppLayout title="线索管理">
    <div class="leads-page">
      <el-card shadow="never" class="filter-card" :body-style="{ padding: '16px 20px' }">
        <div class="filter-block">
          <div class="filter-header">
            <div class="title">
              <el-icon color="#2563eb"><Filter /></el-icon>
              <span>筛选条件</span>
              <el-tag size="small" type="info" effect="plain">支持：时间段 / 状态 / 责任人</el-tag>
            </div>
            <div class="header-actions">
              <el-button type="primary" @click="router.visit(route('leads.create'))">
                <el-icon><Plus /></el-icon>快速录入咨询
              </el-button>
              <el-dropdown trigger="click">
                <el-button>
                  <el-icon><MoreFilled /></el-icon>更多操作
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="exportLeads">
                      <el-icon><Download /></el-icon>导出筛选结果
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="filter-row">
            <div class="filter-item date-range">
              <span class="item-label">创建时间：</span>
              <el-date-picker
                v-model="filters.start_date"
                type="date"
                placeholder="开始日期"
                value-format="YYYY-MM-DD"
                size="default"
                clearable
                @change="search"
              />
              <span class="sep">至</span>
              <el-date-picker
                v-model="filters.end_date"
                type="date"
                placeholder="结束日期"
                value-format="YYYY-MM-DD"
                size="default"
                clearable
                @change="search"
              />
            </div>

            <div class="filter-item">
              <span class="item-label">状态：</span>
              <el-select
                v-model="filters.status"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="全部状态"
                size="default"
                style="min-width: 220px"
                clearable
                @change="search"
              >
                <el-option
                  v-for="s in leadStatuses"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </div>

            <div class="filter-item">
              <span class="item-label">来源：</span>
              <el-select
                v-model="filters.source"
                multiple
                collapse-tags
                placeholder="全部来源"
                size="default"
                style="min-width: 220px"
                clearable
                @change="search"
              >
                <el-option
                  v-for="s in leadSources"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </div>
          </div>

          <div class="filter-row">
            <div class="filter-item">
              <span class="item-label">质量：</span>
              <el-radio-group v-model="filters.quality" size="default" @change="search">
                <el-radio-button value="">全部</el-radio-button>
                <el-radio-button
                  v-for="q in leadQualities"
                  :key="q.value"
                  :value="q.value"
                >{{ q.label.split(' ')[0] }}</el-radio-button>
              </el-radio-group>
            </div>

            <div class="filter-item">
              <span class="item-label">责任人：</span>
              <el-select
                v-model="filters.assignee_id"
                placeholder="全部责任人"
                size="default"
                style="width: 160px"
                clearable
                @change="search"
              >
                <el-option v-for="o in operators" :key="o.id" :label="o.name" :value="o.id" />
              </el-select>
            </div>

            <div class="filter-item">
              <span class="item-label">公海：</span>
              <el-radio-group v-model="oceanRadio" size="default" @change="onOceanChange">
                <el-radio-button value="">全部</el-radio-button>
                <el-radio-button :value="1">仅公海</el-radio-button>
                <el-radio-button :value="0">仅私有</el-radio-button>
              </el-radio-group>
            </div>

            <div class="filter-item grow">
              <el-input
                v-model="filters.search"
                placeholder="搜索客户姓名/电话/意向"
                clearable
                size="default"
                @keyup.enter="search"
                @clear="search"
              >
                <template #prefix><el-icon><Search /></el-icon></template>
                <template #append>
                  <el-button @click="search"><el-icon><Search /></el-icon></el-button>
                </template>
              </el-input>
            </div>

            <div class="filter-item">
              <el-button size="default" @click="reset">
                <el-icon><Refresh /></el-icon>重置
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="batch-card" v-if="selectedLeads.length || batchErrors.length">
        <div class="batch-bar">
          <div class="left">
            <el-checkbox
              v-model="allSelected"
              :indeterminate="isIndeterminate"
              @change="toggleAll"
            >已选 {{ selectedLeads.length }} / {{ pagination.total }} 条</el-checkbox>
            <el-tag type="primary" effect="plain" size="small">
              可批量：修改状态、分配责任人、流入/回收公海、调整质量
            </el-tag>
          </div>
          <div class="right">
            <el-select
              v-model="batchOp"
              placeholder="选择批量操作"
              size="small"
              style="width: 180px"
            >
              <el-option-group label="状态">
                <el-option label="修改线索状态" value="assign_status" />
              </el-option-group>
              <el-option-group label="分配">
                <el-option label="分配责任人" value="assign_owner" />
                <el-option label="批量流入公海" value="move_to_ocean" />
                <el-option label="从公海回收" value="reclaim_from_ocean" />
              </el-option-group>
              <el-option-group label="质量">
                <el-option label="调整线索质量" value="update_quality" />
              </el-option-group>
            </el-select>

            <template v-if="batchOp === 'assign_status'">
              <el-select v-model="batchParams.status" placeholder="目标状态" size="small" style="width: 140px">
                <el-option
                  v-for="s in leadStatuses"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
              <el-input
                v-if="batchParams.status === 'contract_pending'"
                v-model="batchParams.contract_pending_explanation"
                placeholder="填写合同待确认说明"
                size="small"
                style="width: 240px"
              />
              <el-input-number
                v-if="batchParams.status === 'signed'"
                v-model="batchParams.contract_amount"
                :min="0"
                :step="1000"
                placeholder="合同金额"
                size="small"
                controls-position="right"
              />
            </template>

            <el-select
              v-else-if="batchOp === 'assign_owner' || batchOp === 'reclaim_from_ocean'"
              v-model="batchParams.assignee_id"
              placeholder="指定责任人"
              size="small"
              style="width: 140px"
              clearable
            >
              <el-option v-for="o in operators" :key="o.id" :label="o.name" :value="o.id" />
            </el-select>

            <el-select
              v-else-if="batchOp === 'update_quality'"
              v-model="batchParams.quality"
              placeholder="目标质量"
              size="small"
              style="width: 120px"
            >
              <el-option
                v-for="q in leadQualities"
                :key="q.value"
                :label="q.label"
                :value="q.value"
              />
            </el-select>

            <el-button type="warning" size="small" @click="doValidate" :disabled="!batchOp || !selectedLeads.length">
              <el-icon><Warning /></el-icon>先校验
            </el-button>
            <el-button type="primary" size="small" @click="doProcess(false)" :disabled="!batchOp || !selectedLeads.length">
              <el-icon><CircleCheck /></el-icon>执行
            </el-button>
            <el-button type="danger" size="small" :disabled="!batchOp || !selectedLeads.length" @click="doProcess(true)">
              <el-icon><Lightning /></el-icon>强制执行
            </el-button>
            <el-button size="small" @click="clearSelection">清空</el-button>
          </div>
        </div>
        <div v-if="batchValidationResult" class="validate-result">
          <div class="result-summary">
            <el-statistic title="总数" :value="batchValidationResult.summary.total" />
            <el-statistic title="通过" :value="batchValidationResult.summary.passed" value-color="#16a34a" />
            <el-statistic title="失败" :value="batchValidationResult.summary.failed" value-color="#dc2626" />
          </div>
          <div class="result-columns">
            <div class="result-col passed-col">
              <div class="col-header">
                <el-icon color="#16a34a"><CircleCheckFilled /></el-icon>
                <span>通过明细 ({{ batchValidationResult.summary.passed }})</span>
              </div>
              <div class="passed-list">
                <div
                  v-for="(p, i) in batchValidationResult.passed?.slice(0, 30)"
                  :key="i"
                  class="passed-item"
                >
                  <span class="badge ok">#{{ p.index + 1 }}</span>
                  <span class="who">{{ p.lead_name || `ID:${p.lead_id}` }} {{ p.lead_phone || '' }}</span>
                  <span class="muted">当前：{{ p.current_status || '-' }}</span>
                </div>
                <div v-if="batchValidationResult.passed?.length > 30" class="more">
                  ...还有 {{ batchValidationResult.passed.length - 30 }} 条未显示
                </div>
                <el-empty v-if="!batchValidationResult.passed?.length" description="无通过项" :image-size="60" />
              </div>
            </div>
            <div class="result-col failures-col">
              <div class="col-header">
                <el-icon color="#dc2626"><WarningFilled /></el-icon>
                <span>失败原因 ({{ batchValidationResult.summary.failed }})</span>
              </div>
              <div class="failures-list">
                <div
                  v-for="(f, i) in batchValidationResult.failures?.slice(0, 30)"
                  :key="i"
                  class="failure-item"
                >
                  <span class="badge err">#{{ f.index + 1 }}</span>
                  <span class="who">{{ f.lead_name || `ID:${f.lead_id}` }} {{ f.lead_phone || '' }}</span>
                  <div class="reasons">
                    <el-tag
                      v-for="(r, ri) in (f.reasons || [f.reason]).filter(Boolean)"
                      :key="ri"
                      size="small"
                      type="danger"
                      effect="light"
                      class="reason-tag"
                    >{{ r }}</el-tag>
                  </div>
                </div>
                <div v-if="batchValidationResult.failures?.length > 30" class="more">
                  ...还有 {{ batchValidationResult.failures.length - 30 }} 条未显示
                </div>
                <el-empty v-if="!batchValidationResult.failures?.length" description="全部通过，无失败项" :image-size="60" />
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="list-card">
        <el-table
          :data="tableData"
          stripe
          border
          size="default"
          @selection-change="onSelectionChange"
          v-loading="false"
        >
          <el-table-column type="selection" width="44" align="center" reserve-selection />
          <el-table-column label="客户" width="160" fixed="left">
            <template #default="{ row }">
              <div class="client-cell">
                <div class="name-row">
                  <span class="name">{{ row.name }}</span>
                  <el-tag size="small" :type="qualityTag(row.quality)" effect="light" class="q-tag">
                    {{ row.quality }}
                  </el-tag>
                </div>
                <div class="sub">
                  <span>{{ row.phone }}</span>
                  <span class="sep">·</span>
                  <span>{{ row.gender_label }} {{ row.age ? row.age + '岁' : '' }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="来源" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info" effect="plain">{{ row.source_label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="statusTag(row.status)">{{ row.status_label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="责任人" width="100" align="center">
            <template #default="{ row }">
              <span v-if="row.assignee_name">{{ row.assignee_name }}</span>
              <el-tag v-else size="small" type="warning" effect="plain">未分配</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="报价版本" width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.quote_version">{{ row.quote_version }}</span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="合同金额" width="120" align="right">
            <template #default="{ row }">
              <span v-if="row.contract_amount" class="amount">¥ {{ row.contract_amount.toLocaleString() }}</span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="下次跟进" width="150" align="center">
            <template #default="{ row }">
              <span v-if="row.next_follow_at" :class="isOverdue(row.next_follow_at) ? 'overdue' : ''">
                {{ row.next_follow_at.slice(0, 16) }}
              </span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="公海" width="60" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.is_in_ocean" color="#ef4444"><WarningFilled /></el-icon>
              <el-icon v-else color="#10b981"><CircleCheckFilled /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="150" align="center">
            <template #default="{ row }">{{ row.created_at?.slice(0, 16) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="130" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="router.visit(`/leads/${row.id}`)">详情</el-button>
              <el-button link type="success" size="small" @click="router.visit(`/leads/${row.id}/edit`)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-row">
          <div class="info">
            共 <b>{{ pagination.total }}</b> 条，第 {{ pagination.from ?? 0 }} - {{ pagination.to ?? 0 }} 条
          </div>
          <el-pagination
            background
            layout="sizes, prev, pager, next, jumper"
            :current-page="pagination.current_page"
            :page-size="pagination.per_page"
            :page-sizes="[25, 50, 100, 200]"
            :total="pagination.total"
            @size-change="onSizeChange"
            @current-change="onPageChange"
          />
        </div>
      </el-card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout.vue';
import route from '@/utils/route';

const page = usePage<any>();

const leadStatuses = computed<SelectOption[]>(() => page.props.leadStatuses || []);
const leadSources = computed<SelectOption[]>(() => page.props.leadSources || []);
const leadQualities = computed<SelectOption[]>(() => page.props.leadQualities || []);
const operators = computed<any[]>(() => page.props.operators || []);
const tableData = computed<any[]>(() => page.props.leads?.data || []);
const pagination = computed<any>(() => page.props.leads || { current_page: 1, per_page: 25, total: 0 });

const defaultFilters = {
  start_date: null as any,
  end_date: null as any,
  status: [] as string[],
  quality: '',
  source: [] as string[],
  assignee_id: null as any,
  owner_id: null as any,
  search: '',
  is_in_ocean: null as any,
  per_page: 25,
};
const filters = reactive<any>({ ...defaultFilters, ...(page.props.filters || {}) });
const oceanRadio = ref<any>(filters.is_in_ocean === true ? 1 : filters.is_in_ocean === false ? 0 : '');

const selectedLeads = ref<number[]>([]);
const allSelected = ref(false);
const isIndeterminate = ref(false);
const batchOp = ref('');
const batchParams = reactive<any>({});
const batchErrors = ref<any[]>([]);
const batchValidationResult = ref<any>(null);

watch(oceanRadio, (v) => {
  filters.is_in_ocean = v === '' ? null : !!v;
});
const onOceanChange = () => {
  oceanRadio.value = oceanRadio.value;
  search();
};

const search = () => {
  router.get('/leads', { ...filters }, { preserveState: true, replace: true });
};
const reset = () => {
  Object.assign(filters, defaultFilters);
  oceanRadio.value = '';
  search();
};
const onSizeChange = (s: number) => { filters.per_page = s; search(); };
const onPageChange = (p: number) => {
  const q: any = { ...filters, page: p };
  router.get('/leads', q, { preserveState: true, replace: true });
};

const qualityTag = (q: string) => ({ A: 'danger', B: 'warning', C: 'success', D: 'info' } as any)[q] || 'info';
const statusTag = (s: string) => {
  const m: Record<string, any> = {
    new: 'info', contacted: '', consulting: 'primary', quoted: 'warning',
    contract_pending: 'warning', signed: 'success', treatment: 'success',
    completed: 'success', lost: 'danger', ocean: 'danger',
  };
  return m[s] || 'info';
};
const isOverdue = (t: string) => new Date(t).getTime() < Date.now();

const onSelectionChange = (rows: any[]) => {
  selectedLeads.value = rows.map(r => r.id);
  const total = pagination.value.total;
  if (rows.length === 0) {
    allSelected.value = false;
    isIndeterminate.value = false;
  } else if (rows.length === total) {
    allSelected.value = true;
    isIndeterminate.value = false;
  } else {
    allSelected.value = false;
    isIndeterminate.value = true;
  }
};
const toggleAll = (val: boolean) => {
  isIndeterminate.value = false;
  if (val) {
    selectedLeads.value = tableData.value.map(r => r.id);
  } else {
    selectedLeads.value = [];
  }
};
const clearSelection = () => {
  selectedLeads.value = [];
  batchOp.value = '';
  Object.keys(batchParams).forEach(k => delete batchParams[k]);
  batchValidationResult.value = null;
  batchErrors.value = [];
};

const doValidate = async () => {
  if (!selectedLeads.value.length) { ElMessage.warning('请先选择线索'); return; }
  if (!batchOp.value) { ElMessage.warning('请选择批量操作'); return; }
  try {
    const { data } = await axios.post(route('batch.validate'), {
      operation: batchOp.value,
      lead_ids: selectedLeads.value,
      params: { ...batchParams },
    }, {
      headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-Inertia': 'false' },
    });
    batchValidationResult.value = data;
    ElMessage.success(`校验完成：通过 ${data.summary.passed}，失败 ${data.summary.failed}`);
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '校验失败');
  }
};

const doProcess = async (force: boolean) => {
  if (!selectedLeads.value.length) { ElMessage.warning('请先选择线索'); return; }
  if (!batchOp.value) { ElMessage.warning('请选择批量操作'); return; }
  const msg = force
    ? `确认强制执行【${batchOp.value}】操作？强制执行将跳过校验，失败的线索会保留错误原因。`
    : `确认执行【${batchOp.value}】操作？共 ${selectedLeads.value.length} 条线索。`;
  try {
    await ElMessageBox.confirm(msg, '确认批量操作', { type: force ? 'warning' : 'info' });
    const { data } = await axios.post(route('batch.process'), {
      operation: batchOp.value,
      lead_ids: selectedLeads.value,
      params: { ...batchParams },
      force,
    }, {
      headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-Inertia': 'false' },
    });
    if (data?.results) {
      const r = data.results;
      if (r.failed && r.failed > 0) {
        batchErrors.value = r.failures;
        batchValidationResult.value = { summary: r, failures: r.failures, passed: r.success_ids };
        ElMessage.warning(`部分成功 ${r.success}，失败 ${r.failed}，请查看下方错误原因`);
      } else {
        ElMessage.success(data.message || `成功处理 ${r.success} 条`);
        clearSelection();
      }
    } else {
      ElMessage.success(data?.message || '处理完成');
      clearSelection();
    }
    router.reload({ only: ['leads'], preserveState: true });
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'confirm') {
      const errMsg = e?.response?.data?.error || e?.response?.data?.message || e?.message || '执行失败';
      ElMessage.error(errMsg);
    }
  }
};

const exportLeads = () => {
  const p: any = { ...filters };
  delete p.per_page;
  const params = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v === null || v === undefined || v === '') return;
    if (Array.isArray(v)) v.forEach(item => params.append(`${k}[]`, item as any));
    else params.append(k, v as any);
  });
  window.open(`/exports/leads?${params.toString()}`, '_blank');
};
</script>

<style scoped>
.leads-page { display: flex; flex-direction: column; gap: 16px; }
.filter-block { display: flex; flex-direction: column; gap: 14px; }
.filter-header { display: flex; align-items: center; justify-content: space-between; }
.filter-header .title { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #1f2937; font-size: 15px; }
.header-actions { display: flex; gap: 10px; }
.filter-row { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.filter-item.grow { flex: 1; min-width: 260px; }
.item-label { color: #374151; font-size: 13px; white-space: nowrap; }
.sep { color: #9ca3af; }
.date-range { flex-wrap: nowrap; }
.batch-card { background: #fffbeb; }
.batch-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.batch-bar .left, .batch-bar .right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.validate-result { margin-top: 12px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 16px; background: #fafafa; }
.result-summary { display: flex; gap: 40px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
.result-columns { display: flex; gap: 16px; }
.result-col { flex: 1; min-width: 0; }
.result-col .col-header { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #d1d5db; }
.passed-col { border-right: 1px solid #e5e7eb; padding-right: 16px; }
.failures-col { padding-left: 4px; }
.passed-list, .failures-list { display: flex; flex-direction: column; gap: 5px; max-height: 340px; overflow-y: auto; }
.passed-item, .failure-item { display: flex; align-items: center; gap: 10px; font-size: 12px; padding: 5px 8px; border-radius: 4px; }
.passed-item { background: #f0fdf4; }
.failure-item { background: #fef2f2; }
.passed-item .badge.ok { background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 3px; font-weight: 600; }
.failure-item .badge.err { background: #fecaca; color: #991b1b; padding: 1px 6px; border-radius: 3px; font-weight: 600; }
.passed-item .who, .failure-item .who { color: #1f2937; min-width: 140px; font-weight: 500; }
.passed-item .muted { color: #6b7280; }
.failure-item .reasons { flex: 1; display: flex; gap: 4px; flex-wrap: wrap; }
.failure-item .reason-tag { max-width: 100%; }
.more { color: #6b7280; font-size: 12px; padding: 4px 0 0 40px; }
.client-cell { display: flex; flex-direction: column; gap: 4px; }
.name-row { display: flex; align-items: center; gap: 6px; }
.name { font-weight: 600; color: #111827; }
.q-tag { transform: scale(0.85); }
.sub { color: #6b7280; font-size: 12px; display: flex; gap: 4px; }
.sub .sep { color: #d1d5db; }
.amount { color: #1d4ed8; font-weight: 600; }
.overdue { color: #dc2626; font-weight: 500; }
.muted { color: #9ca3af; }
.pagination-row { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; }
.pagination-row .info { color: #6b7280; font-size: 13px; }
.pagination-row .info b { color: #111827; font-weight: 600; }
:deep(.el-table .el-table__body-wrapper) { overflow-x: auto; }
</style>
