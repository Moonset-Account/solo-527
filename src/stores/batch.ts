import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBatchStore = defineStore('batch', () => {
  const batches = ref([
    { id: 'B202606001', reagentName: '浓硫酸', spec: 'AR 500mL', supplier: '国药集团', quantity: 20, remaining: 12, entryDate: '2026-03-15', expiryDate: '2027-03-15', location: 'A区-01', status: '正常' },
    { id: 'B202606002', reagentName: '丙酮', spec: 'AR 500mL', supplier: '西陇科学', quantity: 30, remaining: 28, entryDate: '2026-04-10', expiryDate: '2027-04-10', location: 'B区-03', status: '正常' },
    { id: 'B202606003', reagentName: '氰化钾', spec: 'AR 100g', supplier: '阿拉丁', quantity: 5, remaining: 1, entryDate: '2026-01-20', expiryDate: '2027-01-20', location: 'C区-01', status: '低库存' },
    { id: 'B202606004', reagentName: '盐酸', spec: 'AR 500mL', supplier: '国药集团', quantity: 25, remaining: 18, entryDate: '2026-02-28', expiryDate: '2027-02-28', location: 'A区-02', status: '正常' },
    { id: 'B202606005', reagentName: '无水乙醇', spec: 'AR 500mL', supplier: '西陇科学', quantity: 40, remaining: 45, entryDate: '2026-05-05', expiryDate: '2027-05-05', location: 'B区-05', status: '正常' },
    { id: 'B202606006', reagentName: '甲醛溶液', spec: 'AR 500mL', supplier: '国药集团', quantity: 15, remaining: 4, entryDate: '2026-03-01', expiryDate: '2026-09-01', location: 'A区-04', status: '临期' },
    { id: 'B202606007', reagentName: '硝酸', spec: 'AR 500mL', supplier: '阿拉丁', quantity: 18, remaining: 14, entryDate: '2025-12-10', expiryDate: '2026-07-15', location: 'A区-03', status: '临期' },
  ])

  const selectedBatchIds = ref<string[]>([])
  const showDetailPanel = ref(false)
  const detailBatchId = ref<string | null>(null)

  const filters = ref({
    reagentName: '',
    expiryDateStart: '',
    expiryDateEnd: '',
    supplier: '',
  })

  const filteredBatches = ref(batches.value)

  function toggleBatchSelect(id: string) {
    const idx = selectedBatchIds.value.indexOf(id)
    if (idx >= 0) selectedBatchIds.value.splice(idx, 1)
    else selectedBatchIds.value.push(id)
  }

  function openDetail(id: string) {
    detailBatchId.value = id
    showDetailPanel.value = true
  }

  function closeDetail() {
    showDetailPanel.value = false
    detailBatchId.value = null
  }

  const detailBatch = ref(() => {
    if (!detailBatchId.value) return null
    return batches.value.find(b => b.id === detailBatchId.value) || null
  })

  return { batches, selectedBatchIds, showDetailPanel, detailBatchId, filters, filteredBatches, toggleBatchSelect, openDetail, closeDetail, detailBatch }
})
