<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import Modal from '@/Components/Modal.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  conflicts: Object,
  filters: Object,
  teachers: Array,
  artClasses: Array,
})

const showReportModal = ref(false)
const showResolveModal = ref(false)
const resolvingConflict = ref(null)
const reportForm = ref(getDefaultReportForm())
const resolution = ref('')

const filterTeacher = ref(props.filters?.teacher_id || '')
const filterClass = ref(props.filters?.art_class_id || '')
const filterType = ref(props.filters?.conflict_type || '')
const filterStatus = ref(props.filters?.resolution_status || '')

const conflictTypeOptions = [
  { value: '', label: '全部冲突类型' },
  { value: 'teacher_overlap', label: '教师冲突' },
  { value: 'room_overlap', label: '教室冲突' },
  { value: 'time_overlap', label: '时间冲突' },
]

const resolutionStatusOptions = [
  { value: '', label: '全部处理状态' },
  { value: 'pending', label: '待处理' },
  { value: 'resolved', label: '已处理' },
  { value: 'ignored', label: '已忽略' },
]

const conflictTypeLabels = {
  teacher_overlap: '教师冲突',
  room_overlap: '教室冲突',
  time_overlap: '时间冲突',
}

const conflictTypeColors = {
  teacher_overlap: 'bg-red-100 text-red-700',
  room_overlap: 'bg-orange-100 text-orange-700',
  time_overlap: 'bg-yellow-100 text-yellow-700',
}

const resolutionStatusLabels = {
  pending: '待处理',
  resolved: '已处理',
  ignored: '已忽略',
}

function getDefaultReportForm() {
  return {
    teacher_id: '',
    art_class_id: '',
    conflict_date: '',
    conflict_type: 'teacher_overlap',
    description: '',
  }
}

function openReportModal() {
  reportForm.value = getDefaultReportForm()
  showReportModal.value = true
}

function submitReport() {
  router.post(route('schedule-conflicts.store'), reportForm.value, {
    onSuccess: () => { showReportModal.value = false },
  })
}

function openResolveModal(conflict) {
  resolvingConflict.value = conflict
  resolution.value = ''
  showResolveModal.value = true
}

function submitResolve() {
  router.post(route('schedule-conflicts.resolve', resolvingConflict.value.id), {
    resolution: resolution.value,
  }, {
    onSuccess: () => { showResolveModal.value = false },
  })
}

function ignoreConflict(conflict) {
  if (!confirm('确定忽略该冲突？')) return
  router.post(route('schedule-conflicts.ignore', conflict.id))
}

function notifyParents(conflict) {
  if (!confirm('确定通知该冲突相关家长？')) return
  router.post(route('schedule-conflicts.notify-parents', conflict.id))
}

function applyFilters() {
  router.get(route('schedule-conflicts.index'), {
    teacher_id: filterTeacher.value,
    art_class_id: filterClass.value,
    conflict_type: filterType.value,
    resolution_status: filterStatus.value,
  }, { preserveState: true, preserveScroll: true })
}
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="排课冲突">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">排课冲突</h2>
      <button
        @click="openReportModal"
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        上报冲突
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <select
          v-model="filterTeacher"
          @change="applyFilters"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">全部教师</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <select
          v-model="filterClass"
          @change="applyFilters"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">全部班级</option>
          <option v-for="c in artClasses" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select
          v-model="filterType"
          @change="applyFilters"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="opt in conflictTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select
          v-model="filterStatus"
          @change="applyFilters"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="opt in resolutionStatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
            <th class="px-5 py-3 font-medium">教师</th>
            <th class="px-5 py-3 font-medium">班级</th>
            <th class="px-5 py-3 font-medium">冲突日期</th>
            <th class="px-5 py-3 font-medium">冲突类型</th>
            <th class="px-5 py-3 font-medium">描述</th>
            <th class="px-5 py-3 font-medium">处理状态</th>
            <th class="px-5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="conflict in conflicts.data" :key="conflict.id" class="border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <td class="px-5 py-3 text-sm text-gray-900">{{ conflict.teacher?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-700">{{ conflict.art_class?.name || '-' }}</td>
            <td class="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{{ conflict.conflict_date }}</td>
            <td class="px-5 py-3">
              <span :class="[conflictTypeColors[conflict.conflict_type] || 'bg-gray-100 text-gray-700', 'inline-block rounded-full px-2 py-0.5 text-xs font-medium']">
                {{ conflictTypeLabels[conflict.conflict_type] || conflict.conflict_type }}
              </span>
            </td>
            <td class="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">{{ conflict.description || '-' }}</td>
            <td class="px-5 py-3">
              <StatusBadge :status="conflict.resolution_status" />
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <template v-if="conflict.resolution_status === 'pending'">
                  <button
                    @click="openResolveModal(conflict)"
                    class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    处理
                  </button>
                  <button
                    @click="ignoreConflict(conflict)"
                    class="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    忽略
                  </button>
                  <button
                    @click="notifyParents(conflict)"
                    class="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    通知家长
                  </button>
                </template>
                <template v-else-if="conflict.resolution_status === 'resolved'">
                  <button
                    @click="openResolveModal(conflict)"
                    class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    查看
                  </button>
                </template>
                <template v-else-if="conflict.resolution_status === 'ignored'">
                  <button
                    @click="openResolveModal(conflict)"
                    class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    处理
                  </button>
                </template>
              </div>
            </td>
          </tr>
          <tr v-if="conflicts.data.length === 0">
            <td colspan="7" class="px-5 py-10 text-center text-sm text-gray-500">暂无冲突记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <Pagination :links="conflicts.links" />
    </div>

    <Modal :show="showReportModal" title="上报冲突" max-width="lg" @close="showReportModal = false">
      <form @submit.prevent="submitReport" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">教师</label>
            <select
              v-model="reportForm.teacher_id"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">请选择教师</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">班级</label>
            <select
              v-model="reportForm.art_class_id"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">请选择班级</option>
              <option v-for="c in artClasses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">冲突日期</label>
            <input
              v-model="reportForm.conflict_date"
              type="date"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">冲突类型</label>
            <select
              v-model="reportForm.conflict_type"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option v-for="opt in conflictTypeOptions.slice(1)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            v-model="reportForm.description"
            rows="3"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showReportModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            上报
          </button>
        </div>
      </form>
    </Modal>

    <Modal :show="showResolveModal" :title="resolvingConflict?.resolution_status === 'resolved' ? '查看处理结果' : '处理冲突'" max-width="md" @close="showResolveModal = false">
      <div v-if="resolvingConflict" class="space-y-4">
        <div v-if="resolvingConflict.resolution_status === 'resolved' && resolvingConflict.resolution" class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-400 mb-1">处理结果</p>
          <p class="text-sm text-gray-700">{{ resolvingConflict.resolution }}</p>
        </div>
        <template v-else>
          <div class="bg-gray-50 rounded-lg p-3 mb-3">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><span class="text-gray-500">教师：</span>{{ resolvingConflict.teacher?.name || '-' }}</div>
              <div><span class="text-gray-500">班级：</span>{{ resolvingConflict.art_class?.name || '-' }}</div>
              <div><span class="text-gray-500">日期：</span>{{ resolvingConflict.conflict_date }}</div>
              <div><span class="text-gray-500">类型：</span>{{ conflictTypeLabels[resolvingConflict.conflict_type] }}</div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">处理方案</label>
            <textarea
              v-model="resolution"
              rows="3"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="showResolveModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              @click="submitResolve"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              提交处理
            </button>
          </div>
        </template>
      </div>
    </Modal>
  </AdminLayout>
</template>
