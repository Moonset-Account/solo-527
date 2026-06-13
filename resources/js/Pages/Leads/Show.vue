<template>
  <AppLayout :title="`线索详情 - ${lead.name}`">
    <div class="lead-detail">
      <el-page-header @back="router.visit(route('leads.index'))" class="page-header">
        <template #content>
          <div class="header-row">
            <span class="title">线索详情</span>
            <el-tag size="small" :type="qualityTag(lead.quality)" effect="dark" class="q-tag">{{ lead.quality_label }}</el-tag>
            <el-tag size="small" :type="statusTag(lead.status)" effect="light" class="s-tag">{{ lead.status_label }}</el-tag>
            <el-tag size="small" type="info" effect="plain">{{ lead.source_label }}</el-tag>
            <el-tag v-if="lead.is_in_ocean" type="danger" size="small" effect="plain">公海中</el-tag>
          </div>
        </template>
        <template #extra>
          <el-button type="primary" size="small" @click="editVisible = true"><el-icon><Edit /></el-icon>编辑</el-button>
        </template>
      </el-page-header>

      <el-row :gutter="16">
        <el-col :span="16">
          <el-tabs v-model="activeTab" type="card" class="main-tabs">
            <el-tab-pane label="概览" name="overview">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-card shadow="never">
                    <template #header><div class="card-title"><el-icon><User /></el-icon>基本信息</div></template>
                    <el-descriptions :column="1" border size="default">
                      <el-descriptions-item label="客户姓名">{{ lead.name }}</el-descriptions-item>
                      <el-descriptions-item label="联系电话">{{ lead.phone }}</el-descriptions-item>
                      <el-descriptions-item label="性别 / 年龄">{{ lead.gender_label }} {{ lead.age ? lead.age + '岁' : '未填' }}</el-descriptions-item>
                      <el-descriptions-item label="来源渠道">{{ lead.source_label }}</el-descriptions-item>
                      <el-descriptions-item label="线索状态">{{ lead.status_label }}</el-descriptions-item>
                      <el-descriptions-item label="质量级别">{{ lead.quality_label }}</el-descriptions-item>
                      <el-descriptions-item label="预算区间">
                        <span v-if="lead.budget_min || lead.budget_max">
                          ¥ {{ lead.budget_min?.toLocaleString() ?? 0 }} - ¥ {{ lead.budget_max?.toLocaleString() ?? '∞' }}
                        </span>
                        <span v-else class="muted">未填</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="合同金额">
                        <span v-if="lead.contract_amount" class="amount">¥ {{ lead.contract_amount.toLocaleString() }}</span>
                        <span v-else class="muted">未签约</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="签约时间">
                        <span v-if="lead.signed_at">{{ lead.signed_at?.slice(0, 16) }}</span>
                        <span v-else class="muted">-</span>
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card shadow="never">
                    <template #header><div class="card-title"><el-icon><UserFilled /></el-icon>团队与流转</div></template>
                    <el-descriptions :column="1" border size="default">
                      <el-descriptions-item label="创建人">{{ lead.owner?.name || '未填' }}</el-descriptions-item>
                      <el-descriptions-item label="当前责任人">
                        <el-tag v-if="lead.assignee" type="primary" effect="plain">{{ lead.assignee.name }}</el-tag>
                        <el-tag v-else type="warning" effect="plain">未分配</el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="报价版本">{{ lead.quote_version?.version }} {{ lead.quote_version?.name || '未关联' }}</el-descriptions-item>
                      <el-descriptions-item label="流失原因">
                        <span v-if="lead.churn_reason">{{ lead.churn_reason.category }} / {{ lead.churn_reason.name }}</span>
                        <span v-else class="muted">未流失</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="合同待确认说明">
                        <span v-if="lead.contract_pending_explanation" style="color:#b45309">{{ lead.contract_pending_explanation }}</span>
                        <span v-else class="muted">无</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="下次跟进">
                        <span v-if="lead.next_follow_at" :class="isOverdue(lead.next_follow_at) ? 'overdue' : ''">
                          {{ lead.next_follow_at?.slice(0, 16) }}
                        </span>
                        <span v-else class="muted">未设定</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="最后跟进">
                        <span v-if="lead.last_follow_at">{{ lead.last_follow_at?.slice(0, 16) }}</span>
                        <span v-else class="muted">暂无记录</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="创建时间">{{ lead.created_at?.slice(0, 19) }}</el-descriptions-item>
                    </el-descriptions>
                  </el-card>
                </el-col>
                <el-col :span="24">
                  <el-card shadow="never" v-if="lead.intention">
                    <template #header><div class="card-title"><el-icon><Document /></el-icon>客户意向描述</div></template>
                    <div class="intention-text">{{ lead.intention }}</div>
                  </el-card>
                </el-col>
                <el-col :span="24" v-if="lead.quote_version?.items?.length">
                  <el-card shadow="never">
                    <template #header>
                      <div class="card-title">
                        <el-icon><Money /></el-icon>当前报价明细
                        <el-tag size="small" type="primary" effect="plain">{{ lead.quote_version.version }}</el-tag>
                      </div>
                    </template>
                    <el-table :data="flatQuoteItems" size="default" border>
                      <el-table-column prop="category" label="类别" width="140" />
                      <el-table-column prop="name" label="项目" min-width="200" />
                      <el-table-column prop="price" label="价格(元)" width="140" align="right">
                        <template #default="{ row }">¥ {{ Number(row.price).toLocaleString() }}</template>
                      </el-table-column>
                      <el-table-column prop="unit" label="单位" width="80" align="center" />
                      <el-table-column label="小计" width="120" align="right">
                        <template #default="{ row }">¥ {{ Number(row.price).toLocaleString() }}</template>
                      </el-table-column>
                    </el-table>
                    <div class="quote-total">
                      合计：<span>¥ {{ Number(lead.quote_version.grand_total ?? 0).toLocaleString() }}</span>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-tab-pane>

            <el-tab-pane :label="`咨询记录 (${lead.consultations?.length || 0})`" name="consultations">
              <el-card shadow="never" class="consult-card">
                <template #header>
                  <div class="card-title-actions">
                    <div class="card-title"><el-icon><ChatLineRound /></el-icon>历史咨询记录</div>
                    <el-button type="primary" size="small" @click="consultVisible = true">
                      <el-icon><Plus /></el-icon>新增咨询
                    </el-button>
                  </div>
                </template>
                <el-timeline v-if="lead.consultations?.length">
                  <el-timeline-item
                    v-for="(c, idx) in lead.consultations"
                    :key="c.id"
                    :timestamp="c.created_at?.slice(0, 19)"
                    :type="idx === 0 ? 'primary' : ''"
                    placement="top"
                    size="large"
                  >
                    <el-card shadow="never" class="consult-item">
                      <div class="consult-head">
                        <el-tag size="small" type="primary" effect="plain">{{ c.operator_name || '运营' }}</el-tag>
                        <el-tag v-if="c.quality" size="small" :type="qualityTag(c.quality)">
                          质量评估：{{ c.quality_label }}
                        </el-tag>
                        <el-tag v-if="c.next_follow_at" size="small" type="warning" effect="plain">
                          下次跟进：{{ c.next_follow_at.slice(0, 16) }}
                        </el-tag>
                      </div>
                      <div class="consult-content" v-if="c.content">{{ c.content }}</div>
                      <div class="consult-sub" v-if="c.intention">
                        <span class="lbl">意向变化：</span>{{ c.intention }}
                      </div>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
                <el-empty v-else description="暂无咨询记录，点击右上角新增" />
              </el-card>
            </el-tab-pane>

            <el-tab-pane :label="`响应节点 (${lead.response_nodes?.length || 0})`" name="nodes">
              <el-card shadow="never" class="node-card">
                <template #header>
                  <div class="card-title-actions">
                    <div class="card-title">
                      <el-icon><Connection /></el-icon>关键响应节点（保留节点类型与责任人）
                    </div>
                    <el-button size="small" @click="nodeVisible = true"><el-icon><Plus /></el-icon>补充节点</el-button>
                  </div>
                </template>
                <el-steps v-if="lead.response_nodes?.length" :active="lead.response_nodes.length" direction="vertical" finish-status="success">
                  <el-step
                    v-for="n in lead.response_nodes"
                    :key="n.id"
                    :title="n.node_type_label"
                    :description="nodeDescription(n)"
                  />
                </el-steps>
                <el-empty v-else description="暂无响应节点" />
              </el-card>
            </el-tab-pane>
          </el-tabs>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never" class="side-card">
            <template #header><div class="card-title"><el-icon><Promotion /></el-icon>快捷操作</div></template>
            <div class="quick-actions">
              <el-button type="primary" size="default" @click="consultVisible = true" style="width: 100%; margin-bottom: 10px">
                <el-icon><EditPen /></el-icon>快速记录咨询
              </el-button>
              <el-button type="success" size="default" @click="setSigned" style="width: 100%; margin-bottom: 10px">
                <el-icon><CircleCheck /></el-icon>标记已签约
              </el-button>
              <el-button type="warning" size="default" @click="setPending" style="width: 100%; margin-bottom: 10px">
                <el-icon><Clock /></el-icon>标记合同待确认
              </el-button>
              <el-button type="danger" size="default" style="width: 100%; margin-bottom: 10px" @click="setLost">
                <el-icon><Close /></el-icon>标记已流失
              </el-button>
              <el-button size="default" type="info" style="width: 100%" @click="exportLeadDetail">
                <el-icon><Download /></el-icon>导出本线索
              </el-button>
            </div>
          </el-card>
          <el-card shadow="never" class="side-card">
            <template #header><div class="card-title"><el-icon><Warning /></el-icon>合同待确认说明模板</div></template>
            <div class="pending-templates">
              <el-radio-group v-model="pendingTemplate" direction="vertical" size="default">
                <el-radio value="客户内部讨论预算">客户内部讨论预算（预计 3-5 天）</el-radio>
                <el-radio value="对比其他诊所方案">对比其他诊所方案（需 7-10 天）</el-radio>
                <el-radio value="等待家属意见">等待家属/决策人意见</el-radio>
                <el-radio value="付款方式沟通中">付款方式/分期方案沟通中</el-radio>
                <el-radio value="时间预期未匹配">就诊时间未匹配，客户择期</el-radio>
              </el-radio-group>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-dialog v-model="editVisible" title="编辑线索信息" width="720px" destroy-on-close>
        <el-form :model="editForm" :rules="editRules" ref="editRef" label-width="110px">
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item label="姓名" prop="name"><el-input v-model="editForm.name" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="电话" prop="phone"><el-input v-model="editForm.phone" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="来源" prop="source">
              <el-select v-model="editForm.source" style="width: 100%">
                <el-option v-for="s in leadSources" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="12"><el-form-item label="状态" prop="status">
              <el-select v-model="editForm.status" style="width: 100%">
                <el-option v-for="s in leadStatuses" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="12"><el-form-item label="质量">
              <el-radio-group v-model="editForm.quality">
                <el-radio-button value="A">A</el-radio-button>
                <el-radio-button value="B">B</el-radio-button>
                <el-radio-button value="C">C</el-radio-button>
                <el-radio-button value="D">D</el-radio-button>
              </el-radio-group>
            </el-form-item></el-col>
            <el-col :span="12"><el-form-item label="责任人">
              <el-select v-model="editForm.assignee_id" clearable style="width: 100%">
                <el-option v-for="o in operators" :key="o.id" :label="o.name" :value="o.id" />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="12"><el-form-item label="报价版本">
              <el-select v-model="editForm.quote_version_id" clearable style="width: 100%">
                <el-option v-for="q in quoteVersions" :key="q.id" :label="`${q.version} ${q.name}`" :value="q.id" />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="12"><el-form-item label="合同金额(元)">
              <el-input-number v-model="editForm.contract_amount" :min="0" :step="1000" style="width: 100%" controls-position="right" />
            </el-form-item></el-col>
            <el-col :span="12"><el-form-item label="流失原因">
              <el-select v-model="editForm.churn_reason_id" clearable style="width: 100%">
                <el-option
                  v-for="c in churnReasons"
                  :key="c.id"
                  :label="`${c.category} - ${c.name}`"
                  :value="c.id"
                />
              </el-select>
            </el-form-item></el-col>
            <el-col :span="12"><el-form-item label="下次跟进">
              <el-date-picker v-model="editForm.next_follow_at" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </el-form-item></el-col>
            <el-col :span="12"><el-form-item label="公海标记">
              <el-switch v-model="editForm.is_in_ocean" />
            </el-form-item></el-col>
            <el-col :span="24" v-if="editForm.status === 'contract_pending'">
              <el-form-item label="待确认说明" prop="contract_pending_explanation">
                <el-input
                  v-model="editForm.contract_pending_explanation"
                  type="textarea"
                  :rows="2"
                  placeholder="解释为什么处于合同待确认状态"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="客户意向">
                <el-input v-model="editForm.intention" type="textarea" :rows="2" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <el-button @click="editVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit">保存</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="consultVisible" title="新增咨询记录" width="640px" destroy-on-close>
        <el-form :model="consultForm" ref="consultRef" label-width="90px">
          <el-form-item label="咨询内容" prop="content">
            <el-input v-model="consultForm.content" type="textarea" :rows="6" maxlength="5000" show-word-limit />
          </el-form-item>
          <el-form-item label="意向变化">
            <el-input v-model="consultForm.intention" type="textarea" :rows="2" maxlength="1000" />
          </el-form-item>
          <el-form-item label="质量评估">
            <el-radio-group v-model="consultForm.quality">
              <el-radio-button value="A">A 高意向</el-radio-button>
              <el-radio-button value="B">B 中意向</el-radio-button>
              <el-radio-button value="C">C 低意向</el-radio-button>
              <el-radio-button value="D">D 无效</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="下次跟进">
            <el-date-picker v-model="consultForm.next_follow_at" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="consultVisible = false">取消</el-button>
          <el-button type="primary" @click="saveConsult">保存咨询</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="nodeVisible" title="补充响应节点" width="560px" destroy-on-close>
        <el-form :model="nodeForm" ref="nodeRef" label-width="90px">
          <el-form-item label="节点类型" prop="node_type">
            <el-select v-model="nodeForm.node_type" style="width: 100%">
              <el-option v-for="t in responseNodeTypes" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="节点说明" prop="content">
            <el-input v-model="nodeForm.content" type="textarea" :rows="4" maxlength="5000" show-word-limit />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="nodeVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNode">记录节点</el-button>
        </template>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import AppLayout from '@/Layouts/AppLayout.vue';
