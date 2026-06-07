<script setup lang="ts">
import { ref } from 'vue'
import CardContainer from '@/components/layout/CardContainer.vue'
import { METRIC_DEFINITIONS } from '@/utils/constants'
import { BookOpen, Clock, Database, ShieldCheck, Hash } from 'lucide-vue-next'

const activeTab = ref<'metrics' | 'time' | 'validate' | 'privacy'>('metrics')

const tabs = [
  { key: 'metrics', name: '指标字典', icon: Hash },
  { key: 'time', name: '时间窗口', icon: Clock },
  { key: 'validate', name: '数据校验', icon: Database },
  { key: 'privacy', name: '隐私说明', icon: ShieldCheck },
]

const timeWindows = [
  { name: '实时', window: '当前小时', description: '数据延迟 < 5 分钟，适用于实时监控预警' },
  { name: '近 24 小时', window: 'T-24h ~ 现在', description: '用于日常运营监控，包含所有已提交样本' },
  { name: '近 7 天', window: 'T-7d ~ 现在', description: '周级质量趋势分析，支持渠道对比' },
  { name: '近 30 天', window: 'T-30d ~ 现在', description: '月度质量复盘，长期趋势观察' },
  { name: '本月', window: '自然月首日 ~ 现在', description: '自然月维度统计，用于月度报告' },
  { name: '自定义', window: '任意时间范围', description: '支持选择任意起止日期，最大跨度 90 天' },
]

