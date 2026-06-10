<script setup>
import { Link } from '@inertiajs/vue3';
import AppLayout from '../Layout/AppLayout.vue';

const props = defineProps({
    check: Object,
});
</script>

<template>
    <AppLayout>
        <div class="check-show">
            <div class="page-header">
                <Link href="/consistency-checks" class="back-link">← 返回校验列表</Link>
            </div>

            <div class="card">
                <h2 class="card-title">一致性校验详情</h2>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">指标</span>
                        <span class="detail-value">{{ check.indicator?.name || '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">校验类型</span>
                        <span class="detail-value">{{ check.check_type }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">期望值</span>
                        <span class="detail-value">{{ check.expected_value }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">实际值</span>
                        <span class="detail-value">{{ check.actual_value }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">差异</span>
                        <span class="detail-value">{{ check.discrepancy }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">状态</span>
                        <span :class="['badge', check.status === 'passed' ? 'badge-green' : 'badge-red']">
                            {{ check.status === 'passed' ? '通过' : '未通过' }}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">校验人</span>
                        <span class="detail-value">{{ check.checker?.name || check.checked_by || '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">校验时间</span>
                        <span class="detail-value">{{ check.checked_at }}</span>
                    </div>
                </div>

                <div v-if="check.details" class="details-section">
                    <h4 class="section-label">详细信息</h4>
                    <pre class="json-block">{{ JSON.stringify(check.details, null, 2) }}</pre>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.check-show {
    max-width: 800px;
}

.page-header {
    margin-bottom: 16px;
}

.back-link {
    color: #3b82f6;
    text-decoration: none;
    font-size: 14px;
}

.card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.card-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 20px;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.detail-label {
    font-size: 12px;
    color: #94a3b8;
}

.detail-value {
    font-size: 14px;
    color: #334155;
}

.details-section {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
}

.section-label {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
    margin: 0 0 10px;
}

.json-block {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 14px;
    font-size: 13px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
}
</style>
