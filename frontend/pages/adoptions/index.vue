<template>
  <div class="adoptions-page space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">领养申请管理</h1>
        <p class="text-sm text-gray-500 mt-1">审核和管理所有领养申请</p>
      </div>
      <div class="flex items-center gap-2">
        <n-button size="small">
          <template #icon>
            <n-icon>
              <DownloadSharp />
            </n-icon>
          </template>
          导出数据
        </n-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">待审核</div>
            <div class="text-3xl font-bold text-gray-800 mt-2">{{ adoptionsStore.stats.pending }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <n-icon :size="24" color="#F59E0B">
              <TimeSharp />
            </n-icon>
          </div>
        </div>
      </div>
      <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">已通过</div>
            <div class="text-3xl font-bold text-gray-800 mt-2">{{ adoptionsStore.stats.approved }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <n-icon :size="24" color="#10B981">
              <CheckmarkCircleSharp />
            </n-icon>
          </div>
        </div>
      </div>
      <div class="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-5 border border-rose-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">已驳回</div>
            <div class="text-3xl font-bold text-gray-800 mt-2">{{ adoptionsStore.stats.rejected }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
            <n-icon :size="24" color="#F43F5E">
              <CloseCircleSharp />
            </n-icon>
          </div>
        </div>
      </div>
      <div class="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">申请总数</div>
            <div class="text-3xl font-bold text-gray-800 mt-2">{{ adoptionsStore.stats.total }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <n-icon :size="24" color="#6366F1">
              <DocumentsSharp />
            </n-icon>
          </div>
        </div>
      </div>
    </div>

    <n-card class="!rounded-2xl !border-0" content-style="padding: 0;">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
        <n-tabs v-model:value="activeTab" type="line" size="medium" class="flex-shrink-0">
          <n-tab-pane name="pending" tab="待审核">
            <template #tab>
              <div class="flex items-center gap-2">
                <span>待审核</span>
                <n-badge :value="adoptionsStore.stats.pending" :max="99" color="#F59E0B" show-zero />
              </div>
            </template>
          </n-tab-pane>
          <n-tab-pane name="approved" tab="已通过">
            <template #tab>
              <div class="flex items-center gap-2">
                <span>已通过</span>
                <n-badge :value="adoptionsStore.stats.approved" :max="99" color="#10B981" show-zero />
              </div>
            </template>
          </n-tab-pane>
          <n-tab-pane name="rejected" tab="已驳回">
            <template #tab>
              <div class="flex items-center gap-2">
                <span>已驳回</span>
                <n-badge :value="adoptionsStore.stats.rejected" :max="99" color="#F43F5E" show-zero />
              </div>
            </template>
          </n-tab-pane>
        </n-tabs>

        <div class="flex items-center gap-3 flex-shrink-0">
          <n-input
            v-model:value="searchKeyword"
            placeholder="搜索申请人/宠物"
            clearable
            size="small"
            class="!w-56"
          >
            <template #prefix>
              <n-icon>
                <SearchSharp />
              </n-icon>
            </template>
          </n-input>
          <n-date-picker
            v-model:value="dateRange"
            type="daterange"
            size="small"
            clearable
            placeholder="申请时间"
          />
        </div>
      </div>

      <n-data-table
        :columns="columns"
        :data="filteredApplications"
        :pagination="pagination"
        :bordered="false"
        size="medium"
        class="application-table"
      >
        <template #empty>
          <n-empty description="暂无申请数据" />
        </template>
      </n-data-table>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import type { AdoptionApplication } from '~/stores/adoptions'
import {
  TimeSharp,
  CheckmarkCircleSharp,
  CloseCircleSharp,
  DocumentsSharp,
  SearchSharp,
  DownloadSharp,
  EyeSharp,
  CheckmarkSharp,
  CloseSharp,
  AlertCircleSharp,
  CallSharp,
  PawSharp,
} from '@vicons/ionicons5'

const adoptionsStore = useAdoptionsStore()
const router = useRouter()
const message = useMessage()

const activeTab = ref<'pending' | 'approved' | 'rejected'>('pending')
const searchKeyword = ref('')
const dateRange = ref<[number, number] | null>(null)

const statusConfig = {
  pending: { label: '待审核', type: 'warning' as const, icon: TimeSharp, color: '#F59E0B' },
  approved: { label: '已通过', type: 'success' as const, icon: CheckmarkCircleSharp, color: '#10B981' },
  rejected: { label: '已驳回', type: 'error' as const, icon: CloseCircleSharp, color: '#F43F5E' },
  supplement: { label: '待补充', type: 'info' as const, icon: AlertCircleSharp, color: '#6366F1' },
}

const currentList = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return adoptionsStore.pendingApplications
    case 'approved':
      return adoptionsStore.approvedApplications
    case 'rejected':
      return adoptionsStore.rejectedApplications
    default:
      return adoptionsStore.pendingApplications
  }
})

const filteredApplications = computed(() => {
  let list = [...currentList.value]

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(
      (app) =>
        app.applicant.name.toLowerCase().includes(keyword) ||
        app.pet.name.toLowerCase().includes(keyword) ||
        app.pet.breed.toLowerCase().includes(keyword)
    )
  }

  return list
})