import route from '@/utils/route';

const page = usePage<any>();
const lead = computed<any>(() => page.props.lead || {});
const operators = computed<any[]>(() => page.props.operators || []);
const quoteVersions = computed<any[]>(() => page.props.quoteVersions || []);
const churnReasons = computed<any[]>(() => page.props.churnReasons || []);
const leadStatuses = computed<SelectOption[]>(() => page.props.leadStatuses || []);
const leadSources = computed<SelectOption[]>(() => page.props.leadSources || []);
const responseNodeTypes = computed<SelectOption[]>(() => page.props.responseNodeTypes || []);

const activeTab = ref('overview');
const editVisible = ref(false);
const consultVisible = ref(false);
const nodeVisible = ref(false);
const editRef = ref<FormInstance>();
const consultRef = ref<FormInstance>();
const nodeRef = ref<FormInstance>();
const pendingTemplate = ref('');

const buildEditForm = () => ({
  name: lead.value.name,
  phone: lead.value.phone,
  source: lead.value.source,
  status: lead.value.status,
  quality: lead.value.quality,
  assignee_id: lead.value.assignee?.id ?? null,
  owner_id: lead.value.owner?.id ?? null,
  quote_version_id: lead.value.quote_version?.id ?? null,
  churn_reason_id: lead.value.churn_reason?.id ?? null,
  contract_amount: lead.value.contract_amount ?? null,
  intention: lead.value.intention ?? '',
  contract_pending_explanation: lead.value.contract_pending_explanation ?? '',
  next_follow_at: lead.value.next_follow_at ?? null,
  is_in_ocean: !!lead.value.is_in_ocean,
});
const editForm = reactive<any>(buildEditForm());
watch(editVisible, (v) => { if (v) Object.assign(editForm, buildEditForm()); });

