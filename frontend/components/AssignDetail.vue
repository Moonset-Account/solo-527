<template>
  <div>
    <div v-if="!assignment && canAssign" class="empty-state">
      <n-empty description="当前尚未分派，点击下方按钮进行分派" />
      <n-button type="primary" class="mt-md" @click="$emit('assign')">
        <template #icon><n-icon><PeopleOutline /></n-icon></template>
        分派律师与复核人
      </n-button>
    </div>
    <div v-if="assignment" class="assign-box">
      <div class="grid-cols-2">
        <div class="role-card">
          <div class="role-title">⚖️ 律师审核</div>
          <div class="role-user">
            <n-avatar round size="medium" style="background:#1d6ff2;">{{ lawyerName.charAt(0) }}</n-avatar>
            <div>
              <div class="u-name">{{ lawyerName }}</div>
              <div class="u-sub">
                <n-tag :type="statusType(assignment.status, 'lawyer')" size="small" bordered="false" round>{{ lawyerStage }}</n-tag>
                <span v-if="assignment.lawyer_deadline" class="dl">
                  截止：{{ String(assignment.lawyer_deadline).slice(0,10) }}
                </span>
              </div>
            </div>
          </div>
          <div class="times">
            <div>分派：{{ assignment.assigned_at?.slice(0,16).replace('T',' ') }}</div>
            <div v-if="assignment.lawyer_started_at">开始：{{ assignment.lawyer_started_at.slice(0,16).replace('T',' ') }}</div>
            <div v-if="assignment.lawyer_finished_at" style="color:#18a058">完成：{{ assignment.lawyer_finished_at.slice(0,16).replace('T',' ') }}</div>
          </div>
          <div v-if="assignment.lawyer_comment" class="comment">💬 {{ assignment.lawyer_comment }}</div>
          <div v-if="isCurrentLawyer" class="ops mt-sm">
            <n-button size="small" v-if="!assignment.lawyer_started_at" type="primary" @click="updateLawyer('start')">开始处理</n-button>
            <n-button size="small" v-if="assignment.lawyer_started_at && !assignment.lawyer_finished_at" type="success" @click="showLawyerDone = true">标记完成</n-button>
            <n-button size="small" text @click="showLawyerComment = true">填写律师意见</n-button>
          </div>
        </div>

        <div class="role-card">
          <div class="role-title">🔍 复核审核</div>
          <div class="role-user">
            <n-avatar round size="medium" style="background:#2d8a5e;">{{ reviewerName.charAt(0) }}</n-avatar>
            <div>
              <div class="u-name">{{ reviewerName }}</div>
              <div class="u-sub">
                <n-tag :type="statusType(assignment.status, 'reviewer')" size="small" bordered="false" round>{{ reviewerStage }}</n-tag>
                <span v-if="assignment.reviewer_deadline" class="dl">
                  截止：{{ String(assignment.reviewer_deadline).slice(0,10) }}
                </span>
              </div>
            </div>
          </div>
          <div class="times">
            <div>分派：{{ assignment.assigned_at?.slice(0,16).replace('T',' ') }}</div>
            <div v-if="assignment.reviewer_started_at">开始：{{ assignment.reviewer_started_at.slice(0,16).replace('T',' ') }}</div>
            <div v-if="assignment.reviewer_finished_at" style="color:#18a058">完成：{{ assignment.reviewer_finished_at.slice(0,16).replace('T',' ') }}</div>
          </div>
          <div v-if="assignment.reviewer_comment" class="comment">💬 {{ assignment.reviewer_comment }}</div>
          <div v-if="isCurrentReviewer" class="ops mt-sm">
            <n-button size="small" v-if="assignment.lawyer_finished_at && !assignment.reviewer_started_at" type="primary" @click="updateReviewer('start')">开始复核</n-button>
            <n-button size="small" v-if="assignment.reviewer_started_at && !assignment.reviewer_finished_at" type="success" @click="showReviewerDone = true">通过复核</n-button>
            <n-button size="small" text @click="showReviewerComment = true">填写复核意见</n-button>
          </div>
        </div>
      </div>
      <div v-if="canAssign" class="flex justify-end gap-sm mt-md">
        <n-button size="small" @click="$emit('assign')">重新分派</n-button>
      </div>
    </div>

    <n-modal v-model:show="showLawyerDone" preset="card" title="标记律师审核完成" style="width:480px">
      <n-form>
        <n-form-item label="审核意见">
          <n-input v-model:value="lawyerComment" type="textarea" :autosize="{minRows:3}" placeholder="请填写律师审核意见..." />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="showLawyerDone = false">取消</n-button>
        <n-button type="primary" :loading="lawyerLoading" @click="updateLawyer('done')">确认完成</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showReviewerDone" preset="card" title="通过复核" style="width:480px">
      <n-form>
        <n-form-item label="复核意见">
          <n-input v-model:value="reviewerComment" type="textarea" :autosize="{minRows:3}" placeholder="请填写复核意见..." />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="showReviewerDone = false">取消</n-button>
        <n-button type="primary" :loading="reviewerLoading" @click="updateReviewer('done')">确认通过</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showLawyerComment" preset="card" title="填写律师意见" style="width:480px">
      <n-input v-model:value="lawyerComment" type="textarea" :autosize="{minRows:4}" />
      <template #footer>
        <n-button @click="showLawyerComment = false">取消</n-button>
        <n-button type="primary" @click="updateLawyer('comment')">保存</n-button>
      </template>
    </n-modal>
    <n-modal v-model:show="showReviewerComment" preset="card" title="填写复核意见" style="width:480px">
      <n-input v-model:value="reviewerComment" type="textarea" :autosize="{minRows:4}" />
      <template #footer>
        <n-button @click="showReviewerComment = false">取消</n-button>
        <n-button type="primary" @click="updateReviewer('comment')">保存</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PeopleOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{ submissionId: number }>()
