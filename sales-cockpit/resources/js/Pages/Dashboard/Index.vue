<script setup>
import { ref, computed, reactive } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '../Layout/AppLayout.vue';

const props = defineProps({
    indicators: Array,
    defaultTimeRange: Object,
    values: Object,
});

const selectedIds = ref([]);
const startDate = ref(props.defaultTimeRange.start_date);
const endDate = ref(props.defaultTimeRange.end_date);
const loading = ref(false);
const resultValues = ref(props.values?.data || []);

const groupedIndicators = computed(() => {
    const groups = {};
    for (const ind of props.indicators) {
        if (!groups[ind.category]) groups[ind.category] = [];
        groups[ind.category].push(ind);
    }
    return groups;
});

const indicatorMap = computed(() => {
    const map = {};
    for (const ind of props.indicators) {
        map[ind.id] = ind;
    }
    return map;
});

function toggleIndicator(id) {
    const idx = selectedIds.value.indexOf(id);
    if (idx >= 0) selectedIds.value.splice(idx, 1);
    else selectedIds.value.push(id);
}

function selectCategory(category) {
    const ids = groupedIndicators.value[category].map(i => i.id);
    for (const id of ids) {
        if (!selectedIds.value.includes(id)) selectedIds.value.push(id);
    }
}

async function queryData() {
    loading.value = true;
    try {
        const resp = await router.post('/dashboard/data', {
            indicator_ids: selectedIds.value,
            start_date: startDate.value,
            end_date: endDate.value,
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                resultValues.value = page.props.values?.data || [];
            },
        });
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <AppLayout>
        <div class="dashboard">
            <h2 class="page-title">驾驶舱</h2>

            <div class="cards-row">
                <div class="card filter-card">
                    <h3 class="card-title">指标选择</h3>
                    <div v-for="(inds, category) in groupedIndicators" :key="category" class="indicator-group">
                        <div class="group-header">
                            <span class="group-name">{{ category }}</span>
                            <button class="btn-link" @click="selectCategory(category)">全选</button>
                        </div>
                        <div class="checkbox-grid">
                            <label v-for="ind in inds" :key="ind.id" class="checkbox-label">
                                <input type="checkbox" :value="ind.id" :checked="selectedIds.includes(ind.id)" @change="toggleIndicator(ind.id)" />
                                <span>{{ ind.name }} ({{ ind.code }})</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="card time-card">
                    <h3 class="card-title">时间范围</h3>
                    <div class="form-group">
                        <label class="form-label">开始日期</label>
                        <input type="date" v-model="startDate" class="form-input" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">结束日期</label>
                        <input type="date" v-model="endDate" class="form-input" />
                    </div>
                    <button class="btn btn-primary" @click="queryData" :disabled="loading || selectedIds.length === 0">
                        {{ loading ? '查询中...' : '查询' }}
                    </button>
                </div>
            </div>

            <div class="card results-card">
                <h3 class="card-title">查询结果</h3>
                <div v-if="loading" class="loading-state">加载中...</div>
                <table v-else-if="resultValues.length > 0" class="data-table">
                    <thead>
                        <tr>
                            <th>指标名称</th>
                            <th>维度</th>
                            <th>时间</th>
                            <th>值</th>
                            <th>来源</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="val in resultValues" :key="val.id">
                            <td>{{ indicatorMap[val.indicator_id]?.name || '-' }}</td>
                            <td>{{ val.dimension_value || '-' }}</td>
                            <td>{{ val.time_period }}</td>
                            <td>{{ val.value }}</td>
                            <td>{{ val.source || '-' }}</td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="empty-state">暂无数据，请选择指标并查询</div>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.dashboard {
    max-width: 1200px;
}

.page-title {
    font-size: 22px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 20px;
}

.cards-row {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 20px;
    margin-bottom: 20px;
}

.card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.card-title {
    font-size: 15px;
    font-weight: 600;
    color: #334155;
    margin: 0 0 16px;
}

.indicator-group {
    margin-bottom: 14px;
}

.group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}

.group-name {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

.btn-link {
    background: none;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-size: 12px;
}

.checkbox-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #64748b;
    cursor: pointer;
}

.form-group {
    margin-bottom: 14px;
}

.form-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #475569;
    margin-bottom: 4px;
}

.form-input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 13px;
    box-sizing: border-box;
}

.btn {
    padding: 8px 20px;
    border-radius: 6px;
    border: none;
    font-size: 14px;
    cursor: pointer;
    font-weight: 500;
}

.btn-primary {
    background: #3b82f6;
    color: #fff;
}

.btn-primary:disabled {
    background: #93c5fd;
    cursor: not-allowed;
}

.loading-state,
.empty-state {
    text-align: center;
    padding: 30px;
    color: #94a3b8;
    font-size: 14px;
}

.results-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

@media (max-width: 768px) {
    .cards-row {
        grid-template-columns: 1fr;
    }
}
</style>