const pagination = ref({
  pageSize: 10,
})

const columns: DataTableColumns<AdoptionApplication> = [
  {
    title: '申请编号',
    key: 'id',
    width: 160,
    render: (row) =>
      h('span', { class: 'font-mono text-sm text-gray-700' }, row.id),
  },
  {
    title: '申请人',
    key: 'applicant',
    width: 200,
    render: (row) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h(
          'div',
          {
            class:
              'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0',
            style: { backgroundColor: getAvatarColor(row.applicant.name) },
          },
          row.applicant.name.charAt(0)
        ),
        h('div', { class: 'min-w-0' }, [
          h('div', { class: 'font-medium text-gray-800 text-sm truncate' }, row.applicant.name),
          h(
            'div',
            { class: 'flex items-center gap-1 text-xs text-gray-500 mt-0.5' },
            [
              h('n-icon', { size: 12 }, () => h(CallSharp)),
              row.applicant.phone,
            ]
          ),
        ]),
      ]),
  },
  {
    title: '宠物信息',
    key: 'pet',
    width: 200,
    render: (row) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h(
          'div',
          {
            class:
              'w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0',
          },
          [h('n-icon', { size: 18, color: '#EC4899' }, () => h(PawSharp))]
        ),
        h('div', { class: 'min-w-0' }, [
          h('div', { class: 'font-medium text-gray-800 text-sm truncate' }, row.pet.name),
          h('div', { class: 'text-xs text-gray-500 mt-0.5 truncate' }, `${row.pet.breed} · ${row.pet.age}`),
        ]),
      ]),
  },
  {
    title: '申请时间',
    key: 'applyTime',
    width: 170,
    render: (row) =>
      h('div', { class: 'text-sm text-gray-600' }, row.applyTime),
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: (row) => {
      const config = statusConfig[row.status]
      return h(
        'div',
        {
          class: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          style: {
            backgroundColor: config.color + '15',
            color: config.color,
          },
        },
        [
          h('n-icon', { size: 14 }, () => h(config.icon)),
          config.label,
        ]
      )
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right',
    render: (row) =>
      h('div', { class: 'flex items-center gap-1' }, [
        h(
          'n-button',
          {
            size: 'small',
            type: 'primary',
            ghost: true,
            onClick: () => handleView(row),
          },
          {
            icon: () => h('n-icon', { size: 14 }, () => h(EyeSharp)),
            default: () => '审核',
          }
        ),
        row.status === 'pending' || row.status === 'supplement'
          ? h(
              'n-button',
              {
                size: 'small',
                type: 'success',
                ghost: true,
                onClick: () => handleQuickApprove(row),
              },
              {
                icon: () => h('n-icon', { size: 14 }, () => h(CheckmarkSharp)),
                default: () => '通过',
              }
            )
          : null,
        row.status === 'pending' || row.status === 'supplement'
          ? h(
              'n-button',
              {
                size: 'small',
                type: 'error',
                ghost: true,
                onClick: () => handleQuickReject(row),
              },
              {
                icon: () => h('n-icon', { size: 14 }, () => h(CloseSharp)),
                default: () => '驳回',
              }
            )
          : null,
      ]),
  },
]

function getAvatarColor(name: string) {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#F97316']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function handleView(row: AdoptionApplication) {
  router.push(`/adoptions/${row.id}`)
}

function handleQuickApprove(row: AdoptionApplication) {
  adoptionsStore.reviewApplication(row.id, 'approved', '快速审核通过')
  message.success(`已通过 ${row.applicant.name} 的领养申请`)
}

function handleQuickReject(row: AdoptionApplication) {
  adoptionsStore.reviewApplication(row.id, 'rejected', '快速审核驳回')
  message.warning(`已驳回 ${row.applicant.name} 的领养申请`)
}
</script>

<style scoped>
.adoptions-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

:deep(.application-table .n-data-table-tr:hover .n-data-table-td) {
  background-color: #F9FAFB;
}

:deep(.application-table .n-data-table .n-data-table-th) {
  background-color: #F9FAFB;
  font-weight: 600;
  color: #374151;
}
</style>
