<script setup>
import { ref, computed } from 'vue';
import { Link, router, useForm, usePage } from '@inertiajs/vue3';
import AppLayout from '../Layout/AppLayout.vue';

const props = defineProps({
    order: Object,
});

const page = usePage();
const activeTab = ref('alerts');
const showHandleModal = ref(false);
const showCloseModal = ref(false);
const showAlertRuleModal = ref(false);
const showDimensionModal = ref(false);
const showPermissionModal = ref(false);
const editingAlertRule = ref(null);
const editingDimension = ref(null);

const statusMap = {
    pending: { label: '待处理', class: 'badge-yellow' },
    processing: { label: '处理中', class: 'badge-blue' },
    completed: { label: '已完成', class: 'badge-green' },
    closed: { label: '已关闭', class: 'badge-gray' },
};

const handleForm = useForm({ remarks: '' });
const closeForm = useForm({ remarks: '' });

const alertRuleForm = useForm({
    business_order_id: props.order.id,
    indicator_id: '',
    condition_type: 'gt',
    threshold_value: '',
    threshold_value_max: '',
    notify_user_ids: [],
});

const dimensionForm = useForm({
    business_order_id: props.order.id,
    name: '',
    code: '',
    values_json: [],
});

const permissionForm = useForm({
    business_order_id: props.order.id,
    user_id: '',
    dataset_name: '',
    expires_at: '',
});

const newDimValue = ref('');

function submitHandle() {
    handleForm.post(`/business-orders/${props.order.id}/handle`, {
        onSuccess: () => { showHandleModal.value = false; },
    });
}

function submitClose() {
    closeForm.post(`/business-orders/${props.order.id}/close`, {
        onSuccess: () => { showCloseModal.value = false; },
    });
}

function openCreateAlertRule() {
    editingAlertRule.value = null;
    alertRuleForm.reset();
    alertRuleForm.business_order_id = props.order.id;
    showAlertRuleModal.value = true;
}

function openEditAlertRule(rule) {
    editingAlertRule.value = rule;
    alertRuleForm.indicator_id = rule.indicator_id;
    alertRuleForm.condition_type = rule.condition_type;
    alertRuleForm.threshold_value = rule.threshold_value;
    alertRuleForm.threshold_value_max = rule.threshold_value_max;
    alertRuleForm.notify_user_ids = rule.notify_user_ids || [];
    showAlertRuleModal.value = true;
}

function submitAlertRule() {
    if (editingAlertRule.value) {
        alertRuleForm.put(`/alert-rules/${editingAlertRule.value.id}`, {
            onSuccess: () => { showAlertRuleModal.value = false; },
        });
    } else {
        alertRuleForm.post('/alert-rules', {
            onSuccess: () => { showAlertRuleModal.value = false; },
        });
    }
}

function deleteAlertRule(rule) {
    if (confirm('确认删除此告警规则？')) {
        router.delete(`/alert-rules/${rule.id}`);
    }
}

function openCreateDimension() {
    editingDimension.value = null;
    dimensionForm.reset();
    dimensionForm.business_order_id = props.order.id;
    dimensionForm.values_json = [];
    newDimValue.value = '';
    showDimensionModal.value = true;
}

function openEditDimension(dim) {
    editingDimension.value = dim;
    dimensionForm.name = dim.name;
    dimensionForm.code = dim.code;
    dimensionForm.values_json = dim.values_json ? [...dim.values_json] : [];
    newDimValue.value = '';
    showDimensionModal.value = true;
}

function addDimValue() {
    if (newDimValue.value.trim()) {
        dimensionForm.values_json.push(newDimValue.value.trim());
        newDimValue.value = '';
    }
}

function removeDimValue(idx) {
    dimensionForm.values_json.splice(idx, 1);
}

function submitDimension() {
    if (editingDimension.value) {
        dimensionForm.put(`/dimensions/${editingDimension.value.id}`, {
            onSuccess: () => { showDimensionModal.value = false; },
        });
    } else {
        dimensionForm.post('/dimensions', {
            onSuccess: () => { showDimensionModal.value = false; },
        });
    }
}

function deleteDimension(dim) {
    if (confirm('确认删除此维度？')) {
        router.delete(`/dimensions/${dim.id}`);
    }
}

function openCreatePermission() {
    permissionForm.reset();
    permissionForm.business_order_id = props.order.id;
    showPermissionModal.value = true;
}

