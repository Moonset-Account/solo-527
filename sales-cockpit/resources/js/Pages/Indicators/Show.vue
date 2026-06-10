<script setup>
import { ref } from 'vue';
import { Link, useForm } from '@inertiajs/vue3';
import AppLayout from '../Layout/AppLayout.vue';

const props = defineProps({
    indicator: Object,
    recentValues: Array,
    consistencyChecks: Array,
});

const activeTab = ref('values');
const showCheckModal = ref(false);

const checkForm = useForm({
    indicator_id: props.indicator.id,
    check_type: '',
    expected_value: '',
    actual_value: '',
});

function submitCheck() {
    checkForm.post('/consistency-checks', {
        onSuccess: () => { showCheckModal.value = false; },
    });
}
</script>

<template>
    <AppLayout>
        <div class="indicator-show">
            <div class="page-header">
                <Link href="/indicators" class="back-link">← 返回指标列表</Link>
            </div>

            <div class="card header-card">
                <div class="header-row">
                    <div>
                        <h2 class="indicator-name">{{ indicator.name }}</h2>
                        <span class="indicator-code">{{ indicator.code }}</span>
                        <span :class="['badge', indicator.status === 'active' ? 'badge-green' : 'badge-gray']">
                            {{ indicator.status === 'active' ? '启用' : '停用' }}
                        </span>
                    </div>
                    <span class="badge badge-blue">{{ indicator.category }}</span>
                </div>
                <div class="caliber-section">
                    <h4 class="section-label">口径描述</h4>
                    <p class="caliber-text">{{ indicator.caliber_description }}</p>
                </div>
                <div class="meta-row">
                    <span>单位：{{ indicator.unit }}</span>
                </div>
            </div>

            <div class="card">
                <div class="tab-bar">
                    <button :class="['tab-btn', { active: activeTab === 'values' }]" @click="activeTab = 'values'">指标值</button>
                    <button :class="['tab-btn', { active: activeTab === 'checks' }]" @click="activeTab = 'checks'">一致性校验</button>
                    <button v-if="activeTab === 'checks'" class="btn btn-primary btn-sm" @click="showCheckModal = true" style="margin-left:auto">运行校验</button>
                </div>

                <div v-if="activeTab === 'values'">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>维度值</th>
                                <th>时间</th>
                                <th>值</th>
                                <th>来源</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="val in recentValues" :key="val.id">
                                <td>{{ val.dimension_value || '-' }}</td>
                                <td>{{ val.time_period }}</td>
                                <td>{{ val.value }}</td>
                                <td>{{ val.source || '-' }}</td>
                            </tr>
                            <tr v-if="recentValues.length === 0">
                                <td colspan="4" class="empty-state">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="activeTab === 'checks'">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>校验类型</th>
                                <th>期望值</th>
                                <th>实际值</th>
                                <th>差异</th>
                                <th>状态</th>
                                <th>校验人</th>
                                <th>校验时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="check in consistencyChecks" :key="check.id">
                                <td>{{ check.check_type }}</td>
                                <td>{{ check.expected_value }}</td>
                                <td>{{ check.actual_value }}</td>
                                <td>{{ check.discrepancy }}</td>
                                <td>
                                    <span :class="['badge', check.status === 'passed' ? 'badge-green' : 'badge-red']">
                                        {{ check.status === 'passed' ? '通过' : '未通过' }}
                                    </span>
                                </td>
                                <td>{{ check.checked_by || '-' }}</td>
                                <td>{{ check.checked_at }}</td>
                            </tr>
                            <tr v-if="consistencyChecks.length === 0">
                                <td colspan="7" class="empty-state">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="showCheckModal" class="modal-overlay" @click.self="showCheckModal = false">
            <div class="modal">
                <h3 class="modal-title">运行一致性校验</h3>
                <div class="form-group">
                    <label class="form-label">校验类型</label>
                    <input type="text" v-model="checkForm.check_type" class="form-input" />
                    <span v-if="checkForm.errors.check_type" class="form-error">{{ checkForm.errors.check_type }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">期望值</label>
                    <input type="number" v-model="checkForm.expected_value" class="form-input" />
                    <span v-if="checkForm.errors.expected_value" class="form-error">{{ checkForm.errors.expected_value }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">实际值</label>
                    <input type="number" v-model="checkForm.actual_value" class="form-input" />
                    <span v-if="checkForm.errors.actual_value" class="form-error">{{ checkForm.errors.actual_value }}</span>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-ghost" @click="showCheckModal = false">取消</button>
                    <button class="btn btn-primary" @click="submitCheck" :disabled="checkForm.processing">保存</button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.indicator-show {
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

.indicator-name {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px;
}

.indicator-code {
    font-size: 13px;
    color: #64748b;
    margin-right: 8px;
}

.section-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    margin: 0 0 4px;
}

.caliber-text {
    font-size: 14px;
    color: #334155;
    margin: 0;
    line-height: 1.6;
}

.meta-row {
    margin-top: 12px;
    font-size: 13px;
    color: #64748b;
}

.tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 16px;
    align-items: center;
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

.btn-sm {
    padding: 5px 14px;
    font-size: 13px;
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
    width: 420px;
    max-width: 90vw;
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