const editRules: FormRules = {
  name: [{ required: true }],
  phone: [{ required: true }],
  source: [{ required: true }],
  status: [{ required: true }],
};

const consultForm = reactive<any>({ content: '', intention: '', quality: '', next_follow_at: null });
const nodeForm = reactive<any>({ node_type: 'follow_up', content: '' });

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
const nodeDescription = (n: any) => `${n.content} — ${n.operator_name} @ ${n.created_at?.slice(0, 16)}`;

const flatQuoteItems = computed(() => {
  const list: any[] = [];
  (lead.value.quote_version?.items || []).forEach((g: any) => {
    (g.items || []).forEach((i: any) => {
      list.push({ category: g.category, ...i });
    });
  });
  return list;
});

const saveEdit = () => {
  editRef.value?.validate((ok) => {
    if (!ok) return;
    router.put(`/leads/${lead.value.id}`, editForm, {
      onSuccess: () => { ElMessage.success('更新成功'); editVisible.value = false; },
      onError: (err) => { const f = Object.values(err)[0] as any; ElMessage.error(f?.join('；') || '更新失败'); },
    });
  });
};

const saveConsult = () => {
  if (!consultForm.content) { ElMessage.warning('请填写咨询内容'); return; }
  router.post(`/leads/${lead.value.id}/consultations`, consultForm, {
    onSuccess: () => { ElMessage.success('咨询记录保存成功'); consultVisible.value = false; consultForm.content = ''; },
    onError: (err) => { const f = Object.values(err)[0] as any; ElMessage.error(f?.join('；') || '保存失败'); },
  });
};

