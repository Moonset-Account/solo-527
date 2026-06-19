<template>
  <div>
    <PageHeader title="规则管理" subtitle="配置系统业务规则" />
    <a-card>
      <div class="mb-4">
        <a-select
          v-model:value="categoryFilter"
          placeholder="选择分类"
          style="width: 200px"
          allow-clear
          @change="loadData"
        >
          <a-select-option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </a-select-option>
        </a-select>
      </div>
      <a-row :gutter="16">
        <a-col :span="12" v-for="item in data" :key="item.id">
          <a-card class="mb-4">
            <div
              class="cursor-pointer"
              @click="toggleExpand(item.id)"
            >
              <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-lg font-semibold m-0">{{ item.name }}</h3>
                    <a-tag color="blue">{{ item.code }}</a-tag>
                    <a-tag>{{ item.category }}</a-tag>
                  </div>
                  <p class="text-gray-500 text-sm mb-2">{{ item.description || '-' }}</p>
                  <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span>生效时间：{{ item.effectiveTime || '-' }}</span>
                  </div>
                </div>
                <a-switch
                  :checked="item.enabled"
                  @click.stop="handleToggle(item)"
                />
              </div>
            </div>
            <a-collapse v-if="expandedId === item.id" bordered="false">
              <a-collapse-panel key="1" header="启停历史">
                <a-timeline v-if="toggleHistory[item.code]?.length">
                  <a-timeline-item
                    v-for="record in toggleHistory[item.code]"
                    :key="record.id"
                    :color="record.enabled ? 'green' : 'red'"
                  >
                    <div class="flex justify-between">
                      <div>
                        <span class="font-medium">{{ record.operator }}</span>
                        <span class="text-gray-500 ml-2">
                          {{ record.enabled ? '启用' : '停用' }}
                        </span>
                      </div>
                      <div class="text-gray-500 text-sm">
                        操作时间：{{ record.operateTime }}
                      </div>
                    </div>
                    <div class="text-gray-500 text-sm mt-1">
                      生效时间：{{ record.effectiveTime }}
                    </div>
                  </a-timeline-item>
                </a-timeline>
                <a-empty v-else description="暂无启停历史" />
              </a-collapse-panel>
            </a-collapse>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
    <a-modal
      v-model:open="toggleModalVisible"
      :title="toggleEnabled ? '启用规则' : '停用规则'"
      @ok="confirmToggle"
      :confirm-loading="toggling"
    >
      <p>确定要{{ toggleEnabled ? '启用' : '停用' }}规则「{{ toggleRule?.name }}」吗？</p>
      <p class="text-orange-500">
        生效时间：{{ toggleEffectiveTime }}
      </p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import {
  getRuleList,
  getRuleCategories,
  toggleRule as toggleRuleApi,
  getRuleToggleHistory
} from '@/api/rules'
import type { Rule } from '@/types'
import type { TablePaginationConfig } from 'ant-design-vue'

interface RuleExt extends Rule {
  effectiveTime?: string
}

const categoryFilter = ref<string>()
const data = ref<RuleExt[]>([])
const categories = ref<string[]>([])
const pagination = ref<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 })
const expandedId = ref<number | null>(null)
const toggleModalVisible = ref(false)
const toggleEnabled = ref(false)
const toggleRule = ref<RuleExt | null>(null)
const toggleEffectiveTime = ref('')
const toggling = ref(false)

const toggleHistory = reactive<Record<string, any[]>>({})

const loadData = async () => {
  try {
    const res = await getRuleList({
      page: pagination.value.current || 1,
      pageSize: pagination.value.pageSize || 10,
      category: categoryFilter.value
    })
    data.value = res.list.map(item => ({
      ...item,
      effectiveTime: (item as any).effectiveTime || item.updatedAt
    }))
    pagination.value.total = res.total
  } catch (e) {
    message.error('加载数据失败')
  }
}

const loadCategories = async () => {
  try {
    categories.value = await getRuleCategories()
  } catch (e) {
    message.error('加载分类失败')
  }
}

const loadToggleHistory = async (ruleCode: string) => {
  if (toggleHistory[ruleCode]) return
  try {
    toggleHistory[ruleCode] = await getRuleToggleHistory(ruleCode)
  } catch (e) {
    message.error('加载历史记录失败')
  }
}

const toggleExpand = async (id: number) => {
  if (expandedId.value === id) {
    expandedId.value = null
    return
  }
  expandedId.value = id
  const rule = data.value.find(r => r.id === id)
  if (rule) {
    await loadToggleHistory(rule.code)
  }
}

const handleToggle = (item: RuleExt) => {
  toggleRule.value = item
  toggleEnabled.value = !item.enabled
  toggleEffectiveTime.value = dayjs().add(5, 'minute').format('YYYY-MM-DD HH:mm:ss')
  toggleModalVisible.value = true
}

const confirmToggle = async () => {
  if (!toggleRule.value) return
  try {
    toggling.value = true
    await toggleRuleApi({
      ruleCode: toggleRule.value!.code,
      enabled: toggleEnabled.value
    })
    message.success(`${toggleEnabled.value ? '启用' : '停用'}成功`)
    toggleModalVisible.value = false
    loadData()
    if (toggleHistory[toggleRule.value.code]) {
      delete toggleHistory[toggleRule.value.code]
      loadToggleHistory(toggleRule.value.code)
    }
  } catch (e) {
    message.error('操作失败')
  } finally {
    toggling.value = false
  }
}

onMounted(() => {
  loadData()
  loadCategories()
})
</script>
