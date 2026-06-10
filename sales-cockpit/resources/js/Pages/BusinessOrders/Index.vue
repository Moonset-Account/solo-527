<script setup>
import { ref, watch } from 'vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import AppLayout from '../Layout/AppLayout.vue';

const props = defineProps({
    orders: Object,
    filters: Object,
});

const status = ref(props.filters.status || '');
const showModal = ref(false);

const form = useForm({
    title: '',
    description: '',
});

watch(status, () => {
    router.get('/business-orders', { status: status.value }, { preserveState: true, preserveScroll: true });
});

function openCreate() {
    form.reset();
    showModal.value = true;
}

function submitForm() {
    form.post('/business-orders', {
        onSuccess: () => { showModal.value = false; },
    });
}

const statusMap = {
    pending: { label: '待处理', class: 'badge-yellow' },
    processing: { label: '处理中', class: 'badge-blue' },
    completed: { label: '已完成', class: 'badge-green' },
    closed: { label: '已关闭', class: 'badge-gray' },
};
</script>

<template>
    <AppLayout>
        <div class="orders-page">
            <div class="page-header">
                <h2 class="page-title">业务工单</h2>
                <button class="btn btn-primary" @click="openCreate">新增</button>
            </div>

            <div class="card">
                <div class="filter-bar">
                    <select v-model="status" class="form-input filter-select">
                        <option value="">全部状态</option>
                        <option value="pending">待处理</option>
                        <option value="processing">处理中</option>
                        <option value="completed">已完成</option>
                        <option value="closed">已关闭</option>
                    </select>
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>工单号</th>
                            <th>标题</th>
                            <th>状态</th>
                            <th>处理人</th>
                            <th>创建时间</th>
                            <th>告警规则</th>
                            <th>维度</th>
                            <th>权限</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="order in orders.data" :key="order.id" class="clickable-row" @click="router.visit(`/business-orders/${order.id}`)">
                            <td>{{ order.order_no }}</td>
                            <td>{{ order.title }}</td>
                            <td>
                                <span :class="['badge', statusMap[order.status]?.class || 'badge-gray']">
                                    {{ statusMap[order.status]?.label || order.status }}
                                </span>
                            </td>
                            <td>{{ order.handler?.name || '-' }}</td>
                            <td>{{ order.created_at }}</td>
                            <td>{{ order.alert_rules?.length || 0 }}</td>
                            <td>{{ order.dimensions?.length || 0 }}</td>
                            <td>{{ order.dataset_permissions?.length || 0 }}</td>
                        </tr>
                        <tr v-if="orders.data.length === 0">
                            <td colspan="8" class="empty-state">暂无数据</td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="orders.last_page > 1" class="pagination">
                    <button v-for="p in orders.last_page" :key="p" :class="['page-btn', { active: p === orders.current_page }]" @click="router.get('/business-orders', { page: p, status }, { preserveState: true })">
                        {{ p }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal">
                <h3 class="modal-title">新增工单</h3>
                <div class="form-group">
                    <label class="form-label">标题</label>
                    <input type="text" v-model="form.title" class="form-input" />
                    <span v-if="form.errors.title" class="form-error">{{ form.errors.title }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">描述</label>
                    <textarea v-model="form.description" class="form-input" rows="4"></textarea>
                    <span v-if="form.errors.description" class="form-error">{{ form.errors.description }}</span>
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
.orders-page {
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

.card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
}

.filter-select {
    width: 140px;
}

.clickable-row {
    cursor: pointer;
}

.clickable-row:hover {
    background: #f1f5f9;
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
