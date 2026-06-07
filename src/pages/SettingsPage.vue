<script setup lang="ts">
import { ref, computed } from 'vue'
import { Settings, Calendar, Plus, Trash2, RotateCcw, Ban } from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import NavBar from '@/components/NavBar.vue'

const dataStore = useDataStore()

const newHoliday = ref({
  date: '',
  name: '',
  isWorkday: false
})

const showAddForm = ref(false)

const holidayList = computed(() => {
  return [...dataStore.holidays]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-50)
})

const holidayStats = computed(() => {
  const holidays = dataStore.holidays.filter(h => !h.isWorkday)
  const workdays = dataStore.holidays.filter(h => h.isWorkday)
  return {
    total: dataStore.holidays.length,
    holidays: holidays.length,
    workdays: workdays.length
  }
})

function handleAddHoliday() {
  if (!newHoliday.value.date || !newHoliday.value.name) return

  dataStore.addHoliday(
    newHoliday.value.date,
    newHoliday.value.name,
    newHoliday.value.isWorkday
  )

  newHoliday.value = { date: '', name: '', isWorkday: false }
  showAddForm.value = false
}

function handleRemoveHoliday(date: string) {
  dataStore.removeHoliday(date)
}

function handleResetData() {
  if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
    dataStore.resetData()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <NavBar />

    <div class="flex-1 p-4 md:p-6">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings class="w-7 h-7 text-gray-600" />
              系统设置
            </h1>
            <p class="text-gray-500 mt-1">配置节假日和系统参数</p>
          </div>
          <button class="btn-secondary" @click="handleResetData">
            <RotateCcw class="w-4 h-4 mr-1" />
            重置数据
          </button>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="card p-4">
            <p class="text-sm text-gray-500 mb-1">配置总数</p>
            <p class="text-2xl font-bold text-gray-900">{{ holidayStats.total }}</p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-gray-500 mb-1">节假日</p>
            <p class="text-2xl font-bold text-red-600">{{ holidayStats.holidays }}</p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-gray-500 mb-1">调休工作日</p>
            <p class="text-2xl font-bold text-green-600">{{ holidayStats.workdays }}</p>
          </div>
        </div>

        <div class="card mb-6">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar class="w-5 h-5 text-teal-600" />
              节假日清运计划
            </h2>
            <button
              v-if="!showAddForm"
              class="btn-primary !py-1.5 !text-sm"
              @click="showAddForm = true"
            >
              <Plus class="w-4 h-4 mr-1" />
              添加配置
            </button>
          </div>

          <Transition name="slide-up">
            <div v-if="showAddForm" class="p-4 bg-gray-50 border-b border-gray-100">
              <h3 class="font-medium text-gray-900 mb-3">添加节假日配置</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
                  <input
                    v-model="newHoliday.date"
                    type="date"
                    class="input"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    v-model="newHoliday.name"
                    type="text"
                    placeholder="如：元旦、春节"
                    class="input"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <select v-model="newHoliday.isWorkday" class="select">
                    <option :value="false">节假日（停运）</option>
                    <option :value="true">调休工作日</option>
                  </select>
                </div>
              </div>
              <div class="flex gap-2">
                <button class="btn-primary" @click="handleAddHoliday">
                  <Plus class="w-4 h-4 mr-1" />
                  添加
                </button>
                <button class="btn-secondary" @click="showAddForm = false">
                  取消
                </button>
              </div>
            </div>
          </Transition>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-4 py-3 font-medium text-gray-600">日期</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-600">名称</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-600">类型</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="holiday in holidayList" :key="holiday.date" class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ holiday.date }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ holiday.name }}</td>
                  <td class="px-4 py-3">
                    <span :class="holiday.isWorkday ? 'badge-success' : 'badge-danger'">
                      {{ holiday.isWorkday ? '工作日' : '节假日' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      class="text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                      @click="handleRemoveHoliday(holiday.date)"
                    >
                      <Trash2 class="w-4 h-4" />
                      删除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card p-6 bg-amber-50 border-amber-200">
          <h3 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Ban class="w-5 h-5 text-amber-600" />
            节假日说明
          </h3>
          <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>节假日期间的清运数据会被排除，不纳入效率计算</li>
            <li>清运效率分析页面支持手动开关是否排除节假日</li>
            <li>社区排名仅使用已审核通过的数据，不受节假日影响</li>
            <li>系统已预置全年周末和主要节假日配置</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
