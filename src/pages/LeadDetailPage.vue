<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Phone, MapPin, Home, Ruler, Calendar, Tag, User,
  ArrowLeft, Clock, ChevronRight, Plus,
} from 'lucide-vue-next'
import { useLeadsStore } from '@/stores/leads'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { LeadStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const leadsStore = useLeadsStore()

const leadId = computed(() => String(route.params.id))
const lead = computed(() => leadsStore.selectedLead)

const statusTimeline = computed(() => {
  if (!lead.value) return []
  const statuses: { status: LeadStatus; label: string; color: string }[] = [
    { status: 'new', label: '新线索', color: 'bg-blue-500' },
    { status: 'contacted', label: '已联系', color: 'bg-amber-500' },
    { status: 'measured', label: '已量房', color: 'bg-cyan-500' },
    { status: 'quoted', label: '已报价', color: 'bg-purple-500' },
    { status: 'contracted', label: '已签约', color: 'bg-emerald-500' },
  ]
  const currentIdx = statuses.findIndex((s) => s.status === lead.value?.status)
  return statuses.map((s, i) => ({
    ...s,
    reached: i <= currentIdx,
  }))
})

const showStatusModal = ref(false)
const showAssignModal = ref(false)
const showScheduleMeasure = ref(false)

const recentFollowups = ref([
  { id: 1, date: '2026-06-15', type: '电话回访', result: '客户表示近期有装修意向，需安排量房', assigneeName: '张三' },
  { id: 2, date: '2026-06-10', type: '微信跟进', result: '已发送户型图，等待客户确认', assigneeName: '张三' },
  { id: 3, date: '2026-06-05', type: '初次联系', result: '客户了解基本情况，需进一步沟通', assigneeName: '李四' },
])

async function changeStatus(status: LeadStatus) {
  await leadsStore.changeStatus(leadId.value, status)
  showStatusModal.value = false
}

onMounted(() => {
  leadsStore.fetchDetail(leadId.value)
})
</script>

<template>
  <div v-if="lead" class="space-y-6">
    <div class="flex items-center gap-3">
      <button class="p-1.5 rounded-md hover:bg-slate-100" @click="router.push('/leads')">
        <ArrowLeft class="w-5 h-5 text-slate-600" />
      </button>
      <h1 class="text-xl font-semibold text-slate-800">{{ lead.customerName }}</h1>
      <StatusBadge :status="lead.status" />
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 space-y-4">
        <div class="bg-white rounded-lg border border-slate-200 p-5">
          <h3 class="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <User class="w-4 h-4 text-slate-400" /> 客户信息
          </h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><span class="text-slate-500">姓名：</span>{{ lead.customerName }}</div>
            <div class="flex items-center gap-1">
              <span class="text-slate-500">电话：</span>{{ lead.phone }}
              <Phone class="w-3 h-3 text-amber-500" />
            </div>
            <div><span class="text-slate-500">来源：</span>{{ lead.source }}</div>
            <div>
              <span class="text-slate-500">标签：</span>
              <span
                v-for="tag in lead.tags"
                :key="tag"
                class="inline-block px-1.5 py-0.5 rounded text-xs mr-1 bg-amber-100 text-amber-700"
              >
                {{ tag }}
              </span>
            </div>
            <div><span class="text-slate-500">负责人：</span>{{ lead.assignedTo?.name || '未分配' }}</div>
            <div><span class="text-slate-500">创建时间：</span>{{ lead.createdAt }}</div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-5">
          <h3 class="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Home class="w-4 h-4 text-slate-400" /> 装修需求
          </h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><span class="text-slate-500">户型：</span>{{ lead.decorationDemand?.houseType || '未填写' }}</div>
            <div><span class="text-slate-500">面积：</span>{{ lead.decorationDemand?.area ? `${lead.decorationDemand.area}㎡` : '未填写' }}</div>
            <div><span class="text-slate-500">预算：</span>{{ lead.decorationDemand?.budgetRange || '未定' }}</div>
            <div><span class="text-slate-500">风格：</span>{{ lead.decorationDemand?.style || '未定' }}</div>
            <div><span class="text-slate-500">期望开工：</span>{{ lead.decorationDemand?.expectedStartDate || '未定' }}</div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-5">
          <h3 class="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Ruler class="w-4 h-4 text-slate-400" /> 量房信息
          </h3>
          <template v-if="lead.measurementInfo?.measuredAt">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="text-slate-500">量房日期：</span>{{ lead.measurementInfo.measuredAt }}</div>
              <div><span class="text-slate-500">量房人：</span>{{ lead.measurementInfo.measurer }}</div>
              <div><span class="text-slate-500">实际面积：</span>{{ lead.measurementInfo.actualArea }}㎡</div>
              <div><span class="text-slate-500">备注：</span>{{ lead.measurementInfo.structureNote || '无' }}</div>
            </div>
          </template>
          <template v-else>
            <div class="text-center py-6">
              <p class="text-slate-400 text-sm mb-3">尚未安排量房</p>
              <button
                class="px-4 py-2 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 transition-colors"
                @click="showScheduleMeasure = true"
              >
                安排量房
              </button>
            </div>
          </template>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-5">
          <h3 class="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Clock class="w-4 h-4 text-slate-400" /> 状态时间线
          </h3>
          <div class="relative pl-6">
            <div
              v-for="(item, idx) in statusTimeline"
              :key="item.status"
              class="relative pb-6 last:pb-0"
            >
              <div
                class="absolute left-[-1.5rem] top-1 w-3 h-3 rounded-full border-2 border-white"
                :class="item.reached ? item.color : 'bg-slate-200'"
              />
              <div
                v-if="idx < statusTimeline.length - 1"
                class="absolute left-[-0.85rem] top-4 w-0.5 h-full"
                :class="item.reached ? 'bg-slate-400' : 'bg-slate-200'"
              />
              <div class="flex items-center gap-2">
                <span :class="item.reached ? 'text-slate-800 font-medium' : 'text-slate-400'" class="text-sm">
                  {{ item.label }}
                </span>
                <ChevronRight v-if="item.reached" class="w-3 h-3 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="bg-white rounded-lg border border-slate-200 p-5">
          <h3 class="font-medium text-slate-800 mb-3">快捷操作</h3>
          <div class="space-y-2">
            <button
              class="w-full px-4 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
              @click="showStatusModal = true"
            >
              变更状态
            </button>
            <button
              class="w-full px-4 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
              @click="showAssignModal = true"
            >
              转派负责人
            </button>
            <button
              class="w-full px-4 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              添加标签
            </button>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-slate-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-slate-800">近期回访</h3>
            <button class="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
              <Plus class="w-3 h-3" /> 新增
            </button>
          </div>
          <div class="space-y-3">
            <div
              v-for="fu in recentFollowups"
              :key="fu.id"
              class="p-3 bg-slate-50 rounded-md"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-amber-600">{{ fu.type }}</span>
                <span class="text-xs text-slate-400">{{ fu.date }}</span>
              </div>
              <p class="text-sm text-slate-600">{{ fu.result }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ fu.assigneeName }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <Teleport to="body">
      <div v-if="showStatusModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="showStatusModal = false" />
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
          <h3 class="font-medium text-slate-800 mb-4">变更状态</h3>
          <div class="space-y-2">
            <button
              v-for="s in (['new','contacted','measured','quoted','contracted','lost'] as LeadStatus[])"
              :key="s"
              class="w-full px-4 py-2 text-sm rounded-md border border-slate-200 hover:bg-slate-50 text-left transition-colors flex items-center justify-between"
              @click="changeStatus(s)"
            >
              <StatusBadge :status="s" />
              <ChevronRight class="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
