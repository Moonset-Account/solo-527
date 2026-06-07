<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { usePrivacyStore } from '@/stores/privacy'
import type { CategoryRule } from '@/types'
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Shield, User } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const privacyStore = usePrivacyStore()

onMounted(() => {
  privacyStore.loadRules()
})

const showAddForm = ref(false)
const newRule = ref<Omit<CategoryRule, 'id'>>({
  keyword: '',
  category: '购物',
  subCategory: '',
  scope: 'personal',
  priority: 10,
  memberId: '爸爸',
})

const categories = ['收入', '固定支出', '订阅', '购物', '旅行', '信用卡']
const subCategoryMap: Record<string, string[]> = {
  '收入': ['工资', '奖金', '投资收益', '兼职'],
  '固定支出': ['房租/房贷', '水电燃气', '物业费', '保险'],
  '订阅': ['流媒体', '音乐', '云存储', '健身房', '软件'],
  '购物': ['服装', '日用品', '电子产品', '食品饮料'],
  '旅行': ['机票', '酒店', '景点门票', '旅行餐饮'],
  '信用卡': ['还款', '分期'],
}

const availableSubs = computed(() => subCategoryMap[newRule.value.category] || [])

function addNewRule() {
  if (!newRule.value.keyword) return
  privacyStore.addNewRule({
    id: `r-${Date.now()}`,
    ...newRule.value,
  })
  showAddForm.value = false
  newRule.value = {
    keyword: '',
    category: '购物',
    subCategory: '',
    scope: 'personal',
    priority: 10,
    memberId: '爸爸',
  }
}

function deleteRule(id: string) {
  privacyStore.removeRule(id)
}
</script>

