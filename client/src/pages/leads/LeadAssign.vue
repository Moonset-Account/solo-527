<template>
  <div>
    <PageHeader title="线索分配" subtitle="将未分配线索分配给顾问" />
    <a-card>
      <div class="flex gap-4">
        <div class="w-1/2">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-medium">未分配线索 ({{ unassignedLeads.length }})</h3>
            <a-checkbox v-model:checked="selectAll" :indeterminate="indeterminate" @change="onSelectAll">
              全选
            </a-checkbox>
          </div>
          <div class="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            <a-card
              v-for="lead in unassignedLeads"
              :key="lead.id"
              :class="{ 'border-blue-500 bg-blue-50': selectedLeadIds.includes(lead.id) }"
              hoverable
              @click="toggleSelect(lead.id)"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <a-checkbox :checked="selectedLeadIds.includes(lead.id)" @click.stop />
                    <span class="font-medium">{{ lead.customerName }}</span>
                  </div>
                  <div class="text-gray-500 text-sm mt-1">{{ lead.customerPhone }}</div>
                  <div class="flex gap-4 mt-2 text-sm">
                    <span class="text-gray-500">来源：{{ lead.source }}</span>
                    <span class="text-gray-500">意向：{{ lead.intention }}</span>
                  </div>
                </div>
                <a-button type="link" size="small" @click.stop="quickAssign(lead)">
                  快速分配
                </a-button>
              </div>
            </a-card>
            <Empty v-if="unassignedLeads.length === 0" description="暂无可分配线索" />
          </div>
        </div>

        <div class="w-1/2">
          <h3 class="font-medium mb-3">顾问列表</h3>
          <div class="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            <a-card
              v-for="advisor in advisorList"
              :key="advisor.id"
              hoverable
              @click="assignToAdvisor(advisor)"
            >
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <a-avatar :size="40">{{ advisor.name.charAt(0) }}</a-avatar>
                  <div>
                    <div class="font-medium">{{ advisor.name }}</div>
                    <div class="text-gray-500 text-sm">{{ advisor.role }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-blue-500">{{ getTodayAssignCount(advisor.id) }}</div>
                  <div class="text-gray-500 text-xs">今日已分配</div>
                </div>
              </div>
              <div v-if="selectedLeadIds.length > 0" class="mt-3 pt-3 border-t">
                <a-button type="primary" block @click.stop="assignToAdvisor(advisor)">
                  分配 {{ selectedLeadIds.length }} 条线索
                </a-button>
              </div>
            </a-card>
            <Empty v-if="advisorList.length === 0" description="暂无顾问数据" />
          </div>
        </div>
      </div>
    </a-card>

    <a-modal v-model:open="quickAssignModalOpen" title="快速分配" @ok="handleQuickAssign">
      <p class="mb-4">将线索分配给：</p>
      <a-select v-model:value="selectedAdvisor" placeholder="请选择顾问" style="width: 100%">
        <a-select-option v-for="advisor in advisorList" :key="advisor.id" :value="advisor">
          {{ advisor.name }} (今日{{ getTodayAssignCount(advisor.id) }}条)
        </a-select-option>
      </a-select>
    </a-modal>

    <a-modal v-model:open="confirmModalOpen" title="确认分配" @ok="handleConfirmAssign">
      <p>确定将选中的 {{ selectedLeadIds.length }} 条线索分配给 {{ selectedAdvisor?.name }} 吗？</p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import PageHeader from '@/components/PageHeader.vue'
import Empty from '@/components/Empty.vue'
import { getLeadList, batchAssignLeads } from '@/api/leads'
import { getAdvisorList } from '@/api/auth'
import type { Lead, User } from '@/types'

const unassignedLeads = ref<Lead[]>([])
const advisorList = ref<User[]>([])
const selectedLeadIds = ref<number[]>([])
const selectAll = ref(false)
const indeterminate = ref(false)
const quickAssignModalOpen = ref(false)
const confirmModalOpen = ref(false)
const selectedAdvisor = ref<User | null>(null)
const currentLead = ref<Lead | null>(null)
const todayAssignCounts = ref<Record<number, number>>({})

const fetchUnassignedLeads = async () => {
  const res = await getLeadList({ page: 1, pageSize: 100, status: 'pending' })
  unassignedLeads.value = res.list
}

const fetchAdvisors = async () => {
  advisorList.value = await getAdvisorList()
  advisorList.value.forEach(a => {
    todayAssignCounts.value[a.id] = Math.floor(Math.random() * 10)
  })
}

const getTodayAssignCount = (advisorId: number) => {
  return todayAssignCounts.value[advisorId] || 0
}

const toggleSelect = (id: number) => {
  const index = selectedLeadIds.value.indexOf(id)
  if (index > -1) {
    selectedLeadIds.value.splice(index, 1)
  } else {
    selectedLeadIds.value.push(id)
  }
  updateSelectAllStatus()
}

const onSelectAll = (e: any) => {
  if (e.target.checked) {
    selectedLeadIds.value = unassignedLeads.value.map(l => l.id)
  } else {
    selectedLeadIds.value = []
  }
  updateSelectAllStatus()
}

const updateSelectAllStatus = () => {
  const total = unassignedLeads.value.length
  const selected = selectedLeadIds.value.length
  selectAll.value = selected === total && total > 0
  indeterminate.value = selected > 0 && selected < total
}

const quickAssign = (lead: Lead) => {
  currentLead.value = lead
  selectedAdvisor.value = null
  quickAssignModalOpen.value = true
}

const handleQuickAssign = async () => {
  if (!selectedAdvisor.value || !currentLead.value) {
    message.warning('请选择顾问')
    return
  }
  try {
    await batchAssignLeads({
      leadIds: [currentLead.value.id],
      assigneeId: selectedAdvisor.value.id,
      assigneeName: selectedAdvisor.value.name
    })
    message.success('分配成功')
    todayAssignCounts.value[selectedAdvisor.value.id]++
    quickAssignModalOpen.value = false
    selectedLeadIds.value = []
    fetchUnassignedLeads()
  } catch (e) {
    message.error('分配失败')
  }
}

const assignToAdvisor = (advisor: User) => {
  if (selectedLeadIds.value.length === 0) {
    message.warning('请先选择要分配的线索')
    return
  }
  selectedAdvisor.value = advisor
  confirmModalOpen.value = true
}

const handleConfirmAssign = async () => {
  if (!selectedAdvisor.value) return
  try {
    await batchAssignLeads({
      leadIds: selectedLeadIds.value,
      assigneeId: selectedAdvisor.value.id,
      assigneeName: selectedAdvisor.value.name
    })
    message.success(`成功分配 ${selectedLeadIds.value.length} 条线索`)
    todayAssignCounts.value[selectedAdvisor.value.id] += selectedLeadIds.value.length
    confirmModalOpen.value = false
    selectedLeadIds.value = []
    fetchUnassignedLeads()
  } catch (e) {
    message.error('分配失败')
  }
}

onMounted(() => {
  fetchUnassignedLeads()
  fetchAdvisors()
})
</script>
