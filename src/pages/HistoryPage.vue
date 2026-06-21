<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Plus, Trash2, Edit3, ChevronDown, ChevronUp,
  PackagePlus, PackageMinus, CheckCircle, XCircle, ShieldCheck, ArrowRightLeft } from 'lucide-vue-next'
import { useHistoryStore, type HistoryEntry } from '@/stores/history'

const store = useHistoryStore()

const expandedIds = ref<Set<number>>(new Set())
const newNoteContent = ref<Record<number, string>>({})
const editingNoteId = ref<number | null>(null)
const editNoteContent = ref('')

const typeIcon: Record<string, any> = {
  inbound: PackagePlus,
  outbound: PackageMinus,
  approve: CheckCircle,
  reject: XCircle,
  audit: ShieldCheck,
  transfer: ArrowRightLeft,
}

const typeColor: Record<string, string> = {
  inbound: 'bg-accent-500',
  outbound: 'bg-primary-500',
  approve: 'bg-green-500',
  reject: 'bg-danger-500',
  audit: 'bg-warn-500',
  transfer: 'bg-primary-400',
}

const typeLabel: Record<string, string> = {
  inbound: '入库',
  outbound: '出库',
  approve: '审批通过',
  reject: '审批驳回',
  audit: '审查',
  transfer: '调拨',
}

const filteredEntries = computed(() => {
  return store.entries.filter(e => {
    if (store.searchQuery && !e.operator.includes(store.searchQuery) && !e.target.includes(store.searchQuery) && !e.action.includes(store.searchQuery)) return false
    if (store.filterOperator && e.operator !== store.filterOperator) return false
    if (store.filterActionType && e.type !== store.filterActionType) return false
    return true
  })
})

function toggleExpand(id: number) {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id)
  else expandedIds.value.add(id)
}

function addNote(entryId: number) {
  const content = newNoteContent.value[entryId]
  if (content?.trim()) {
    store.addNote(entryId, content.trim())
    newNoteContent.value[entryId] = ''
  }
}

function startEditNote(entryId: number, noteId: number, content: string) {
  editingNoteId.value = noteId
  editNoteContent.value = content
}

function saveEditNote(entryId: number, noteId: number) {
  editingNoteId.value = null
  editNoteContent.value = ''
}

