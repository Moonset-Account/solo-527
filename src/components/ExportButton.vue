<script setup lang="ts">
import { useDataStore } from '@/stores/data'
import { useFilterStore } from '@/stores/filter'
import { Download } from 'lucide-vue-next'
import Papa from 'papaparse'
import { jsPDF } from 'jspdf'

const dataStore = useDataStore()
const filterStore = useFilterStore()

function formatAmount(n: number): string {
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildMetaText(): string {
  const meta = dataStore.dataMeta
  if (!meta) return ''
  const lines = [
    `数据更新时间: ${meta.updatedAt}`,
    `有效样本量: ${meta.sampleSize}条`,
    `筛选条件: ${filterStore.filterSummary}`,
  ]
  return lines.join('\n')
}

function exportCSV() {
  const rows = dataStore.transactions.map(t => ({
    日期: t.date,
    分类: t.category,
    子分类: t.subCategory,
    商户: t.merchant,
    金额: t.amount,
    账户: t.account,
    成员: t.member,
    类型: t.type,
    是否异常: t.isAbnormal ? '是' : '否',
    异常类型: t.abnormalType || '',
  }))

  const metaText = buildMetaText()
  const csv = Papa.unparse(rows)
  const blob = new Blob([metaText + '\n\n' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `家庭预算分析_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF() {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Family Budget Analysis Report', 14, 22)
  doc.setFontSize(10)
  doc.text(`Update Time: ${dataStore.dataMeta?.updatedAt || 'N/A'}`, 14, 32)
  doc.text(`Sample Size: ${dataStore.dataMeta?.sampleSize || 0}`, 14, 38)
  doc.text(`Filter: ${filterStore.filterSummary}`, 14, 44)
  doc.text(`Total Income: ${formatAmount(dataStore.totalIncome)}`, 14, 52)
  doc.text(`Total Expense: ${formatAmount(dataStore.totalExpense)}`, 14, 58)

  let y = 70
  doc.setFontSize(12)
  doc.text('Budget Progress', 14, y)
  y += 8
  doc.setFontSize(9)
  for (const b of dataStore.budgetProgress) {
    const pct = b.budgetAmount > 0 ? Math.round((b.spentAmount / b.budgetAmount) * 100) : 0
    doc.text(`${b.category}: ${formatAmount(b.spentAmount)} / ${formatAmount(b.budgetAmount)} (${pct}%)`, 14, y)
    y += 6
  }

  y += 6
  doc.setFontSize(12)
  doc.text('Category Breakdown', 14, y)
  y += 8
  doc.setFontSize(9)
  for (const c of dataStore.categoryBreakdown) {
    doc.text(`${c.category}: ${formatAmount(c.amount)} (${c.percentage}%)`, 14, y)
    y += 6
  }

  doc.save(`家庭预算分析_${new Date().toISOString().split('T')[0]}.pdf`)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button class="btn-ghost text-sm flex items-center gap-1.5" @click="exportCSV">
      <Download :size="14" />
      CSV
    </button>
    <button class="btn-primary text-sm flex items-center gap-1.5" @click="exportPDF">
      <Download :size="14" />
      PDF
    </button>
  </div>
</template>
