<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { RadarChart, BarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Plus, Edit2, Search } from 'lucide-vue-next'
import { useTagsStore } from '@/stores/tags'
import type { Tag, TagQueryLogic } from '@/types'

use([RadarChart, BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const tagsStore = useTagsStore()
const selectedTagId = ref<string | null>(null)
const showCreateModal = ref(false)
const showBatchModal = ref(false)
const editingTag = ref<Partial<Tag> | null>(null)

const batchTagIds = ref<string[]>([])
const batchLogic = ref<TagQueryLogic>('AND')
const batchResult = ref<{ count: number } | null>(null)

const tagGroups = computed(() => {
  const groups: Record<string, Tag[]> = {}
  tagsStore.list.forEach((tag) => {
    if (!groups[tag.group]) groups[tag.group] = []
    groups[tag.group].push(tag)
  })
  return groups
})

const radarOption = computed(() => {
  if (!tagsStore.tagProfile?.radar?.length) return {}
  const radar = tagsStore.tagProfile.radar
  return {
    radar: {
      indicator: radar.map((r) => ({ name: r.axis, max: 100 })),
      shape: 'circle' as const,
      splitNumber: 4,
      axisName: { color: '#64748B', fontSize: 11 },
    },
    series: [{
      type: 'radar',
      data: [{ value: radar.map((r) => r.value), name: '标签画像', areaStyle: { color: 'rgba(245,158,11,0.2)' }, lineStyle: { color: '#F59E0B' }, itemStyle: { color: '#F59E0B' } }],
    }],
  }
})

const distOption = computed(() => {
  if (!tagsStore.tagProfile?.distribution?.length) return {}
  const dist = tagsStore.tagProfile.distribution
  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 60, right: 20, top: 10, bottom: 30 },
    xAxis: { type: 'category' as const, data: dist.map((d) => d.source), axisLabel: { color: '#64748B', fontSize: 11 } },
    yAxis: { type: 'value' as const, axisLabel: { color: '#64748B' } },
    series: [{
      type: 'bar',
      data: dist.map((d) => ({ value: d.count, itemStyle: { color: '#F59E0B', borderRadius: [4, 4, 0, 0] } })),
      barWidth: 24,
    }],
  }
})

function selectTag(id: string, name: string) {
  selectedTagId.value = id
  tagsStore.fetchProfile(name)
}

function openCreate() {
  editingTag.value = { name: '', color: '#F59E0B', group: '默认', enabled: true }
  showCreateModal.value = true
}

async function saveTag() {
  if (!editingTag.value) return
  if (editingTag.value.id) {
    await tagsStore.updateTag(editingTag.value.id, editingTag.value)
  } else {
    await tagsStore.createTag(editingTag.value)
  }
  showCreateModal.value = false
  await tagsStore.fetchList()
}

async function runBatchQuery() {
  const result = await tagsStore.batchQuery(batchTagIds.value, batchLogic.value)
  batchResult.value = result
}

onMounted(() => tagsStore.fetchList())
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">标签管理</h1>
      <div class="flex items-center gap-2">
        <button
          class="px-4 py-2 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 flex items-center gap-1"
          @click="openCreate"
        >
          <Plus class="w-4 h-4" /> 新建标签
        </button>
        <button
          class="px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50 flex items-center gap-1"
          @click="showBatchModal = true"
        >
          <Search class="w-4 h-4" /> 批量查询
        </button>
      </div>
    </div>

    <div class="grid grid-cols-5 gap-6">
      <div class="col-span-2 space-y-4">
        <div
          v-for="(groupTags, groupName) in tagGroups"
          :key="groupName"
          class="bg-white rounded-lg border border-slate-200 p-4"
        >
          <h3 class="font-medium text-slate-800 mb-3 text-sm">{{ groupName }}</h3>
          <div class="space-y-2">
            <div
              v-for="tag in groupTags"
              :key="tag.id"
              class="flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors"
              :class="selectedTagId === tag.id ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50'"
              @click="selectTag(tag.id, tag.name)"
            >
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: tag.color }"></span>
                <span class="text-sm text-slate-700">{{ tag.name }}</span>
                <span v-if="tag.leadCount" class="text-xs text-slate-400">({{ tag.leadCount }})</span>
              </div>
              <div class="flex items-center gap-1">
                <button class="p-0.5 rounded hover:bg-slate-100" @click.stop="editingTag = { ...tag }; showCreateModal = true">
                  <Edit2 class="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-3 space-y-4">
        <div v-if="selectedTagId && tagsStore.tagProfile" class="space-y-4">
          <div class="bg-white rounded-lg border border-slate-200 p-5">
            <h3 class="font-medium text-slate-800 mb-4">标签画像</h3>
            <VChart v-if="tagsStore.tagProfile.radar?.length" :option="radarOption" style="height: 280px" autoresize />
            <div v-else class="text-center text-slate-400 py-8">暂无画像数据</div>
          </div>
          <div class="bg-white rounded-lg border border-slate-200 p-5">
            <h3 class="font-medium text-slate-800 mb-4">来源分布</h3>
            <VChart v-if="tagsStore.tagProfile.distribution?.length" :option="distOption" style="height: 250px" autoresize />
            <div v-else class="text-center text-slate-400 py-8">暂无分布数据</div>
          </div>
        </div>
        <div v-else class="bg-white rounded-lg border border-slate-200 p-16 text-center text-slate-400">
          请选择左侧标签查看详情
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="showCreateModal = false" />
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
          <h3 class="font-medium text-slate-800 mb-4">{{ editingTag?.id ? '编辑标签' : '新建标签' }}</h3>
          <form @submit.prevent="saveTag" class="space-y-4">
            <div>
              <label class="block text-sm text-slate-700 mb-1">标签名称</label>
              <input v-model="editingTag!.name" class="w-full h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">颜色</label>
              <input v-model="editingTag!.color" type="color" class="w-12 h-9 rounded border border-slate-300" />
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-1">分组</label>
              <input v-model="editingTag!.group" class="w-full h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </div>
            <div class="flex justify-end gap-3">
              <button type="button" class="px-4 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50" @click="showCreateModal = false">取消</button>
              <button type="submit" class="px-4 py-2 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600">保存</button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showBatchModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="showBatchModal = false" />
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <h3 class="font-medium text-slate-800 mb-4">批量标签查询</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-slate-700 mb-2">选择标签</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in tagsStore.list"
                  :key="tag.id"
                  class="px-2 py-1 text-xs rounded-md border transition-colors"
                  :class="batchTagIds.includes(tag.id) ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                  @click="batchTagIds.includes(tag.id) ? batchTagIds = batchTagIds.filter(id => id !== tag.id) : batchTagIds.push(tag.id)"
                >
                  {{ tag.name }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm text-slate-700 mb-2">逻辑关系</label>
              <div class="flex gap-2">
                <button
                  class="px-3 py-1 text-sm rounded-md border"
                  :class="batchLogic === 'AND' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-600'"
                  @click="batchLogic = 'AND'"
                >AND（且）</button>
                <button
                  class="px-3 py-1 text-sm rounded-md border"
                  :class="batchLogic === 'OR' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-600'"
                  @click="batchLogic = 'OR'"
                >OR（或）</button>
              </div>
            </div>
            <button
              class="w-full py-2 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
              :disabled="!batchTagIds.length"
              @click="runBatchQuery"
            >
              查询
            </button>
            <div v-if="batchResult" class="p-3 bg-slate-50 rounded-md text-sm text-slate-700">
              匹配线索数：<span class="font-medium text-amber-600">{{ batchResult.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