const emit = defineEmits(['assigned', 'assign'])
const auth = useAuthStore()

const assignment = ref<any>(null)
const usersMap = ref<Record<number, any>>({})
const lawyerName = computed(() => usersMap.value[assignment.value?.lawyer_id]?.full_name || '（未指定）')
const reviewerName = computed(() => usersMap.value[assignment.value?.reviewer_id]?.full_name || '（未指定）')
const canAssign = computed(() => auth.canManage)
const isCurrentLawyer = computed(() => auth.isLawyer && assignment.value?.lawyer_id === auth.user?.id)
const isCurrentReviewer = computed(() => auth.isReviewer && assignment.value?.reviewer_id === auth.user?.id)

const showLawyerDone = ref(false)
const showReviewerDone = ref(false)
const showLawyerComment = ref(false)
const showReviewerComment = ref(false)
const lawyerComment = ref('')
const reviewerComment = ref('')
const lawyerLoading = ref(false)
const reviewerLoading = ref(false)

const lawyerStage = computed(() => {
  const a = assignment.value; if (!a) return '-'
  if (a.lawyer_finished_at) return '已完成'
  if (a.lawyer_started_at) return '处理中'
  return '待处理'
})
const reviewerStage = computed(() => {
  const a = assignment.value; if (!a) return '-'
  if (a.reviewer_finished_at) return '已完成'
  if (a.reviewer_started_at) return '处理中'
  if (a.lawyer_finished_at) return '待处理'
  return '等待律师完成'
})
function statusType(st: string, who: 'lawyer' | 'reviewer'): any {
  const a = assignment.value; if (!a) return 'default'
  if (who === 'lawyer') {
    if (a.lawyer_finished_at) return 'success'
    if (a.lawyer_started_at) return 'warning'
    return 'info'
  } else {
    if (a.reviewer_finished_at) return 'success'
    if (a.reviewer_started_at) return 'warning'
    if (a.lawyer_finished_at) return 'info'
    return 'default'
  }
}

async function load() {
  try {
    const api = useApi()
    const [a, law, rev] = await Promise.all([
      api.get('/assignments', { page_size: 100 }),
      api.get('/users/by-role', { role: 'lawyer' }),
      api.get('/users/by-role', { role: 'reviewer' }),
    ])
    assignment.value = (a.items || []).find((x: any) => x.submission_id === props.submissionId) || null
    ;[...law, ...rev].forEach((u: any) => { usersMap.value[u.id] = u })
    if (assignment.value) {
      lawyerComment.value = assignment.value.lawyer_comment || ''
      reviewerComment.value = assignment.value.reviewer_comment || ''
    }
  } catch (_) {}
}

async function updateLawyer(action: string) {
  if (!assignment.value) return
  lawyerLoading.value = true
  try {
    const api = useApi()
    const payload: any = {}
    if (action === 'start') payload.status = 'lawyer_processing'
    if (action === 'done') { payload.status = 'lawyer_done'; payload.lawyer_comment = lawyerComment.value }
    if (action === 'comment') payload.lawyer_comment = lawyerComment.value
    await api.patch(`/assignments/${assignment.value.id}`, payload)
    showLawyerDone.value = false
    showLawyerComment.value = false
    emit('assigned')
    await load()
    (window as any).__n_msg?.success('操作成功')
  } finally { lawyerLoading.value = false }
}

async function updateReviewer(action: string) {
  if (!assignment.value) return
  reviewerLoading.value = true
  try {
    const api = useApi()
    const payload: any = {}
    if (action === 'start') payload.status = 'reviewer_processing'
    if (action === 'done') { payload.status = 'completed'; payload.reviewer_comment = reviewerComment.value }
    if (action === 'comment') payload.reviewer_comment = reviewerComment.value
    await api.patch(`/assignments/${assignment.value.id}`, payload)
    showReviewerDone.value = false
    showReviewerComment.value = false
    emit('assigned')
    await load()
    (window as any).__n_msg?.success('操作成功')
  } finally { reviewerLoading.value = false }
}

onMounted(load)
watch(() => props.submissionId, load)
</script>

<style scoped>
.empty-state { text-align: center; padding: 40px 20px; background: #fafbfb; border-radius: 10px; }
.assign-box { padding: 4px; }
.grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.role-card {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fefefe;
}
.role-title { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 14px; }
.role-user { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.u-name { font-size: 15px; font-weight: 600; color: #1f2937; }
.u-sub { display: flex; gap: 10px; align-items: center; margin-top: 4px; font-size: 12px; color: #6b7280; }
.dl { color: #6b7280; }
.times { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; background: #f7f9f8; border-radius: 6px; font-size: 12px; color: #6b7280; }
.comment { margin-top: 10px; padding: 10px 12px; background: #fff7ed; border-radius: 6px; color: #92400e; font-size: 13px; line-height: 1.5; }
.ops { display: flex; gap: 8px; flex-wrap: wrap; }
.flex { display: flex; }
.gap-sm { gap: 8px; }
.justify-end { justify-content: flex-end; }
.mt-md { margin-top: 16px; }
.mt-sm { margin-top: 8px; }
</style>