const saveNode = () => {
  if (!nodeForm.node_type || !nodeForm.content) { ElMessage.warning('请完整填写节点信息'); return; }
  router.post(`/leads/${lead.value.id}/response-nodes`, nodeForm, {
    onSuccess: () => { ElMessage.success('响应节点已记录'); nodeVisible.value = false; },
    onError: (err) => { const f = Object.values(err)[0] as any; ElMessage.error(f?.join('；') || '记录失败'); },
  });
};

const setSigned = async () => {
  try {
    const amount = await ElMessageBox.prompt('请输入合同金额(元)', '标记已签约', {
      inputPattern: /^\d+(\.\d{1,2})?$/,
      inputErrorMessage: '金额格式不正确',
      inputValue: '0',
    });
    Object.assign(editForm, buildEditForm());
    editForm.status = 'signed';
    editForm.contract_amount = Number(amount.value);
    editForm.signed_at = new Date().toISOString();
    router.put(`/leads/${lead.value.id}`, editForm, {
      onSuccess: () => ElMessage.success('已标记为已签约'),
      onError: (e) => ElMessage.error((Object.values(e)[0] as any)?.[0] || '操作失败'),
    });
  } catch (e) { /* cancel */ }
};

const setPending = async () => {
  try {
    const expl = await ElMessageBox.prompt('请说明合同待确认原因', '合同待确认解释', {
      inputType: 'textarea',
      inputValue: pendingTemplate.value || '',
      confirmButtonText: '确认标记',
    });
    Object.assign(editForm, buildEditForm());
    editForm.status = 'contract_pending';
    editForm.contract_pending_explanation = expl.value;
    router.put(`/leads/${lead.value.id}`, editForm, {
      onSuccess: () => ElMessage.success('已标记为合同待确认'),
      onError: (e) => ElMessage.error((Object.values(e)[0] as any)?.[0] || '操作失败'),
    });
  } catch (e) { /* cancel */ }
};