<template>
  <div class="min-h-screen bg-base-900">
    <header class="bg-base-900/95 backdrop-blur border-b border-surface-border px-6 py-3">
      <div class="max-w-[1200px] mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/" class="btn-ghost text-sm flex items-center gap-1.5">
            <ArrowLeft :size="14" />
            返回工作台
          </RouterLink>
          <h1 class="font-display text-xl text-white">分类规则管理</h1>
        </div>
      </div>
    </header>

    <main class="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Shield :size="18" class="text-accent" />
            <h2 class="font-display text-lg text-white">家庭共享规则</h2>
            <span class="badge-accent">{{ privacyStore.sharedRules.length }}</span>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-border">
                <th class="text-left py-2 px-3 text-base-500 font-medium">关键词</th>
                <th class="text-left py-2 px-3 text-base-500 font-medium">分类</th>
                <th class="text-left py-2 px-3 text-base-500 font-medium">子分类</th>
                <th class="text-left py-2 px-3 text-base-500 font-medium">优先级</th>
                <th class="text-left py-2 px-3 text-base-500 font-medium">创建者</th>
                <th class="text-right py-2 px-3 text-base-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="rule in privacyStore.sharedRules"
                :key="rule.id"
                class="border-b border-surface-border/50 hover:bg-surface-light/50 transition-colors"
              >
                <td class="py-2.5 px-3 text-white font-medium">{{ rule.keyword }}</td>
                <td class="py-2.5 px-3">{{ rule.category }}</td>
                <td class="py-2.5 px-3 text-base-500">{{ rule.subCategory }}</td>
                <td class="py-2.5 px-3">
                  <span class="badge-info">{{ rule.priority }}</span>
                </td>
                <td class="py-2.5 px-3 text-base-500">{{ rule.memberId }}</td>
                <td class="py-2.5 px-3 text-right">
                  <button
                    class="text-danger/60 hover:text-danger transition-colors"
                    @click="deleteRule(rule.id)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </td>
              </tr>
              <tr v-if="privacyStore.sharedRules.length === 0">
                <td colspan="6" class="py-8 text-center text-base-500">暂无共享规则</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <User :size="18" class="text-warn" />
            <h2 class="font-display text-lg text-white">个人规则</h2>
            <span class="badge-warn">{{ privacyStore.personalRules.length }}</span>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-border">
                <th class="text-left py-2 px-3 text-base-500 font-medium">关键词</th>
                <th class="text-left py-2 px-3 text-base-500 font-medium">分类</th>
                <th class="text-left py-2 px-3 text-base-500 font-medium">子分类</th>
                <th class="text-left py-2 px-3 text-base-500 font-medium">优先级</th>
                <th class="text-left py-2 px-3 text-base-500 font-medium">创建者</th>
                <th class="text-right py-2 px-3 text-base-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="rule in privacyStore.personalRules"
                :key="rule.id"
                class="border-b border-surface-border/50 hover:bg-surface-light/50 transition-colors"
              >
                <td class="py-2.5 px-3 text-white font-medium">{{ rule.keyword }}</td>
                <td class="py-2.5 px-3">{{ rule.category }}</td>
                <td class="py-2.5 px-3 text-base-500">{{ rule.subCategory }}</td>
                <td class="py-2.5 px-3">
                  <span class="badge-info">{{ rule.priority }}</span>
                </td>
                <td class="py-2.5 px-3 text-base-500">{{ rule.memberId }}</td>
                <td class="py-2.5 px-3 text-right">
                  <button
                    class="text-danger/60 hover:text-danger transition-colors"
                    @click="deleteRule(rule.id)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </td>
              </tr>
              <tr v-if="privacyStore.personalRules.length === 0">
                <td colspan="6" class="py-8 text-center text-base-500">暂无个人规则</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <component :is="privacyStore.showPersonalDetails ? Eye : EyeOff" :size="18" class="text-info" />
            <h2 class="font-display text-lg text-white">隐私控制</h2>
          </div>
          <button
            class="btn-ghost text-sm"
            @click="privacyStore.togglePersonalVisibility"
          >
            {{ privacyStore.showPersonalDetails ? '隐藏' : '显示' }}个人明细
          </button>
        </div>
        <p class="text-sm text-base-500">
          当前状态：个人账户明细在家庭视图中
          <span :class="privacyStore.showPersonalDetails ? 'text-accent' : 'text-danger'" class="font-medium">
            {{ privacyStore.showPersonalDetails ? '可见' : '已隐藏' }}
          </span>
        </p>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-lg text-white">添加规则</h2>
          <button
            v-if="!showAddForm"
            class="btn-primary text-sm flex items-center gap-1.5"
            @click="showAddForm = true"
          >
            <Plus :size="14" />
            新增规则
          </button>
        </div>
        <form v-if="showAddForm" @submit.prevent="addNewRule" class="space-y-4">
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-base-500 mb-1">关键词</label>
              <input
                v-model="newRule.keyword"
                type="text"
                class="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:border-accent focus:outline-none transition-colors"
                placeholder="输入商户或描述关键词"
                required
              />
            </div>
            <div>
              <label class="block text-xs text-base-500 mb-1">分类</label>
              <select
                v-model="newRule.category"
                class="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:border-accent focus:outline-none transition-colors"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-base-500 mb-1">子分类</label>
              <select
                v-model="newRule.subCategory"
                class="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:border-accent focus:outline-none transition-colors"
              >
                <option value="">自动</option>
                <option v-for="sub in availableSubs" :key="sub" :value="sub">{{ sub }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-base-500 mb-1">范围</label>
              <select
                v-model="newRule.scope"
                class="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:border-accent focus:outline-none transition-colors"
              >
                <option value="shared">家庭共享</option>
                <option value="personal">个人规则</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-base-500 mb-1">创建者</label>
              <select
                v-model="newRule.memberId"
                class="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:border-accent focus:outline-none transition-colors"
              >
                <option value="爸爸">爸爸</option>
                <option value="妈妈">妈妈</option>
                <option value="孩子">孩子</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-base-500 mb-1">优先级</label>
              <input
                v-model.number="newRule.priority"
                type="number"
                min="1"
                max="99"
                class="w-full bg-surface-light border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button type="submit" class="btn-primary text-sm">确认添加</button>
            <button type="button" class="btn-ghost text-sm" @click="showAddForm = false">取消</button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>
