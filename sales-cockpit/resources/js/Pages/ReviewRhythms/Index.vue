<script setup>
import { ref } from 'vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import AppLayout from '../Layout/AppLayout.vue';

const props = defineProps({
    rhythms: Object,
});

const showModal = ref(false);
const editingRhythm = ref(null);
const reportMonth = ref('');

const form = useForm({
    indicator_id: '',
    rhythm_type: '',
    next_review_date: '',
    responsible_user_id: '',
    notes: '',
});

const rhythmTypeMap = {
    daily: '每日',
    weekly: '每周',
    monthly: '每月',
    quarterly: '每季度',
};

function openCreate() {
    editingRhythm.value = null;
    form.reset();
    showModal.value = true;
}

function openEdit(rhythm) {
    editingRhythm.value = rhythm;
    form.indicator_id = rhythm.indicator_id;
    form.rhythm_type = rhythm.rhythm_type;
    form.next_review_date = rhythm.next_review_date;
    form.responsible_user_id = rhythm.responsible_user_id;
    form.notes = rhythm.notes || '';
    showModal.value = true;
}

function submitForm() {
    if (editingRhythm.value) {
        form.put(`/review-rhythms/${editingRhythm.value.id}`, {
            onSuccess: () => { showModal.value = false; },
        });
    } else {
        form.post('/review-rhythms', {
            onSuccess: () => { showModal.value = false; },
        });
    }
}

function generateReport() {
    if (!reportMonth.value) return;
    router.visit(`/review-rhythms/report?month=${reportMonth.value}`);
}
</script>

<template>
    <AppLayout>
        <div class="rhythms-page">
            <div class="page-header">
                <h2 class="page-title">复盘节奏</h2>
                <button class="btn btn-primary" @click="openCreate">新增</button>
            </div>

            <div class="card report-card">
                <div class="report-row">
                    <label class="form-label">月度复盘报表</label>
                    <div class="report-inputs">
                        <input type="month" v-model="reportMonth" class="form-input" />
                        <button class="btn btn-primary btn-sm" @click="generateReport" :disabled="!reportMonth">生成报表</button>
                    </div>
                </div>
            </div>

            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>指标</th>
                            <th>节奏类型</th>
                            <th>下次复盘日期</th>
                            <th>负责人</th>
                            <th>备注</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="rhythm in rhythms.data" :key="rhythm.id">
                            <td>{{ rhythm.indicator?.name || '-' }}</td>
                            <td>{{ rhythmTypeMap[rhythm.rhythm_type] || rhythm.rhythm_type }}</td>
                            <td>{{ rhythm.next_review_date }}</td>
                            <td>{{ rhythm.responsible_user?.name || rhythm.responsible_user_id || '-' }}</td>
                            <td>{{ rhythm.notes || '-' }}</td>
                            <td>
                                <button class="btn-link" @click="openEdit(rhythm)">编辑</button>
                            </td>
                        </tr>
                        <tr v-if="rhythms.data.length === 0">
                            <td colspan="6" class="empty-state">暂无数据</td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="rhythms.last_page > 1" class="pagination">
                    <button v-for="p in rhythms.last_page" :key="p" :class="['page-btn', { active: p === rhythms.current_page }]" @click="router.get('/review-rhythms', { page: p }, { preserveState: true })">
                        {{ p }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal">
                <h3 class="modal-title">{{ editingRhythm ? '编辑复盘节奏' : '新增复盘节奏' }}</h3>
                <div class="form-group">
                    <label class="form-label">指标ID</label>
                    <input type="number" v-model="form.indicator_id" class="form-input" />
                    <span v-if="form.errors.indicator_id" class="form-error">{{ form.errors.indicator_id }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">节奏类型</label>
                    <select v-model="form.rhythm_type" class="form-input">
                        <option value="">请选择</option>
                        <option value="daily">每日</option>
                        <option value="weekly">每周</option>
                        <option value="monthly">每月</option>
                        <option value="quarterly">每季度</option>
                    </select>
                    <span v-if="form.errors.rhythm_type" class="form-error">{{ form.errors.rhythm_type }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">下次复盘日期</label>
                    <input type="date" v-model="form.next_review_date" class="form-input" />
                    <span v-if="form.errors.next_review_date" class="form-error">{{ form.errors.next_review_date }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">负责人ID</label>
                    <input type="number" v-model="form.responsible_user_id" class="form-input" />
                    <span v-if="form.errors.responsible_user_id" class="form-error">{{ form.errors.responsible_user_id }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">备注</label>
                    <textarea v-model="form.notes" class="form-input" rows="3"></textarea>
                    <span v-if="form.errors.notes" class="form-error">{{ form.errors.notes }}</span>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-ghost" @click="showModal = false">取消</button>
                    <button class="btn btn-primary" @click="submitForm" :disabled="form.processing">保存</button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.rhythms-page {
    max-width: 1200px;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.page-title {
    font-size: 22px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.report-card {
    margin-bottom: 20px;
}

.report-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.report-inputs {
    display: flex;
    gap: 8px;
    align-items: center;
}

.card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.btn-link {
    background: none;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-size: 13px;
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

.pagination {
    display: flex;
    gap: 4px;
    justify-content: center;
    margin-top: 16px;
}

.page-btn {
    padding: 4px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
}

.page-btn.active {
    background: #3b82f6;
    color: #fff;
    border-color: #3b82f6;
}
</style>