const validations = [
  { name: '答题时长校验', rule: '总时长 < 问卷理论最小时长的 50% 或 > 300%', level: '高', levelText: '标记为时长异常' },
  { name: '跳题率校验', rule: '跳题率 > 30% 且 有效答题 < 5 题', level: '中', levelText: '标记为跳题异常' },
  { name: '重复提交校验', rule: '同一 IP + 设备指纹 30 分钟内 > 3 次', level: '高', levelText: '标记为重复提交' },
  { name: 'IP 区域校验', rule: 'IP 归属地与问卷投放区域不匹配', level: '中', levelText: '标记为区域异常' },
  { name: '设备类型校验', rule: '设备类型占比与历史基准偏差 > 2σ', level: '低', levelText: '风险提示' },
  { name: '质检规则命中', rule: '逻辑题、测谎题、重复题回答不一致', level: '高', levelText: '质检标记为不通过' },
  { name: '直线答题检测', rule: '矩阵题答案向量相似度 > 0.9', level: '中', levelText: '质检标记为警告' },
]
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="bg-survey-surface border border-survey-border rounded-lg p-1.5 inline-flex gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key as any"
        class="flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all"
        :class="activeTab === tab.key
          ? 'bg-survey-primary text-white'
          : 'text-survey-text-secondary hover:bg-survey-surface-hover hover:text-survey-text-primary'"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.name }}
      </button>
    </div>

    <CardContainer v-if="activeTab === 'metrics'" title="指标字典">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
          <tr class="border-b border-survey-border">
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary">指标名称</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary">Key</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary">类型</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary">计算方式</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary">说明</th>
          </tr>
          </thead>
          <tbody>
          <tr
            v-for="metric in METRIC_DEFINITIONS"
            :key="metric.key"
            class="border-b border-survey-border/50 hover:bg-survey-surface-hover/50"
          >
            <td class="py-3 px-4 text-survey-text-primary font-medium">{{ metric.name }}</td>
            <td class="py-3 px-4 font-mono text-xs text-survey-text-muted">{{ metric.key }}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 text-xs rounded bg-survey-primary/20 text-survey-primary">
                {{ metric.isPercentage ? '百分比' : '数值' }}
              </span>
            </td>
            <td class="py-3 px-4 text-survey-text-secondary font-mono text-xs">{{ metric.formula }}</td>
            <td class="py-3 px-4 text-survey-text-muted text-xs">{{ metric.description }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </CardContainer>

    <CardContainer v-if="activeTab === 'time'" title="时间窗口说明">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="item in timeWindows"
          :key="item.name"
          class="p-4 bg-survey-bg rounded-lg border border-survey-border/50 hover:border-survey-primary/30 transition-colors"
        >
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-survey-text-primary">{{ item.name }}</h4>
            <span class="text-xs font-mono bg-survey-surface px-2 py-1 rounded text-survey-secondary">{{ item.window }}</span>
          </div>
          <p class="text-sm text-survey-text-muted">{{ item.description }}</p>
        </div>
      </div>
    </CardContainer>

    <CardContainer v-if="activeTab === 'validate'" title="数据校验规则">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
          <tr class="border-b border-survey-border">
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary">校验规则名称</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary">判定规则</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary">风险等级</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary">处理方式</th>
          </tr>
          </thead>
          <tbody>
          <tr
            v-for="v in validations"
            :key="v.name"
            class="border-b border-survey-border/50 hover:bg-survey-surface-hover/50"
          >
            <td class="py-3 px-4 text-survey-text-primary font-medium">{{ v.name }}</td>
            <td class="py-3 px-4 text-survey-text-secondary">{{ v.rule }}</td>
            <td class="py-3 px-4">
              <span
                class="px-2 py-0.5 text-xs rounded"
                :class="v.level === '高' ? 'bg-survey-danger/20 text-survey-danger' : v.level === '中' ? 'bg-survey-warning/20 text-survey-warning' : 'bg-survey-info/20 text-survey-info'"
              >
                {{ v.level }}
              </span>
            </td>
            <td class="py-3 px-4 text-survey-text-muted">{{ v.levelText }}</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-6 p-4 bg-survey-bg rounded-lg border border-survey-border/50">
        <h4 class="font-medium text-survey-text-primary mb-2 flex items-center gap-2">
          <Database class="w-4 h-4 text-survey-primary" />
          ClickHouse 原始记录校验
        </h4>
        <p class="text-sm text-survey-text-muted mb-3">
          所有异常标记均基于 ClickHouse 原始记录表进行二次校验，确保数据准确性：
        </p>
        <ul class="text-sm text-survey-text-muted space-y-1.5 ml-4">
          <li>• 样本漏斗每一步转化均对应 ClickHouse 聚合查询，支持下钻可查看原始记录</li>
          <li>• 异常矩阵的每个单元格支持点击下钻，列出所有命中该异常类型的样本 ID 列表</li>
          <li>• 所有对比维度均基于同一时间窗口、同一筛选条件下的聚合结果</li>
          <li>• 数据更新频率：每分钟聚合表 5 分钟，明细表实时</li>
        </ul>
      </div>
    </CardContainer>

    <CardContainer v-if="activeTab === 'privacy'" title="隐私与脱敏说明">
      <div class="space-y-4">
        <div class="p-4 bg-survey-bg rounded-lg border border-survey-border/50">
          <h4 class="font-medium text-survey-text-primary mb-2 flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-survey-success" />
            个人信息保护
          </h4>
          <p class="text-sm text-survey-text-muted space-y-2">
            本平台严格遵守《个人信息保护法》要求，所有展示数据均经过脱敏处理：
          </p>
          <ul class="text-sm text-survey-text-muted space-y-1.5 ml-4 mt-2">
            <li>• 不展示受访者姓名、手机号、邮箱等任何个人身份信息（PII）</li>
            <li>• 样本 ID 采用单向哈希处理，无法反向识别个人身份</li>
            <li>• IP 地址仅展示到城市级别，不展示具体 IP</li>
            <li>• 设备信息仅展示设备类型和操作系统，不展示设备唯一标识</li>
            <li>• 答题内容仅用于质量分析，不与个人身份关联</li>
          </ul>
        </div>

        <div class="p-4 bg-survey-bg rounded-lg border border-survey-border/50">
          <h4 class="font-medium text-survey-text-primary mb-2">数据使用范围</h4>
          <ul class="text-sm text-survey-text-muted space-y-1.5 ml-4">
            <li>• 本页面数据仅用于问卷样本质量监控与运营复盘</li>
            <li>• 所有分析结果均为聚合统计数据，不涉及个人层级数据导出</li>
            <li>• 人工备注功能仅用于记录质量分析结论，不记录个人信息</li>
            <li>• 数据访问权限仅限授权的调研项目经理及相关人员</li>
          </ul>
        </div>

        <div class="p-4 bg-survey-primary/10 rounded-lg border border-survey-primary/30">
          <h4 class="font-medium text-survey-primary mb-2">数据口径声明</h4>
          <p class="text-sm text-survey-text-muted">
            本页面所有统计指标均基于「线上问卷样本质量监控」系统的原始记录计算，如对数据有疑问，请联系数据团队进行口径核对。
          </p>
        </div>
      </div>
    </CardContainer>
  </div>
</template>
