<script setup>
import { ref, watch } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '../Layout/AppLayout.vue';

const props = defineProps({
    logs: Object,
    filters: Object,
});

const entityType = ref(props.filters.entity_type || '');
const action = ref(props.filters.action || '');
const dateFrom = ref(props.filters.start_date || '');
const dateTo = ref(props.filters.end_date || '');
const expandedRows = ref(new Set());

watch([entityType, action, dateFrom, dateTo], () => {
    router.get('/audit-logs', {
        entity_type: entityType.value,
        action: action.value,
        start_date: dateFrom.value,
        end_date: dateTo.value,
    }, { preserveState: true, preserveScroll: true });
});

function toggleRow(id) {
    if (expandedRows.value.has(id)) {
        expandedRows.value.delete(id);
    } else {
        expandedRows.value.add(id);
    }
}

function formatJson(val) {
    if (!val) return '-';
    try {
        return JSON.stringify(typeof val === 'string' ? JSON.parse(val) : val, null, 2);
    } catch {
        return String(val);
    }
}

function truncateJson(val, len = 40) {
    if (!val) return '-';
    const str = typeof val === 'string' ? val : JSON.stringify(val);
    return str.length > len ? str.substring(0, len) + '...' : str;
}
</script>

<template>
    <AppLayout>
        <div class="audit-page">
            <h2 class="page-title">操作留痕</h2>

            <div class="card">
                <div class="filter-bar">
                    <select v-model="entityType" class="form-input filter-select">
                        <option value="">全部实体类型</option>
                        <option value="indicator">指标</option>
                        <option value="business_order">业务工单</option>
                        <option value="alert_rule">告警规则</option>
                        <option value="dimension">维度</option>
                        <option value="dataset_permission">数据集权限</option>
                        <option value="consistency_check">一致性校验</option>
                        <option value="review_rhythm">复盘节奏</option>
                    </select>
                    <select v-model="action" class="form-input filter-select">
                        <option value="">全部操作</option>
                        <option value="create">创建</option>
                        <option value="update">更新</option>
                        <option value="delete">删除</option>
                        <option value="handle">受理</option>
                        <option value="close">关闭</option>
                        <option value="deactivate">停用</option>
                    </select>
                    <input type="date" v-model="dateFrom" class="form-input filter-date" placeholder="开始日期" />
                    <input type="date" v-model="dateTo" class="form-input filter-date" placeholder="结束日期" />
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>时间</th>
                            <th>用户</th>
                            <th>操作</th>
                            <th>实体类型</th>
                            <th>实体ID</th>
                            <th>旧值</th>
                            <th>新值</th>
                            <th>IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="log in logs.data" :key="log.id">
                            <td>{{ log.created_at }}</td>
                            <td>{{ log.user?.name || '-' }}</td>
                            <td>
                                <span class="badge badge-blue">{{ log.action }}</span>
                            </td>
                            <td>{{ log.entity_type }}</td>
                            <td>{{ log.entity_id }}</td>
                            <td>
                                <button v-if="log.old_values" class="btn-link" @click="toggleRow(log.id + '_old')">
                                    {{ expandedRows.has(log.id + '_old') ? '收起' : '展开' }}
                                </button>
                                <span v-else>-</span>
                                <pre v-if="expandedRows.has(log.id + '_old') && log.old_values" class="json-preview">{{ formatJson(log.old_values) }}</pre>
                            </td>
                            <td>
                                <button v-if="log.new_values" class="btn-link" @click="toggleRow(log.id + '_new')">
                                    {{ expandedRows.has(log.id + '_new') ? '收起' : '展开' }}
                                </button>
                                <span v-else>-</span>
                                <pre v-if="expandedRows.has(log.id + '_new') && log.new_values" class="json-preview">{{ formatJson(log.new_values) }}</pre>
                            </td>
                            <td>{{ log.ip_address || '-' }}</td>
                        </tr>
                        <tr v-if="logs.data.length === 0">
                            <td colspan="8" class="empty-state">暂无数据</td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="logs.last_page > 1" class="pagination">
                    <button v-for="p in logs.last_page" :key="p" :class="['page-btn', { active: p === logs.current_page }]" @click="router.get('/audit-logs', { page: p, entity_type: entityType, action, start_date: dateFrom, end_date: dateTo }, { preserveState: true })">
                        {{ p }}
                    </button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.audit-page {
    max-width: 1200px;
}

.page-title {
    font-size: 22px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 20px;
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
    flex-wrap: wrap;
}

.filter-select {
    width: 150px;
}

.filter-date {
    width: 140px;
}

.btn-link {
    background: none;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-size: 13px;
}

.json-preview {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 8px;
    font-size: 11px;
    margin-top: 4px;
    max-height: 150px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
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
