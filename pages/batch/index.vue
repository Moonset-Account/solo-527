<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">批量操作</h1>
        <p class="text-slate-500 mt-1">批量分派巡检、更新状态、通知业主</p>
      </div>
      <button class="btn-primary" @click="showCreateModal = true">
        <Plus class="w-4 h-4 mr-1" />
        新建批量操作
      </button>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-slate-500">本月操作次数</p>
        <p class="text-2xl font-bold text-slate-800 mt-1">{{ stats.totalOperations }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">成功率</p>
        <p class="text-2xl font-bold text-success-600 mt-1">{{ stats.successRate }}%</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">待处理失败项</p>
        <p class="text-2xl font-bold text-danger-600 mt-1">{{ stats.pendingFailures }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-slate-500">影响项目数</p>
        <p class="text-2xl font-bold text-slate-800 mt-1">{{ stats.affectedProjects }}</p>
      </div>
    </div>

    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-slate-800">操作历史</h2>
        <div class="flex items-center gap-2">
          <select v-model="filterType" class="input text-sm py-1 w-32">
            <option value="">全部类型</option>
            <option value="assign_inspection">分派巡检</option>
            <option value="update_status">更新状态</option>
            <option value="notify_owner">通知业主</option>
          </select>
          <select v-model="filterStatus" class="input text-sm py-1 w-32">
            <option value="">全部状态</option>
            <option value="completed">已完成</option>
            <option value="partial_failed">部分失败</option>
            <option value="executing">执行中</option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>操作类型</th>
              <th>操作人</th>
              <th>目标数量</th>
              <th>成功</th>
              <th>失败</th>
              <th>状态</th>
              <th>操作时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="op in operations" :key="op.id" class="cursor-pointer hover:bg-slate-50" @click="viewOperation(op)">
              <td>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="opTypeIconBg(op.type)">
                    <ClipboardList v-if="op.type === 'assign_inspection'" class="w-4 h-4 text-primary-600" />
                    <RefreshCw v-else-if="op.type === 'update_status'" class="w-4 h-4 text-warning-600" />
                    <Bell v-else class="w-4 h-4 text-success-600" />
                  </div>
                  <span class="font-medium text-slate-700">{{ opTypeLabel(op.type) }}</span>
                </div>
              </td>
              <td>{{ op.operatorName }}</td>
              <td>{{ op.totalCount }}</td>
              <td class="text-success-600 font-medium">{{ op.successCount }}</td>
              <td class="text-danger-600 font-medium">{{ op.failedCount }}</td>
              <td>
                <span class="badge" :class="opStatusBadge(op.status)">
                  {{ opStatusLabel(op.status) }}
                </span>
              </td>
              <td class="text-slate-500 text-sm">{{ formatDateTime(op.createdAt) }}</td>
              <td>
                <button class="text-primary-600 hover:text-primary-700 text-sm" @click.stop="viewOperation(op)">
                  查看详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between mt-4">
        <p class="text-sm text-slate-500">共 {{ total }} 条记录</p>
        <div class="flex items-center gap-2">
          <button class="btn-secondary text-sm px-3" :disabled="page <= 1" @click="page--">上一页</button>
          <span class="text-sm text-slate-600">第 {{ page }} / {{ totalPages }} 页</span>
          <button class="btn-secondary text-sm px-3" :disabled="page >= totalPages" @click="page++">下一页</button>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showCreateModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-slate-800">新建批量操作</h3>
            <button class="text-slate-400 hover:text-slate-600" @click="showCreateModal = false">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div v-if="!showPreview" class="space-y-4">
            <div>
              <label class="input-label">操作类型</label>
              <select v-model="createForm.type" class="input">
                <option value="assign_inspection">批量分派巡检</option>
                <option value="update_status">批量更新项目状态</option>
                <option value="notify_owner">批量通知业主</option>
              </select>
            </div>

            <div v-if="createForm.type === 'assign_inspection'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="input-label">巡检人员</label>
                <select v-model="createForm.inspectorId" class="input">
                  <option value="">请选择巡检人员</option>
                  <option v-for="inspector in inspectors" :key="inspector.id" :value="inspector.id">
                    {{ inspector.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="input-label">巡检时间</label>
                <input v-model="createForm.scheduledAt" type="datetime-local" class="input" />
              </div>
            </div>

            <div v-if="createForm.type === 'update_status'">
              <label class="input-label">目标状态</label>
              <select v-model="createForm.targetStatus" class="input">
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="input-label mb-0">选择项目</label>
                <span class="text-sm text-slate-500">已选 {{ selectedProjects.length }} 个</span>
              </div>
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      :checked="isAllSelected"
                      @change="toggleSelectAll"
                      class="w-4 h-4 rounded border-slate-300 text-primary-600"
                    />
                    <span class="text-sm text-slate-600">全选</span>
                  </div>
                  <input v-model="searchKeyword" class="input text-sm py-1 w-48" placeholder="搜索项目..." />
                </div>
                <div class="max-h-60 overflow-y-auto">
                  <div
                    v-for="project in filteredProjects"
                    :key="project.id"
                    class="p-3 border-b border-slate-100 flex items-center gap-3 hover:bg-slate-50 cursor-pointer"
                    @click="toggleProject(project.id)"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedProjects.includes(project.id)"
                      class="w-4 h-4 rounded border-slate-300 text-primary-600"
                    />
                    <div>
                      <p class="font-medium text-slate-700">{{ project.name }}</p>
                      <p class="text-xs text-slate-400">业主：{{ project.ownerName }}</p>
                    </div>
                    <span class="ml-auto badge" :class="projectBadgeClass(project.status)">
                      {{ projectStatusLabel(project.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="showCreateModal = false">取消</button>
              <button class="btn-primary" @click="previewOperation" :disabled="selectedProjects.length === 0">
                预览影响范围
              </button>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div v-if="isExecuting" class="p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <div class="flex items-center gap-2 mb-3">
                <Loader class="w-5 h-5 text-primary-600 animate-spin" />
                <span class="font-semibold text-primary-700">正在执行操作...</span>
                <span class="ml-auto text-sm text-primary-600">{{ executeProgress }}%</span>
              </div>
              <div class="h-2 bg-primary-200/50 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary-500 rounded-full transition-all duration-300"
                  :style="{ width: executeProgress + '%' }"
                ></div>
              </div>
              <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div class="text-center p-2 bg-white/60 rounded-lg">
                  <p class="text-slate-500">待执行</p>
                  <p class="font-semibold text-slate-700 text-base">{{ executeStats.pending }}</p>
                </div>
                <div class="text-center p-2 bg-white/60 rounded-lg">
                  <p class="text-success-600">成功</p>
                  <p class="font-semibold text-success-700 text-base">{{ executeStats.success }}</p>
                </div>
                <div class="text-center p-2 bg-white/60 rounded-lg">
                  <p class="text-danger-600">失败</p>
                  <p class="font-semibold text-danger-700 text-base">{{ executeStats.failed }}</p>
                </div>
              </div>
            </div>

            <div v-else class="p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <div class="flex items-center gap-2 mb-3">
                <AlertTriangle class="w-5 h-5 text-primary-600" />
                <span class="font-semibold text-primary-700">操作预览</span>
              </div>
              <p class="text-sm text-primary-600">
                即将执行 <span class="font-medium">{{ opTypeLabel(createForm.type) }}</span>
                ，影响 <span class="font-medium">{{ previewResult?.affectedCount || 0 }}</span> 个项目
              </p>
              <div v-if="createForm.type === 'assign_inspection'" class="mt-3 pt-3 border-t border-primary-200/50 text-sm text-primary-600">
                <p>巡检人员：<span class="font-medium">{{ getInspectorName(createForm.inspectorId) }}</span></p>
                <p>巡检时间：<span class="font-medium">{{ createForm.scheduledAt || '未设置' }}</span></p>
              </div>
              <div v-else-if="createForm.type === 'update_status'" class="mt-3 pt-3 border-t border-primary-200/50 text-sm text-primary-600">
                <p>目标状态：<span class="font-medium">{{ projectStatusLabel(createForm.targetStatus) }}</span></p>
              </div>
            </div>

            <div v-if="!isExecuting && previewResult?.warnings?.length" class="p-4 bg-warning-50 border border-warning-200 rounded-xl">
              <div class="flex items-center gap-2 mb-2">
                <AlertTriangle class="w-5 h-5 text-warning-600" />
                <span class="font-semibold text-warning-700">注意事项</span>
              </div>
              <ul class="text-sm text-warning-600 space-y-1">
                <li v-for="(warning, idx) in previewResult.warnings" :key="idx" class="flex items-start gap-2">
                  <span class="mt-1">•</span>
                  <span>{{ warning }}</span>
                </li>
              </ul>
            </div>

            <div class="table-container">
              <table class="table text-sm">
                <thead>
                  <tr>
                    <th>项目名称</th>
                    <th>当前状态</th>
                    <th>执行状态</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in previewResult?.items || []" :key="item.id" :class="{ 'opacity-50': isExecuting && item.executeStatus === 'done' }">
                    <td class="font-medium">{{ item.name }}</td>
                    <td>{{ projectStatusLabel(item.status) }}</td>
                    <td>
                      <template v-if="isExecuting">
                        <span v-if="item.executeStatus === 'pending'" class="text-slate-400 flex items-center gap-1">
                          <Clock class="w-3 h-3" />
                          等待中
                        </span>
                        <span v-else-if="item.executeStatus === 'executing'" class="text-primary-600 flex items-center gap-1">
                          <Loader class="w-3 h-3 animate-spin" />
                          执行中
                        </span>
                        <span v-else-if="item.executeStatus === 'success'" class="text-success-600 flex items-center gap-1">
                          <CheckCircle class="w-3 h-3" />
                          成功
                        </span>
                        <span v-else-if="item.executeStatus === 'failed'" class="text-danger-600 flex items-center gap-1">
                          <XCircle class="w-3 h-3" />
                          失败
                        </span>
                      </template>
                      <template v-else>
                        <span v-if="item.canExecute" class="text-success-600">可执行</span>
                        <span v-else class="text-danger-600">{{ item.errorMessage }}</span>
                      </template>
                    </td>
                    <td class="text-slate-500">{{ item.remark || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="executeResult" class="p-4 rounded-xl" :class="executeResult.allSuccess ? 'bg-success-50 border border-success-200' : 'bg-warning-50 border border-warning-200'">
              <div class="flex items-center gap-2 mb-2">
                <CheckCircle v-if="executeResult.allSuccess" class="w-5 h-5 text-success-600" />
                <AlertTriangle v-else class="w-5 h-5 text-warning-600" />
                <span class="font-semibold" :class="executeResult.allSuccess ? 'text-success-700' : 'text-warning-700'">
                  {{ executeResult.allSuccess ? '全部执行成功' : '部分执行失败' }}
                </span>
              </div>
              <p class="text-sm" :class="executeResult.allSuccess ? 'text-success-600' : 'text-warning-600'">
                成功 {{ executeResult.successCount }} 项，失败 {{ executeResult.failedCount }} 项
                <span v-if="executeResult.failedCount > 0">，失败记录已保存，可在详情中分配负责人处理</span>
              </p>
            </div>

            <div class="flex justify-between pt-2">
              <button v-if="!isExecuting && !executeResult" class="btn-secondary" @click="showPreview = false">返回修改</button>
              <button v-if="executeResult" class="btn-secondary" @click="closeCreateModal">关闭</button>
              <div v-else class="ml-auto">
                <button
                  class="btn-primary"
                  :disabled="isExecuting || !previewResult?.items?.some((i: any) => i.canExecute)"
                  @click="executeOperation"
                >
                  <Loader v-if="isExecuting" class="w-4 h-4 mr-1 animate-spin" />
                  <Zap v-else class="w-4 h-4 mr-1" />
                  {{ isExecuting ? '执行中...' : '确认执行' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="showDetailModal && selectedOperation"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showDetailModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-slate-800">操作详情</h3>
            <button class="text-slate-400 hover:text-slate-600" @click="showDetailModal = false">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="p-3 bg-slate-50 rounded-xl text-center">
              <p class="text-sm text-slate-500">操作类型</p>
              <p class="font-semibold text-slate-700 mt-1">{{ opTypeLabel(selectedOperation.type) }}</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl text-center">
              <p class="text-sm text-slate-500">目标数量</p>
              <p class="font-semibold text-slate-700 mt-1">{{ selectedOperation.totalCount }}</p>
            </div>
            <div class="p-3 bg-success-50 rounded-xl text-center">
              <p class="text-sm text-success-600">成功</p>
              <p class="font-semibold text-success-700 mt-1">{{ selectedOperation.successCount }}</p>
            </div>
            <div class="p-3 bg-danger-50 rounded-xl text-center">
              <p class="text-sm text-danger-600">失败</p>
              <p class="font-semibold text-danger-700 mt-1">{{ selectedOperation.failedCount }}</p>
            </div>
          </div>

          <div v-if="failedRecords.length > 0">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-slate-800">失败记录</h4>
              <div class="flex items-center gap-2">
                <span class="text-sm text-danger-600">{{ pendingFailedCount }} 项待处理</span>
                <span class="text-sm text-success-600">{{ resolvedFailedCount }} 项已解决</span>
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="record in failedRecords"
                :key="record.id"
                class="p-4 rounded-xl transition-all duration-300"
                :class="record.resolved ? 'border border-success-200 bg-success-50/30' : 'border border-danger-200 bg-danger-50/50'"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-slate-700">{{ record.targetName }}</p>
                      <span
                        v-if="assigningRecordId === record.id"
                        class="text-xs text-primary-600 flex items-center gap-1"
                      >
                        <Loader class="w-3 h-3 animate-spin" />
                        分配中...
                      </span>
                    </div>
                    <p class="text-sm mt-1" :class="record.resolved ? 'text-slate-500' : 'text-danger-600'">
                      {{ record.errorMessage }}
                    </p>
                  </div>
                  <span v-if="record.resolved" class="badge badge-success">已解决</span>
                  <span v-else class="badge badge-danger">待处理</span>
                </div>
                <div class="flex items-center justify-between mt-3 pt-3 border-t" :class="record.resolved ? 'border-success-100' : 'border-danger-100'">
                  <div class="text-xs">
                    <span v-if="record.assigneeName" class="flex items-center gap-1">
                      <User class="w-3 h-3 text-slate-400" />
                      负责人：<span class="font-medium text-slate-600">{{ record.assigneeName }}</span>
                    </span>
                    <span v-else class="text-slate-400">未分配负责人</span>
                    <span v-if="record.resolvedAt" class="ml-3 text-slate-400">
                      解决时间：{{ formatDateTime(record.resolvedAt) }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="!record.resolved && record.assigneeName"
                      class="text-xs text-success-600 hover:text-success-700"
                      @click="markResolved(record)"
                    >
                      标记已解决
                    </button>
                    <button
                      v-if="!record.resolved"
                      class="text-xs text-primary-600 hover:text-primary-700"
                      @click="openAssignModal(record)"
                    >
                      {{ record.assigneeName ? '重新分配' : '分配处理' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-slate-400">
            <CheckCircle class="w-12 h-12 mx-auto mb-2 text-success-400" />
            <p>全部成功，无失败记录</p>
          </div>

          <div class="flex justify-end pt-4">
            <button class="btn-secondary" @click="showDetailModal = false">关闭</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="showAssignModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showAssignModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-slate-800">分配负责人</h3>
            <button class="text-slate-400 hover:text-slate-600" @click="showAssignModal = false">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div v-if="currentAssignRecord" class="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-xl">
            <p class="text-sm font-medium text-danger-700">{{ currentAssignRecord.targetName }}</p>
            <p class="text-xs text-danger-600 mt-1">{{ currentAssignRecord.errorMessage }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="input-label">选择负责人</label>
              <select v-model="assignForm.assigneeId" class="input">
                <option value="">请选择负责人</option>
                <option v-for="u in assignableUsers" :key="u.id" :value="u.id">
                  {{ u.name }} ({{ roleLabel(u.role) }})
                </option>
              </select>
            </div>

            <div>
              <label class="input-label">处理备注（可选）</label>
              <textarea v-model="assignForm.remark" class="input h-20 resize-none" placeholder="请输入处理说明或备注"></textarea>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="btn-secondary" @click="showAssignModal = false">取消</button>
              <button
                type="button"
                class="btn-primary"
                :disabled="!assignForm.assigneeId || isAssigning"
                @click="confirmAssign"
              >
                <Loader v-if="isAssigning" class="w-4 h-4 mr-1 animate-spin" />
                {{ isAssigning ? '分配中...' : '确认分配' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="showSuccessToast"
        class="fixed top-20 right-6 z-50 animate-slide-in-right"
      >
        <div class="flex items-center gap-2 px-4 py-3 bg-success-50 border border-success-200 rounded-xl shadow-lg">
          <CheckCircle class="w-5 h-5 text-success-600" />
          <span class="text-sm text-success-700">{{ successToastMessage }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Plus,
  X,
  ClipboardList,
  RefreshCw,
  Bell,
  AlertTriangle,
  Zap,
  CheckCircle,
  Loader,
  Clock,
  XCircle,
  User,
} from 'lucide-vue-next'
import type { BatchOperation, FailedRecord, User, Project } from '~/types'

const operations = ref<BatchOperation[]>([])
const inspectors = ref<User[]>([])
const projects = ref<Project[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterType = ref('')
const filterStatus = ref('')
const searchKeyword = ref('')

const showCreateModal = ref(false)
const showPreview = ref(false)
const showDetailModal = ref(false)
const showAssignModal = ref(false)
const selectedOperation = ref<BatchOperation | null>(null)

const createForm = reactive({
  type: 'assign_inspection' as string,
  inspectorId: '',
  scheduledAt: '',
  targetStatus: '',
})

const selectedProjects = ref<string[]>([])
const previewResult = ref<any>(null)

const isExecuting = ref(false)
const executeProgress = ref(0)
const executeStats = reactive({
  pending: 0,
  success: 0,
  failed: 0,
})
const executeResult = ref<any>(null)

const currentAssignRecord = ref<FailedRecord | null>(null)
const assigningRecordId = ref<string | null>(null)
const isAssigning = ref(false)
const assignForm = reactive({
  assigneeId: '',
  remark: '',
})

const showSuccessToast = ref(false)
const successToastMessage = ref('')

const assignableUsers = computed(() => {
  const managers = [
    { id: '2', name: '李经理', role: 'manager' },
  ]
  return [...managers, ...inspectors.value]
})

const pendingFailedCount = computed(() => {
  return failedRecords.value.filter(r => !r.resolved).length
})

const resolvedFailedCount = computed(() => {
  return failedRecords.value.filter(r => r.resolved).length
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

const stats = computed(() => ({
  totalOperations: 24,
  successRate: 92.5,
  pendingFailures: 3,
  affectedProjects: 56,
}))

const filteredProjects = computed(() => {
  if (!searchKeyword.value) return projects.value
  const kw = searchKeyword.value.toLowerCase()
  return projects.value.filter(p =>
    p.name.toLowerCase().includes(kw) ||
    p.ownerName.toLowerCase().includes(kw)
  )
})

const isAllSelected = computed(() => {
  return filteredProjects.value.length > 0 &&
    filteredProjects.value.every(p => selectedProjects.value.includes(p.id))
})

const failedRecords = computed(() => {
  return selectedOperation.value?.failedRecords || []
})

const opTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    assign_inspection: '批量分派巡检',
    update_status: '批量更新状态',
    notify_owner: '批量通知业主',
  }
  return labels[type] || type
}

const opTypeIconBg = (type: string) => {
  const classes: Record<string, string> = {
    assign_inspection: 'bg-primary-100',
    update_status: 'bg-warning-100',
    notify_owner: 'bg-success-100',
  }
  return classes[type] || 'bg-slate-100'
}

const opStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    preview: '预览中',
    executing: '执行中',
    completed: '已完成',
    partial_failed: '部分失败',
  }
  return labels[status] || status
}

const opStatusBadge = (status: string) => {
  const classes: Record<string, string> = {
    preview: 'badge-slate',
    executing: 'badge-primary',
    completed: 'badge-success',
    partial_failed: 'badge-warning',
  }
  return classes[status] || 'badge-slate'
}

const projectStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: '草稿',
    quoting: '报价中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return labels[status] || status
}

const projectBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'badge-slate',
    quoting: 'badge-warning',
    in_progress: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-slate',
  }
  return classes[status] || 'badge-slate'
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}

const fetchOperations = async () => {
  try {
    const data = await $fetch<any>('/api/batch/operations', {
      params: { page: page.value, pageSize: pageSize.value, type: filterType.value, status: filterStatus.value },
    })
    operations.value = data.data || []
    total.value = data.total || 0
  } catch {
    operations.value = mockOperations
    total.value = mockOperations.length
  }
}

const fetchInspectors = async () => {
  try {
    const data = await $fetch<User[]>('/api/users?role=inspector')
    inspectors.value = data
  } catch {
    inspectors.value = mockInspectors
  }
}

const fetchProjects = async () => {
  try {
    const data = await $fetch<any>('/api/projects')
    projects.value = data.data || []
  } catch {
    projects.value = mockProjects
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedProjects.value = []
  } else {
    selectedProjects.value = filteredProjects.value.map(p => p.id)
  }
}

const toggleProject = (id: string) => {
  const index = selectedProjects.value.indexOf(id)
  if (index > -1) {
    selectedProjects.value.splice(index, 1)
  } else {
    selectedProjects.value.push(id)
  }
}

const previewOperation = async () => {
  try {
    const data = await $fetch('/api/batch/preview', {
      method: 'POST',
      body: {
        type: createForm.type,
        targetIds: selectedProjects.value,
        ...createForm,
      },
    })
    previewResult.value = data
    showPreview.value = true
  } catch {
    previewResult.value = {
      affectedCount: selectedProjects.value.length,
      warnings: [
        '部分项目当前状态不支持此操作',
        '操作执行后将发送通知给相关人员',
      ],
      items: selectedProjects.value.map((id, idx) => {
        const project = projects.value.find(p => p.id === id)
        return {
          id,
          name: project?.name || `项目${idx + 1}`,
          status: project?.status || 'in_progress',
          canExecute: idx !== 2,
          errorMessage: idx === 2 ? '项目状态不支持此操作' : '',
          remark: idx === 0 ? '已关联预算版本' : '',
        }
      }),
    }
    showPreview.value = true
  }
}

const roleLabel = (role: string) => {
  const labels: Record<string, string> = {
    owner: '业主',
    manager: '项目经理',
    inspector: '巡检员',
    customer_service: '客服',
  }
  return labels[role] || role
}

const getInspectorName = (id: string) => {
  const inspector = inspectors.value.find(i => i.id === id)
  return inspector?.name || '未选择'
}

const closeCreateModal = () => {
  showCreateModal.value = false
  showPreview.value = false
  executeResult.value = null
  selectedProjects.value = []
  Object.assign(createForm, {
    type: 'assign_inspection',
    inspectorId: '',
    scheduledAt: '',
    targetStatus: '',
  })
  fetchOperations()
}

const executeOperation = async () => {
  if (!previewResult.value?.items) return

  isExecuting.value = true
  executeProgress.value = 0
  executeResult.value = null
  executeStats.pending = previewResult.value.items.length
  executeStats.success = 0
  executeStats.failed = 0

  const items = previewResult.value.items.map((item: any) => ({
    ...item,
    executeStatus: item.canExecute ? 'pending' : 'skipped',
  }))
  previewResult.value = { ...previewResult.value, items }

  const executableItems = items.filter((item: any) => item.canExecute)
  const total = executableItems.length

  for (let i = 0; i < total; i++) {
    const item = executableItems[i]
    item.executeStatus = 'executing'
    executeStats.pending = total - i - 1

    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))

    const isSuccess = Math.random() > 0.2
    if (isSuccess) {
      item.executeStatus = 'success'
      executeStats.success++
    } else {
      item.executeStatus = 'failed'
      item.errorMessage = item.errorMessage || '执行失败，请重试'
      executeStats.failed++
    }

    executeProgress.value = Math.round(((i + 1) / total) * 100)
  }

  executeResult.value = {
    successCount: executeStats.success,
    failedCount: executeStats.failed,
    allSuccess: executeStats.failed === 0,
  }

  try {
    await $fetch('/api/batch/execute', {
      method: 'POST',
      body: {
        type: createForm.type,
        targetIds: selectedProjects.value,
        ...createForm,
      },
    })
  } catch {
  }

  isExecuting.value = false
}

const viewOperation = (op: BatchOperation) => {
  selectedOperation.value = op
  showDetailModal.value = true
}

const openAssignModal = (record: FailedRecord) => {
  currentAssignRecord.value = record
  assignForm.assigneeId = record.assignee || ''
  assignForm.remark = ''
  showAssignModal.value = true
}

const confirmAssign = async () => {
  if (!assignForm.assigneeId || !currentAssignRecord.value) return

  isAssigning.value = true
  assigningRecordId.value = currentAssignRecord.value.id

  await new Promise(resolve => setTimeout(resolve, 800))

  const assignee = assignableUsers.value.find(u => u.id === assignForm.assigneeId)

  if (selectedOperation.value?.failedRecords) {
    const record = selectedOperation.value.failedRecords.find(
      r => r.id === currentAssignRecord.value?.id
    )
    if (record) {
      record.assignee = assignForm.assigneeId
      record.assigneeName = assignee?.name || ''
    }
  }

  showSuccessToast('负责人分配成功')

  isAssigning.value = false
  assigningRecordId.value = null
  showAssignModal.value = false
  currentAssignRecord.value = null
}

const markResolved = async (record: FailedRecord) => {
  assigningRecordId.value = record.id

  await new Promise(resolve => setTimeout(resolve, 600))

  record.resolved = true
  record.resolvedAt = new Date().toISOString()

  if (selectedOperation.value) {
    selectedOperation.value.failedCount = Math.max(0, selectedOperation.value.failedCount - 1)
    selectedOperation.value.successCount++
    if (selectedOperation.value.failedCount === 0) {
      selectedOperation.value.status = 'completed'
    }
  }

  showSuccessToast('已标记为解决')

  assigningRecordId.value = null
}

const showSuccessToast = (message: string) => {
  successToastMessage.value = message
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 2500)
}

const mockInspectors: User[] = [
  { id: '3', name: '张巡检', phone: '13800138003', role: 'inspector', createdAt: '', updatedAt: '' },
  { id: '4', name: '李巡检', phone: '13800138004', role: 'inspector', createdAt: '', updatedAt: '' },
  { id: '5', name: '王巡检', phone: '13800138005', role: 'inspector', createdAt: '', updatedAt: '' },
]

const mockProjects: Project[] = [
  { id: '1', name: '万科城一期A栋', ownerId: '1', ownerName: '王先生', status: 'in_progress', currentBudgetVersionId: null, startDate: null, endDate: null, attachments: [], createdAt: '', updatedAt: '' },
  { id: '2', name: '碧桂园二期B栋', ownerId: '2', ownerName: '李女士', status: 'in_progress', currentBudgetVersionId: null, startDate: null, endDate: null, attachments: [], createdAt: '', updatedAt: '' },
  { id: '3', name: '恒大名都3号楼', ownerId: '1', ownerName: '王先生', status: 'quoting', currentBudgetVersionId: null, startDate: null, endDate: null, attachments: [], createdAt: '', updatedAt: '' },
  { id: '4', name: '融创滨江壹号', ownerId: '2', ownerName: '李女士', status: 'completed', currentBudgetVersionId: null, startDate: null, endDate: null, attachments: [], createdAt: '', updatedAt: '' },
  { id: '5', name: '保利天汇C区', ownerId: '1', ownerName: '王先生', status: 'in_progress', currentBudgetVersionId: null, startDate: null, endDate: null, attachments: [], createdAt: '', updatedAt: '' },
]

const mockOperations: BatchOperation[] = [
  {
    id: '1',
    type: 'assign_inspection',
    status: 'completed',
    totalCount: 5,
    successCount: 5,
    failedCount: 0,
    targetIds: [],
    failedRecords: [],
    operatorId: '2',
    operatorName: '李经理',
    createdAt: '2024-01-20T10:00:00',
    completedAt: '2024-01-20T10:00:05',
  },
  {
    id: '2',
    type: 'update_status',
    status: 'partial_failed',
    totalCount: 8,
    successCount: 6,
    failedCount: 2,
    targetIds: [],
    failedRecords: [
      { id: 'f1', batchOperationId: '2', targetId: 'p1', targetName: '恒大名都3号楼', errorMessage: '项目状态不支持此操作', assignee: '2', assigneeName: '李经理', resolved: false, createdAt: '2024-01-19T14:00:00' },
      { id: 'f2', batchOperationId: '2', targetId: 'p2', targetName: '融创滨江壹号', errorMessage: '项目已完成，无法更新状态', assignee: '', assigneeName: '', resolved: true, createdAt: '2024-01-19T14:00:00' },
    ],
    operatorId: '2',
    operatorName: '李经理',
    createdAt: '2024-01-19T14:00:00',
    completedAt: '2024-01-19T14:00:10',
  },
  {
    id: '3',
    type: 'notify_owner',
    status: 'completed',
    totalCount: 10,
    successCount: 10,
    failedCount: 0,
    targetIds: [],
    failedRecords: [],
    operatorId: '6',
    operatorName: '赵客服',
    createdAt: '2024-01-18T09:30:00',
    completedAt: '2024-01-18T09:30:08',
  },
]

onMounted(() => {
  fetchOperations()
  fetchInspectors()
  fetchProjects()
})

definePageMeta({ layout: 'default' })
</script>