const setLost = async () => {
  try {
    await ElMessageBox.confirm('确认标记为已流失？请在编辑中补充流失原因。', '标记流失', { type: 'warning' });
    Object.assign(editForm, buildEditForm());
    editForm.status = 'lost';
    router.put(`/leads/${lead.value.id}`, editForm, {
      onSuccess: () => ElMessage.success('已标记流失，请在编辑中补充流失原因'),
    });
  } catch (e) { /* cancel */ }
};

const exportLeadDetail = () => {
  window.open(`/exports/lead-quality?start_date=2020-01-01&end_date=2099-12-31`, '_blank');
};
</script>

<style scoped>
.lead-detail { display: flex; flex-direction: column; gap: 16px; }
.page-header { background: #ffffff; padding: 16px 20px; border-radius: 8px; }
.header-row { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; }
.header-row .title { margin-right: 10px; }
.main-tabs { }
.card-title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #111827; }
.card-title-actions { display: flex; align-items: center; justify-content: space-between; }
.q-tag { font-size: 12px; }
.muted { color: #9ca3af; }
.amount { color: #1d4ed8; font-weight: 600; }
.overdue { color: #dc2626; font-weight: 500; }
.intention-text { background: #f9fafb; padding: 12px 16px; border-radius: 6px; color: #374151; line-height: 1.7; font-size: 14px; }
.quote-total { text-align: right; padding: 12px 16px; font-size: 15px; color: #374151; }
.quote-total span { font-size: 18px; font-weight: 700; color: #1d4ed8; margin-left: 8px; }
.consult-card { }
.consult-item .consult-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.consult-item .consult-content { font-size: 14px; line-height: 1.7; color: #1f2937; white-space: pre-wrap; }
.consult-item .consult-sub { margin-top: 10px; color: #374151; font-size: 13px; background: #fffbeb; padding: 8px 12px; border-radius: 4px; }
.consult-item .consult-sub .lbl { color: #d97706; font-weight: 500; }
.node-card :deep(.el-step__title) { font-weight: 600; color: #1f2937; }
.node-card :deep(.el-step__description) { color: #4b5563; font-size: 13px; margin-top: 2px; line-height: 1.6; }
.side-card { margin-bottom: 16px; }
.quick-actions { display: flex; flex-direction: column; }
.pending-templates .el-radio { margin-bottom: 8px; line-height: 1.6; }
:deep(.el-card__header) { padding: 14px 20px; }
:deep(.el-descriptions__label) { width: 120px; }
</style>
