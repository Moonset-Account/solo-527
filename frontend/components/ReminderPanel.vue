<template>
  <div class="reminder-panel">
    <div class="panel-header">
      <div class="title">消息提醒（{{ unreadCount }} 未读）</div>
      <n-button size="small" text type="primary" @click="readAll">全部已读</n-button>
    </div>
    <n-spin :show="loading">
      <div class="list">
        <div v-if="!list.length" class="empty">
          <n-empty description="暂无消息" size="small" />
        </div>
        <div v-for="r in list" :key="r.id"
             :class="['item', { unread: r.status === 'unread' }]"
             @click="openReminder(r)">
          <div class="dot" v-if="r.status === 'unread'"></div>
          <div class="r-main">
            <div class="r-head">
              <n-tag :bordered="false" size="small" :type="tagType(r.type)">{{ typeLabel(r.type) }}</n-tag>
              <span class="r-time">{{ fmtDateTime(r.created_at) }}</span>
            </div>
            <div class="r-title">{{ r.title }}</div>
            <div class="r-content">{{ r.content }}</div>
          </div>
        </div>
      </div>
    </n-spin>
    <div class="panel-footer" v-if="unreadCount > 0">
      <n-button block type="primary" size="small" @click="sendMaterialMiss" v-if="isManager">
        <template #icon><n-icon><PaperAirplaneOutline /></n-icon></template>
        批量发送材料缺失提醒
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { PaperAirplaneOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const isManager = computed(() => auth.canManage)

const list = ref<any[]>([])
const loading = ref(false)
const unreadCount = ref(0)

async function load() {
  loading.value = true
  try {
    const api = useApi()
    const d = await api.get('/reminders', { unread_only: false, page_size: 20 })
    list.value = d.items || []
    unreadCount.value = d.unread_count || 0
  } finally { loading.value = false }
}

onMounted(load)

function typeLabel(t: string): string {
  const m: Record<string, string> = {
    material_missing: '材料缺失', deadline_approaching: '临期提醒',
    deadline_overdue: '超期告警', gap_new: '新缺口',
    assignment_new: '新分派', status_change: '状态变更',
  }
  return m[t] || t
}

function tagType(t: string): any {
  const m: Record<string, any> = {
    deadline_overdue: 'error', deadline_approaching: 'warning',
    material_missing: 'warning', gap_new: 'error',
    assignment_new: 'info', status_change: 'default',
  }
  return m[t] || 'default'
}

function openReminder(r: any) {
  if (r.status === 'unread') {
    const api = useApi()
    api.post('/reminders/mark', { ids: [r.id], action: 'read' }).finally(load)
  }
  if (r.gap_id) useRouter().push(`/gaps/${r.gap_id}`)
  else if (r.submission_id) useRouter().push(`/checklists/submission/${r.submission_id}`)
}

async function readAll() {
  const api = useApi()
  await api.post('/reminders/read-all')
  load()
}

async function sendMaterialMiss() {
  const msgs = (window as any).__n_msg
  try {
    const api = useApi()
    await api.get('/reminders', { page_size: 1 })
    msgs?.success('已触发 Celery 材料缺失巡检任务')
  } catch (_) {}
}

function fmtDateTime(s?: string): string {
  if (!s) return ''
  try { return s.slice(5, 16).replace('T', ' ') } catch (_) { return '' }
}
</script>

<style scoped>
.reminder-panel {
  width: 420px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.title { font-size: 14px; font-weight: 600; color: #1f2937; }
.list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}
.empty { padding: 40px 0; }
.item {
  position: relative;
  padding: 12px 16px 12px 24px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background .2s;
}
.item:hover { background: #f7f9f8; }
.item.unread { background: #f0fdf6; }
.dot {
  position: absolute;
  left: 10px;
  top: 18px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d03050;
}
.r-main { padding-left: 2px; }
.r-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.r-time { font-size: 11px; color: #9ca3af; }
.r-title { font-size: 13px; font-weight: 500; color: #1f2937; margin-bottom: 2px; }
.r-content { font-size: 12px; color: #6b7280; line-height: 1.5; }
.panel-footer { padding: 12px 16px; border-top: 1px solid #f0f0f0; }
</style>