function deleteNote(entryId: number, noteId: number) {
  store.deleteNote(entryId, noteId)
}
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">操作历史</h2>

    <div class="card filter-bar">
      <div class="search-wrap">
        <Search :size="16" class="search-icon" />
        <input class="input search-input" v-model="store.searchQuery" placeholder="搜索操作人、目标..." />
      </div>
      <select class="input" v-model="store.filterOperator">
        <option value="">全部操作人</option>
        <option v-for="op in store.operatorOptions" :key="op" :value="op">{{ op }}</option>
      </select>
      <select class="input" v-model="store.filterActionType">
        <option value="">全部操作类型</option>
        <option v-for="at in store.actionTypeOptions" :key="at.value" :value="at.value">{{ at.label }}</option>
      </select>
      <input type="date" class="input" v-model="store.filterDateStart" />
      <input type="date" class="input" v-model="store.filterDateEnd" />
    </div>

    <div class="timeline">
      <div v-for="entry in filteredEntries" :key="entry.id" class="timeline-item">
        <div class="timeline-node" :class="typeColor[entry.type]">
          <component :is="typeIcon[entry.type]" :size="14" />
        </div>
        <div class="timeline-line" />
        <div class="timeline-content card">
          <div class="entry-header" @click="toggleExpand(entry.id)">
            <div class="entry-info">
              <span class="tag" :class="'tag-info'">{{ typeLabel[entry.type] }}</span>
              <span class="entry-action">{{ entry.action }}</span>
              <span class="entry-target">{{ entry.target }}</span>
            </div>
            <div class="entry-meta">
              <span class="entry-operator">{{ entry.operator }}</span>
              <span class="entry-time">{{ entry.time }}</span>
              <component :is="expandedIds.has(entry.id) ? ChevronUp : ChevronDown" :size="16" class="text-primary-400" />
            </div>
          </div>

          <div v-if="expandedIds.has(entry.id)" class="entry-detail">
            <p class="detail-text">{{ entry.detail }}</p>

            <div v-if="entry.notes.length" class="notes-section">
              <h4 class="notes-title">交接备注</h4>
              <div class="notes-list">
                <div v-for="note in entry.notes" :key="note.id" class="note-bubble">
                  <div class="note-header">
                    <span class="note-author">{{ note.author }}</span>
                    <span class="note-time">{{ note.time }}</span>
                    <div class="note-actions">
                      <button class="note-btn" @click="startEditNote(entry.id, note.id, note.content)"><Edit3 :size="12" /></button>
                      <button class="note-btn" @click="deleteNote(entry.id, note.id)"><Trash2 :size="12" /></button>
                    </div>
                  </div>
                  <div v-if="editingNoteId === note.id" class="note-edit">
                    <input class="input" v-model="editNoteContent" />
                    <button class="btn btn-primary btn-sm" @click="saveEditNote(entry.id, note.id)">保存</button>
                  </div>
                  <p v-else class="note-content">{{ note.content }}</p>
                </div>
              </div>
            </div>

            <div class="add-note">
              <input
                class="input"
                v-model="newNoteContent[entry.id]"
                placeholder="添加交接备注..."
                @keyup.enter="addNote(entry.id)"
              />
              <button class="btn btn-secondary btn-sm" @click="addNote(entry.id)">
                <Plus :size="12" /> 添加
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!filteredEntries.length" class="empty-state">
      <p>暂无匹配的操作记录</p>
    </div>
  </div>
</template>

<style scoped>
.page-container { padding: 24px; }
.page-title { font-size: 22px; font-weight: 600; margin-bottom: 20px; color: var(--color-text-primary); }
.filter-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; padding: 12px 16px; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); }
.search-input { padding-left: 32px; width: 100%; }
.timeline { position: relative; padding-left: 24px; }
.timeline-item { position: relative; margin-bottom: 0; display: flex; gap: 16px; }
.timeline-node { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; z-index: 1; position: sticky; top: 20px; }
.timeline-line { position: absolute; left: 13px; top: 28px; bottom: -16px; width: 2px; background: var(--color-border); }
.timeline-item:last-child .timeline-line { display: none; }
.timeline-content { flex: 1; margin-bottom: 12px; }
.entry-header { display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
.entry-info { display: flex; align-items: center; gap: 8px; }
.entry-action { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
.entry-target { font-size: 13px; color: var(--color-text-secondary); }
.entry-meta { display: flex; align-items: center; gap: 8px; }
.entry-operator { font-size: 13px; color: var(--color-text-muted); }
.entry-time { font-size: 12px; color: var(--color-text-muted); }
.entry-detail { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-border); }
.detail-text { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 12px; }
.notes-section { margin-bottom: 12px; }
.notes-title { font-size: 13px; font-weight: 500; color: var(--color-text-muted); margin-bottom: 8px; }
.notes-list { display: flex; flex-direction: column; gap: 8px; }
.note-bubble { background: rgba(13,148,136,0.05); border: 1px solid rgba(13,148,136,0.15); border-radius: 8px; padding: 8px 12px; }
.note-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.note-author { font-size: 12px; font-weight: 500; color: #2DD4BF; }
.note-time { font-size: 11px; color: var(--color-text-muted); }
.note-actions { margin-left: auto; display: flex; gap: 4px; }
.note-btn { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 2px; }
.note-btn:hover { color: var(--color-text-primary); }
.note-edit { display: flex; gap: 8px; margin-top: 4px; }
.note-content { font-size: 13px; color: var(--color-text-secondary); }
.add-note { display: flex; gap: 8px; align-items: center; }
.btn-sm { padding: 4px 10px; font-size: 12px; }
.empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-muted); font-size: 15px; }
</style>