function submitPermission() {
    permissionForm.post('/dataset-permissions', {
        onSuccess: () => { showPermissionModal.value = false; },
    });
}

function deactivatePermission(perm) {
    if (confirm('确认停用此权限？')) {
        router.post(`/dataset-permissions/${perm.id}/deactivate`);
    }
}

function isExpiringSoon(expiresAt) {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt) - new Date();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function isExpired(expiresAt) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
}

const conditionTypeMap = {
    gt: '大于',
    lt: '小于',
    eq: '等于',
    gte: '大于等于',
    lte: '小于等于',
    between: '介于',
};
</script>

<template>
    <AppLayout>
        <div class="order-show">
            <div class="page-header">
                <Link href="/business-orders" class="back-link">← 返回工单列表</Link>
            </div>

            <div class="card header-card">
                <div class="header-row">
                    <div>
                        <h2 class="order-title">{{ order.order_no }} - {{ order.title }}</h2>
                    </div>
                    <span :class="['badge', statusMap[order.status]?.class || 'badge-gray']">
                        {{ statusMap[order.status]?.label || order.status }}
                    </span>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">描述</span>
                        <span class="info-value">{{ order.description || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">创建人</span>
                        <span class="info-value">{{ order.creator?.name || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">处理人</span>
                        <span class="info-value">{{ order.handler?.name || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">处理时间</span>
                        <span class="info-value">{{ order.handled_at || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">备注</span>
                        <span class="info-value">{{ order.remarks || '-' }}</span>
                    </div>
                </div>
                <div class="action-row">
                    <button v-if="order.status === 'pending'" class="btn btn-primary" @click="showHandleModal = true">受理</button>
                    <button v-if="order.status === 'processing'" class="btn btn-red" @click="showCloseModal = true">关闭</button>
                </div>
            </div>

            <div class="card">
                <div class="tab-bar">
                    <button :class="['tab-btn', { active: activeTab === 'alerts' }]" @click="activeTab = 'alerts'">告警规则</button>
                    <button :class="['tab-btn', { active: activeTab === 'dimensions' }]" @click="activeTab = 'dimensions'">维度配置</button>
                    <button :class="['tab-btn', { active: activeTab === 'permissions' }]" @click="activeTab = 'permissions'">数据集权限</button>
                </div>

                <div v-if="activeTab === 'alerts'">
                    <div class="section-header">
                        <button class="btn btn-primary btn-sm" @click="openCreateAlertRule">新增告警规则</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>指标</th>
                                <th>条件</th>
                                <th>阈值</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="rule in order.alert_rules" :key="rule.id">
                                <td>{{ rule.indicator?.name || '-' }}</td>
                                <td>{{ conditionTypeMap[rule.condition_type] || rule.condition_type }}</td>
                                <td>{{ rule.threshold_value }}{{ rule.threshold_value_max ? ` ~ ${rule.threshold_value_max}` : '' }}</td>
                                <td>
                                    <span :class="['badge', rule.is_active ? 'badge-green' : 'badge-gray']">
                                        {{ rule.is_active ? '启用' : '停用' }}
                                    </span>
                                </td>
                                <td class="actions">
                                    <button class="btn-link" @click="openEditAlertRule(rule)">编辑</button>
                                    <button class="btn-link btn-link-red" @click="deleteAlertRule(rule)">删除</button>
                                </td>
                            </tr>
                            <tr v-if="!order.alert_rules?.length">
                                <td colspan="5" class="empty-state">暂无告警规则</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="activeTab === 'dimensions'">
                    <div class="section-header">
                        <button class="btn btn-primary btn-sm" @click="openCreateDimension">新增维度</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>名称</th>
                                <th>编码</th>
                                <th>值</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="dim in order.dimensions" :key="dim.id">
                                <td>{{ dim.name }}</td>
                                <td>{{ dim.code }}</td>
                                <td>{{ (dim.values_json || []).join(', ') }}</td>
                                <td class="actions">
                                    <button class="btn-link" @click="openEditDimension(dim)">编辑</button>
                                    <button class="btn-link btn-link-red" @click="deleteDimension(dim)">删除</button>
                                </td>
                            </tr>
                            <tr v-if="!order.dimensions?.length">
                                <td colspan="4" class="empty-state">暂无维度</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="activeTab === 'permissions'">
                    <div class="section-header">
                        <button class="btn btn-primary btn-sm" @click="openCreatePermission">新增权限</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>用户</th>
                                <th>数据集</th>
                                <th>过期时间</th>
                                <th>授权人</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="perm in order.dataset_permissions" :key="perm.id">
                                <td>{{ perm.user?.name || '-' }}</td>
                                <td>{{ perm.dataset_name }}</td>
                                <td>
                                    <span :class="{ 'text-orange': isExpiringSoon(perm.expires_at), 'text-red': isExpired(perm.expires_at) }">
                                        {{ perm.expires_at }}
                                        <template v-if="isExpiringSoon(perm.expires_at)">（即将过期）</template>
                                        <template v-if="isExpired(perm.expires_at)">（已过期）</template>
                                    </span>
                                </td>
                                <td>{{ perm.granted_by || '-' }}</td>
                                <td>
                                    <span :class="['badge', perm.is_active ? 'badge-green' : 'badge-gray']">
                                        {{ perm.is_active ? '启用' : '停用' }}
                                    </span>
                                </td>
                                <td>
                                    <button v-if="perm.is_active" class="btn-link btn-link-red" @click="deactivatePermission(perm)">停用</button>
                                </td>
                            </tr>
                            <tr v-if="!order.dataset_permissions?.length">
                                <td colspan="6" class="empty-state">暂无权限</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="showHandleModal" class="modal-overlay" @click.self="showHandleModal = false">
            <div class="modal">
                <h3 class="modal-title">受理工单</h3>
                <div class="form-group">
                    <label class="form-label">备注</label>
                    <textarea v-model="handleForm.remarks" class="form-input" rows="3"></textarea>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-ghost" @click="showHandleModal = false">取消</button>
                    <button class="btn btn-primary" @click="submitHandle" :disabled="handleForm.processing">确认受理</button>
                </div>
            </div>
        </div>

        <div v-if="showCloseModal" class="modal-overlay" @click.self="showCloseModal = false">
            <div class="modal">
                <h3 class="modal-title">关闭工单</h3>
                <div class="form-group">
                    <label class="form-label">备注</label>
                    <textarea v-model="closeForm.remarks" class="form-input" rows="3"></textarea>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-ghost" @click="showCloseModal = false">取消</button>
                    <button class="btn btn-red" @click="submitClose" :disabled="closeForm.processing">确认关闭</button>
                </div>
            </div>
        </div>

        <div v-if="showAlertRuleModal" class="modal-overlay" @click.self="showAlertRuleModal = false">
            <div class="modal">
                <h3 class="modal-title">{{ editingAlertRule ? '编辑告警规则' : '新增告警规则' }}</h3>
                <div class="form-group">
                    <label class="form-label">指标</label>
                    <input type="number" v-model="alertRuleForm.indicator_id" class="form-input" placeholder="指标ID" />
                    <span v-if="alertRuleForm.errors.indicator_id" class="form-error">{{ alertRuleForm.errors.indicator_id }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">条件类型</label>
                    <select v-model="alertRuleForm.condition_type" class="form-input">
                        <option value="gt">大于</option>
                        <option value="lt">小于</option>
                        <option value="eq">等于</option>
                        <option value="gte">大于等于</option>
                        <option value="lte">小于等于</option>
                        <option value="between">介于</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">阈值</label>
                    <input type="number" v-model="alertRuleForm.threshold_value" class="form-input" />
                    <span v-if="alertRuleForm.errors.threshold_value" class="form-error">{{ alertRuleForm.errors.threshold_value }}</span>
                </div>
                <div v-if="alertRuleForm.condition_type === 'between'" class="form-group">
                    <label class="form-label">最大阈值</label>
                    <input type="number" v-model="alertRuleForm.threshold_value_max" class="form-input" />
                </div>
                <div class="form-group">
                    <label class="form-label">通知用户ID（逗号分隔）</label>
                    <input type="text" :value="alertRuleForm.notify_user_ids.join(',')" @input="e => alertRuleForm.notify_user_ids = e.target.value.split(',').map(Number).filter(Boolean)" class="form-input" />
                </div>
                <div class="modal-actions">
                    <button class="btn btn-ghost" @click="showAlertRuleModal = false">取消</button>
                    <button class="btn btn-primary" @click="submitAlertRule" :disabled="alertRuleForm.processing">保存</button>
                </div>
            </div>
        </div>

        <div v-if="showDimensionModal" class="modal-overlay" @click.self="showDimensionModal = false">
            <div class="modal">
                <h3 class="modal-title">{{ editingDimension ? '编辑维度' : '新增维度' }}</h3>
                <div class="form-group">
                    <label class="form-label">名称</label>
                    <input type="text" v-model="dimensionForm.name" class="form-input" />
                    <span v-if="dimensionForm.errors.name" class="form-error">{{ dimensionForm.errors.name }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">编码</label>
                    <input type="text" v-model="dimensionForm.code" class="form-input" />
                    <span v-if="dimensionForm.errors.code" class="form-error">{{ dimensionForm.errors.code }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">维度值</label>
                    <div class="dim-values">
                        <span v-for="(v, idx) in dimensionForm.values_json" :key="idx" class="dim-tag">
                            {{ v }}
                            <button class="tag-remove" @click="removeDimValue(idx)">×</button>
                        </span>
                    </div>
                    <div class="dim-add">
                        <input type="text" v-model="newDimValue" class="form-input" placeholder="输入维度值" @keyup.enter="addDimValue" />
                        <button class="btn btn-sm" @click="addDimValue">添加</button>
                    </div>
                    <span v-if="dimensionForm.errors.values_json" class="form-error">{{ dimensionForm.errors.values_json }}</span>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-ghost" @click="showDimensionModal = false">取消</button>
                    <button class="btn btn-primary" @click="submitDimension" :disabled="dimensionForm.processing">保存</button>
                </div>
            </div>
        </div>

        <div v-if="showPermissionModal" class="modal-overlay" @click.self="showPermissionModal = false">
            <div class="modal">
                <h3 class="modal-title">新增数据集权限</h3>
                <div class="form-group">
                    <label class="form-label">用户ID</label>
                    <input type="number" v-model="permissionForm.user_id" class="form-input" />
                    <span v-if="permissionForm.errors.user_id" class="form-error">{{ permissionForm.errors.user_id }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">数据集名称</label>
                    <input type="text" v-model="permissionForm.dataset_name" class="form-input" />
                    <span v-if="permissionForm.errors.dataset_name" class="form-error">{{ permissionForm.errors.dataset_name }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">过期时间</label>
                    <input type="date" v-model="permissionForm.expires_at" class="form-input" />
                    <span v-if="permissionForm.errors.expires_at" class="form-error">{{ permissionForm.errors.expires_at }}</span>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-ghost" @click="showPermissionModal = false">取消</button>
                    <button class="btn btn-primary" @click="submitPermission" :disabled="permissionForm.processing">保存</button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.order-show {
    max-width: 1100px;
}

.page-header {
    margin-bottom: 16px;
}

.back-link {
    color: #3b82f6;
    text-decoration: none;
    font-size: 14px;
}

.header-card {
    margin-bottom: 20px;
}

.header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
}

.order-title {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    margin-bottom: 16px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.info-label {
    font-size: 12px;
    color: #94a3b8;
}

.info-value {
    font-size: 14px;
    color: #334155;
}

.action-row {
    display: flex;
    gap: 10px;
}

.tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 16px;
}

.tab-btn {
    padding: 8px 18px;
    border: none;
    background: none;
    font-size: 14px;
    color: #64748b;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
}

.tab-btn.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
}

.section-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
}

.actions {
    display: flex;
    gap: 10px;
}

.btn-link {
    background: none;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-size: 13px;
}

.btn-link-red {
    color: #ef4444;
}

.btn-sm {
    padding: 5px 14px;
    font-size: 13px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    background: #fff;
    cursor: pointer;
}

.text-orange {
    color: #f97316;
}

.text-red {
    color: #ef4444;
}

.dim-values {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
}

.dim-tag {
    background: #e0f2fe;
    color: #0369a1;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.tag-remove {
    background: none;
    border: none;
    color: #0369a1;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    line-height: 1;
}

.dim-add {
    display: flex;
    gap: 8px;
}

.dim-add .form-input {
    flex: 1;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
}

.modal {
    background: #fff;
    border-radius: 10px;
    padding: 24px;
    width: 480px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-title {
    font-size: 17px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 20px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.form-error {
    color: #ef4444;
    font-size: 12px;
}
</style>
