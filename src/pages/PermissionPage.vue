<script setup lang="ts">
import { Check, X, MessageSquare, CheckSquare, XSquare } from 'lucide-vue-next'
import { usePermissionStore } from '@/stores/permission'

const store = usePermissionStore()

function getInitial(name: string) {
  return name.charAt(0)
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">权限审核</h2>
      <div v-if="store.selectedIds.length" class="batch-actions">
        <button class="btn btn-primary" @click="store.batchApprove">
          <CheckSquare :size="14" /> 批量通过 ({{ store.selectedIds.length }})
        </button>
        <button class="btn btn-danger" @click="store.batchReject">
          <XSquare :size="14" /> 批量驳回
        </button>
      </div>
    </div>

    <div class="review-list">
      <div v-for="item in store.pendingReviews" :key="item.id" class="card review-card">
        <div class="review-header">
          <label class="check-label">
            <input
              type="checkbox"
              :checked="store.selectedIds.includes(item.id)"
              @change="store.toggleSelect(item.id)"
            />
          </label>
          <div class="user-avatar">{{ getInitial(item.userName) }}</div>
          <div class="user-info">
            <div class="user-name">{{ item.userName }}</div>
            <div class="user-dept">{{ item.department }}</div>
          </div>
          <div class="role-change">
            <span class="role-current">{{ item.currentRole }}</span>
            <span class="role-arrow">→</span>
            <span class="role-requested">{{ item.requestedRole }}</span>
          </div>
        </div>

        <div class="review-body">
          <p class="review-reason">{{ item.reason }}</p>
          <div class="review-date">{{ item.date }}</div>
        </div>

        <div class="review-footer">
          <div class="comment-input-wrap">
            <MessageSquare :size="14" class="comment-icon" />
            <input
              class="input comment-input"
              v-model="store.commentInput[item.id]"
              placeholder="审批意见..."
            />
          </div>
          <div class="review-actions">
            <button class="btn btn-primary" @click="store.approve(item.id)">
              <Check :size="14" /> 通过
            </button>
            <button class="btn btn-danger" @click="store.reject(item.id)">
              <X :size="14" /> 驳回
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!store.pendingReviews.length" class="empty-state">
      <p>暂无待审核项</p>
    </div>
  </div>
</template>

<style scoped>
.page-container { padding: 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; color: var(--color-text-primary); }
.batch-actions { display: flex; gap: 10px; }
.review-list { display: flex; flex-direction: column; gap: 12px; }
.review-card { padding: 16px; }
.review-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.check-label { display: flex; align-items: center; }
.check-label input { accent-color: var(--color-accent); }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(13,148,136,0.2); color: #2DD4BF; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; }
.user-info { flex-shrink: 0; }
.user-name { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
.user-dept { font-size: 12px; color: var(--color-text-muted); }
.role-change { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.role-current { font-size: 13px; color: var(--color-text-muted); }
.role-arrow { color: var(--color-text-muted); }
.role-requested { font-size: 13px; color: #2DD4BF; font-weight: 500; }
.review-body { margin-bottom: 12px; padding-left: 48px; }
.review-reason { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 4px; }
.review-date { font-size: 12px; color: var(--color-text-muted); }
.review-footer { display: flex; align-items: center; gap: 12px; padding-left: 48px; }
.comment-input-wrap { position: relative; flex: 1; }
.comment-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); }
.comment-input { padding-left: 30px; width: 100%; }
.review-actions { display: flex; gap: 8px; flex-shrink: 0; }
.empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-muted); font-size: 15px; }
</style>
