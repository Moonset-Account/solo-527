<script setup>
import { ref, watch } from 'vue';
import { Link, router } from '@inertiajs/vue3';
import AppLayout from '../Layout/AppLayout.vue';

const props = defineProps({
    checks: Object,
    filters: Object,
});

const indicatorId = ref(props.filters.indicator_id || '');
const status = ref(props.filters.status || '');

watch([indicatorId, status], () => {
    router.get('/consistency-checks', {
        indicator_id: indicatorId.value,
        status: status.value,
    }, { preserveState: true, preserveScroll: true });
});
</script>

<template>
    <AppLayout>
        <div class="checks-page">
            <h2 class="page-title">一致性校验</h2>

            <div class="card">
                <div class="filter-bar">
                    <input type="number" v-model="indicatorId" placeholder="指标ID" class="form-input filter-input" />
                    <select v-model="status" class="form-input filter-select">
                        <option value="">全部状态</option>
                        <option value="passed">通过</option>
                        <option value="failed">未通过</option>
                    </select>
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>指标</th>
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
                        <tr v-for="check in checks.data" :key="check.id">
                            <td>
                                <Link :href="`/consistency-checks/${check.id}`" class="link">{{ check.indicator?.name || '-' }}</Link>
                            </td>
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
                        <tr v-if="checks.data.length === 0">
                            <td colspan="8" class="empty-state">暂无数据</td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="checks.last_page > 1" class="pagination">
                    <button v-for="p in checks.last_page" :key="p" :class="['page-btn', { active: p === checks.current_page }]" @click="router.get('/consistency-checks', { page: p, indicator_id: indicatorId, status }, { preserveState: true })">
                        {{ p }}
                    </button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.checks-page {
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
}

.filter-input {
    width: 160px;
}

.filter-select {
    width: 140px;
}

.link {
    color: #3b82f6;
    text-decoration: none;
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
