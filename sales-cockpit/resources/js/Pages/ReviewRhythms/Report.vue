<script setup>
import { Link } from '@inertiajs/vue3';
import AppLayout from '../Layout/AppLayout.vue';

const props = defineProps({
    reportData: Array,
    month: String,
});

const rhythmTypeMap = {
    daily: '每日',
    weekly: '每周',
    monthly: '每月',
    quarterly: '每季度',
};

const totalRhythms = props.reportData?.length || 0;
const totalValues = props.reportData?.reduce((sum, r) => sum + (r.indicator_values?.length || 0), 0) || 0;
const totalChecks = props.reportData?.reduce((sum, r) => sum + (r.consistency_checks?.length || 0), 0) || 0;
const passedChecks = props.reportData?.reduce((sum, r) => sum + (r.consistency_checks?.filter(c => c.status === 'passed').length || 0), 0) || 0;
</script>

<template>
    <AppLayout>
        <div class="report-page">
            <div class="page-header">
                <Link href="/review-rhythms" class="back-link">← 返回复盘节奏</Link>
                <button class="btn btn-ghost" onclick="window.print()">打印</button>
            </div>

            <div class="report-header">
                <h2 class="report-title">月度复盘报表</h2>
                <p class="report-month">{{ month }}</p>
            </div>

            <div class="summary-row">
                <div class="summary-item">
                    <span class="summary-num">{{ totalRhythms }}</span>
                    <span class="summary-label">复盘节奏</span>
                </div>
                <div class="summary-item">
                    <span class="summary-num">{{ totalValues }}</span>
                    <span class="summary-label">指标值</span>
                </div>
                <div class="summary-item">
                    <span class="summary-num">{{ totalChecks }}</span>
                    <span class="summary-label">一致性校验</span>
                </div>
                <div class="summary-item">
                    <span class="summary-num">{{ totalChecks > 0 ? Math.round(passedChecks / totalChecks * 100) : 0 }}%</span>
                    <span class="summary-label">通过率</span>
                </div>
            </div>

            <div v-for="(item, idx) in reportData" :key="idx" class="card rhythm-section">
                <h3 class="section-title">
                    {{ item.rhythm?.indicator?.name || '-' }}
                    <span class="rhythm-type">{{ rhythmTypeMap[item.rhythm?.rhythm_type] || item.rhythm?.rhythm_type }}</span>
                </h3>

                <div class="sub-section">
                    <h4 class="sub-title">指标值</h4>
                    <table v-if="item.indicator_values?.length" class="data-table">
                        <thead>
                            <tr>
                                <th>维度</th>
                                <th>时间</th>
                                <th>值</th>
                                <th>来源</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="val in item.indicator_values" :key="val.id">
                                <td>{{ val.dimension_value || '-' }}</td>
                                <td>{{ val.time_period }}</td>
                                <td>{{ val.value }}</td>
                                <td>{{ val.source || '-' }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-else class="empty-text">暂无数据</p>
                </div>

                <div class="sub-section">
                    <h4 class="sub-title">一致性校验</h4>
                    <table v-if="item.consistency_checks?.length" class="data-table">
                        <thead>
                            <tr>
                                <th>校验类型</th>
                                <th>期望值</th>
                                <th>实际值</th>
                                <th>差异</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="check in item.consistency_checks" :key="check.id">
                                <td>{{ check.check_type }}</td>
                                <td>{{ check.expected_value }}</td>
                                <td>{{ check.actual_value }}</td>
                                <td>{{ check.discrepancy }}</td>
                                <td>
                                    <span :class="['badge', check.status === 'passed' ? 'badge-green' : 'badge-red']">
                                        {{ check.status === 'passed' ? '通过' : '未通过' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-else class="empty-text">暂无数据</p>
                </div>
            </div>

            <div v-if="!reportData?.length" class="card empty-state-card">
                <p class="empty-state">该月份暂无复盘数据</p>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.report-page {
    max-width: 1000px;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.back-link {
    color: #3b82f6;
    text-decoration: none;
    font-size: 14px;
}

.report-header {
    text-align: center;
    margin-bottom: 24px;
}

.report-title {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.report-month {
    font-size: 16px;
    color: #64748b;
    margin: 4px 0 0;
}

.summary-row {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
}

.summary-item {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.summary-num {
    display: block;
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
}

.summary-label {
    font-size: 13px;
    color: #64748b;
}

.rhythm-section {
    margin-bottom: 20px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.rhythm-type {
    font-size: 12px;
    background: #e0f2fe;
    color: #0369a1;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
}

.sub-section {
    margin-bottom: 14px;
}

.sub-title {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    margin: 0 0 8px;
}

.empty-text {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
}

.empty-state-card {
    background: #fff;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

@media print {
    .sidebar, .top-bar, .hamburger, .page-header .btn { display: none !important; }
    .main-area { margin-left: 0 !important; }
    .content { padding: 0 !important; }
}
</style>
