<script setup>
import { ref, watch } from 'vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import AppLayout from '../Layout/AppLayout.vue';

const props = defineProps({
    indicators: Object,
    filters: Object,
});

const search = ref(props.filters.search || '');
const category = ref(props.filters.category || '');
const status = ref(props.filters.status || '');
const showModal = ref(false);
const editingIndicator = ref(null);

const form = useForm({
    name: '',
    code: '',
    caliber_description: '',
    unit: '',
    category: '',
});

watch([search, category, status], () => {
    router.get('/indicators', {
        search: search.value,
        category: category.value,
        status: status.value,
    }, { preserveState: true, preserveScroll: true });
});

function openCreate() {
    editingIndicator.value = null;
    form.reset();
    showModal.value = true;
}

function openEdit(indicator) {
    editingIndicator.value = indicator;
    form.name = indicator.name;
    form.code = indicator.code;
    form.caliber_description = indicator.caliber_description;
    form.unit = indicator.unit;
    form.category = indicator.category;
    showModal.value = true;
}

function submitForm() {
    if (editingIndicator.value) {
        form.put(`/indicators/${editingIndicator.value.id}`, {
            onSuccess: () => { showModal.value = false; },
        });
    } else {
        form.post('/indicators', {
            onSuccess: () => { showModal.value = false; },
        });
    }
}

function truncate(text, len = 30) {
    if (!text) return '-';
    return text.length > len ? text.substring(0, len) + '...' : text;
}
</script>

<template>
    <AppLayout>
        <div class="indicators-page">
            <div class="page-header">
                <h2 class="page-title">指标管理</h2>
                <button class="btn btn-primary" @click="openCreate">新增</button>
            </div>

            <div class="card">
                <div class="filter-bar">
                    <input type="text" v-model="search" placeholder="搜索名称/编码" class="form-input filter-input" />
                    <select v-model="category" class="form-input filter-select">
                        <option value="">全部分类</option>
                        <option value="sales">销售</option>
                        <option value="finance">财务</option>
                        <option value="customer">客户</option>
                        <option value="product">产品</option>
                    </select>
                    <select v-model="status" class="form-input filter-select">
                        <option value="">全部状态</option>
                        <option value="active">启用</option>
                        <option value="inactive">停用</option>
                    </select>
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>名称</th>
                            <th>编码</th>
                            <th>口径描述</th>
                            <th>单位</th>
                            <th>分类</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="ind in indicators.data" :key="ind.id">
                            <td>{{ ind.name }}</td>
                            <td>{{ ind.code }}</td>
                            <td>{{ truncate(ind.caliber_description) }}</td>
                            <td>{{ ind.unit }}</td>
                            <td>{{ ind.category }}</td>
                            <td>
                                <span :class="['badge', ind.status === 'active' ? 'badge-green' : 'badge-gray']">
                                    {{ ind.status === 'active' ? '启用' : '停用' }}
                                </span>
                            </td>
                            <td class="actions">
                                <Link :href="`/indicators/${ind.id}`" class="btn-link">查看</Link>
                                <button class="btn-link" @click="openEdit(ind)">编辑</button>
                            </td>
                        </tr>
                        <tr v-if="indicators.data.length === 0">
                            <td colspan="7" class="empty-state">暂无数据</td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="indicators.last_page > 1" class="pagination">
                    <button v-for="p in indicators.last_page" :key="p" :class="['page-btn', { active: p === indicators.current_page }]" @click="router.get('/indicators', { page: p, search, category, status }, { preserveState: true })">
                        {{ p }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal">
                <h3 class="modal-title">{{ editingIndicator ? '编辑指标' : '新增指标' }}</h3>
                <div class="form-group">
                    <label class="form-label">名称</label>
                    <input type="text" v-model="form.name" class="form-input" />
                    <span v-if="form.errors.name" class="form-error">{{ form.errors.name }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">编码</label>
                    <input type="text" v-model="form.code" class="form-input" />
                    <span v-if="form.errors.code" class="form-error">{{ form.errors.code }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">口径描述</label>
                    <textarea v-model="form.caliber_description" class="form-input" rows="4"></textarea>
                    <span v-if="form.errors.caliber_description" class="form-error">{{ form.errors.caliber_description }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">单位</label>
                    <input type="text" v-model="form.unit" class="form-input" />
                    <span v-if="form.errors.unit" class="form-error">{{ form.errors.unit }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <input type="text" v-model="form.category" class="form-input" />
                    <span v-if="form.errors.category" class="form-error">{{ form.errors.category }}</span>
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
.indicators-page {
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

.filter-input {
    width: 220px;
}

.filter-select {
    width: 140px;
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
