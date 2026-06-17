<template>
  <div class="grid-2" style="grid-template-columns:1.2fr 1fr">
    <div class="card">
      <div class="card-header">
        <div class="card-title">上传合同</div>
        <button class="btn btn-secondary btn-sm" @click="resetForm">重置</button>
      </div>
      <div class="card-body">
        <div class="grid-2 mb-4">
          <div>
            <label class="form-label"><span class="text-danger">*</span> 合同名称</label>
            <input v-model="form.title" class="form-input" placeholder="请输入合同名称" />
          </div>
          <div>
            <label class="form-label"><span class="text-danger">*</span> 合同类型</label>
            <select v-model="form.contractType" class="form-select">
              <option value="">请选择</option>
              <option v-for="t in CONTRACT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
        </div>

        <div class="grid-2 mb-4">
          <div>
            <label class="form-label"><span class="text-danger">*</span> 甲方（我方/对方）</label>
            <input v-model="form.partyA" class="form-input" placeholder="甲方公司名称" />
          </div>
          <div>
            <label class="form-label"><span class="text-danger">*</span> 乙方（对方/我方）</label>
            <input v-model="form.partyB" class="form-input" placeholder="乙方公司名称" />
          </div>
        </div>

        <div class="grid-4 mb-4">
          <div>
            <label class="form-label">合同金额</label>
            <input v-model="form.amount" type="number" step="0.01" min="0" class="form-input" placeholder="0.00" />
          </div>
          <div>
            <label class="form-label">币种</label>
            <select v-model="form.currency" class="form-select">
              <option value="CNY">人民币 (CNY)</option>
              <option value="USD">美元 (USD)</option>
              <option value="EUR">欧元 (EUR)</option>
            </select>
          </div>
          <div>
            <label class="form-label">优先级</label>
            <select v-model="form.priority" class="form-select">
              <option v-for="p in PRIORITY_OPTIONS" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
          </div>
          <div>
            <label class="form-label">整改期限</label>
            <input v-model="form.rectifyDeadline" type="date" class="form-input" />
          </div>
        </div>

        <div class="grid-3 mb-4">
          <div>
            <label class="form-label">签订日期</label>
            <input v-model="form.signDate" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">生效日期</label>
            <input v-model="form.effectiveDate" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">到期日期</label>
            <input v-model="form.expiryDate" type="date" class="form-input" />
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label">关键词/标签</label>
          <div class="tag-input-wrap">
            <div class="chip-list mb-2">
              <span v-for="(tag, idx) in keywordTags" :key="idx" class="chip">
                {{ tag }}
                <button class="chip-close" @click="removeTag(idx)">×</button>
              </span>
            </div>
            <input
              v-model="keywordInput"
              class="form-input"
              placeholder="输入关键词后回车添加"
              @keydown.enter.prevent="addTag"
              @keydown.comma.prevent="addTag"
            />
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label">合同描述</label>
          <textarea v-model="form.description" class="form-textarea" placeholder="合同简要说明、背景等..." rows="3"></textarea>
        </div>

        <div class="mb-4">
          <label class="form-label"><span class="text-danger">*</span> 合同文件</label>
          <div
            class="upload-area"
            :class="{ dragging: isDragging }"
            @click="$refs.fileInput.click()"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div class="font-semibold">点击或拖拽文件到此处上传</div>
            <div class="upload-hint">支持 PDF、Word (doc/docx)、Excel 等格式，单个文件不超过 50MB</div>
            <input ref="fileInput" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" style="display:none" @change="handleFileSelect" />
          </div>

          <div v-if="uploadedFile" class="file-item">
            <div class="file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="file-info">
              <div class="file-name">{{ uploadedFile.name }}</div>
              <div class="file-size">{{ formatFileSize(uploadedFile.size) }}</div>
            </div>
            <button class="btn btn-secondary btn-sm" @click.stop="removeFile">移除</button>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <button class="btn btn-secondary" @click="resetForm">取消</button>
          <button class="btn btn-primary" :disabled="submitting || !canSubmit" @click="handleSubmit">
            {{ submitting ? '提交中...' : '提交合同' }}
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">上传须知</div>
      </div>
      <div class="card-body">
        <div class="guide-section mb-6">
          <h3 class="font-semibold mb-3 flex items-center gap-2">
            <span style="width:24px;height:24px;background:var(--primary);color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px">1</span>
            填写合同信息
          </h3>
          <ul class="guide-list">
            <li>合同名称请使用规范全称，便于后续检索</li>
            <li>准确填写甲乙方名称，与营业执照保持一致</li>
            <li>金额、日期等信息与合同原文一致</li>
            <li>设置合理的整改期限，系统将自动提醒</li>
          </ul>
        </div>

        <div class="guide-section mb-6">
          <h3 class="font-semibold mb-3 flex items-center gap-2">
            <span style="width:24px;height:24px;background:var(--primary);color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px">2</span>
            上传文件要求
          </h3>
          <ul class="guide-list">
            <li>优先上传 PDF 格式文件，确保格式一致</li>
            <li>文件名建议：合同类型-甲方-乙方-版本号</li>
            <li>扫描件需保证清晰可辨，建议 OCR 后上传</li>
            <li>涉密合同请走内部加密通道</li>
          </ul>
        </div>

        <div class="guide-section">
          <h3 class="font-semibold mb-3 flex items-center gap-2">
            <span style="width:24px;height:24px;background:var(--primary);color:white;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px">3</span>
            后续流程
          </h3>
          <div class="flow-steps">
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div>
                <div class="font-semibold">上传创建</div>
                <div class="text-sm text-gray-500">新建合同，状态为"新建"</div>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div>
                <div class="font-semibold">分派律师</div>
                <div class="text-sm text-gray-500">法务负责人分派律师审阅</div>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div>
                <div class="font-semibold">法律审阅</div>
                <div class="text-sm text-gray-500">律师出具法律审阅意见</div>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div>
                <div class="font-semibold">复核审查</div>
                <div class="text-sm text-gray-500">复核人进行最终复核</div>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-dot" style="background:var(--success)"></div>
              <div>
                <div class="font-semibold">完成归档</div>
                <div class="text-sm text-gray-500">合规缺口记录入看板</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

const ui = useUiStore()
const router = useRouter()

const isDragging = ref(false)
const uploading = ref(false)
const submitting = ref(false)
const uploadedFile = ref<any>(null)
const fileBase64 = ref('')

const keywordInput = ref('')
const keywordTags = ref<string[]>([])

const form = reactive({
  title: '',
  partyA: '',
  partyB: '',
  contractType: '',
  amount: '' as string | number | null,
  currency: 'CNY',
  priority: 'NORMAL',
  signDate: '',
  effectiveDate: '',
  expiryDate: '',
  rectifyDeadline: '',
  description: ''
})

const canSubmit = computed(() =>
  form.title && form.partyA && form.partyB && form.contractType && uploadedFile.value
)

function addTag() {
  const v = keywordInput.value.trim()
  if (v && !keywordTags.value.includes(v)) {
    keywordTags.value.push(v)
  }
  keywordInput.value = ''
}

function removeTag(idx: number) {
  keywordTags.value.splice(idx, 1)
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await processFile(file)
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await processFile(file)
}

async function processFile(file: File) {
  if (file.size > 50 * 1024 * 1024) {
    alert('文件大小不能超过 50MB')
    return
  }
  uploadedFile.value = file
  uploading.value = true
  ui.showLoading('读取文件中...')
  try {
    fileBase64.value = await readFileAsBase64(file)
  } finally {
    uploading.value = false
    ui.hideLoading()
  }
}

function removeFile() {
  uploadedFile.value = null
  fileBase64.value = ''
  const input = document.querySelector('input[type=file]') as HTMLInputElement
  if (input) input.value = ''
}

async function handleSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  ui.showLoading('创建合同中...')
  try {
    const contract: any = await $fetch('/api/contracts', {
      method: 'POST',
      body: {
        ...form,
        keywords: keywordTags.value.join(','),
        amount: form.amount === '' ? null : Number(form.amount)
      }
    })

    if (contract && contract.id) {
      await $fetch(`/api/contracts/${contract.id}/versions`, {
        method: 'POST',
        body: {
          fileName: uploadedFile.value.name,
          fileData: fileBase64.value,
          mimeType: uploadedFile.value.type,
          note: '上传首版合同'
        }
      })

      alert('合同创建成功！')
      router.push(`/contracts/${contract.id}`)
    }
  } catch (e: any) {
    alert(e?.data?.message || e?.message || '创建失败，请重试')
  } finally {
    submitting.value = false
    ui.hideLoading()
  }
}

function resetForm() {
  Object.keys(form).forEach(k => {
    (form as any)[k] = k === 'currency' ? 'CNY' : k === 'priority' ? 'NORMAL' : ''
  })
  keywordTags.value = []
  keywordInput.value = ''
  removeFile()
}

onMounted(() => {
  ui.setPageTitle('上传合同')
  ui.setActiveNav('upload')
})
</script>

<style scoped>
.guide-section {
  padding: 16px;
  background: var(--gray-50);
  border-radius: 10px;
}

.guide-list {
  list-style: none;
  padding-left: 36px;
}

.guide-list li {
  padding: 4px 0;
  color: var(--gray-600);
  font-size: 13px;
  position: relative;
}

.guide-list li::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--gray-400);
  border-radius: 50%;
  position: absolute;
  left: -16px;
  top: 12px;
}

.flow-steps {
  padding-left: 8px;
}

.flow-step {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  position: relative;
}

.flow-step::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 34px;
  bottom: 0;
  width: 2px;
  background: var(--gray-200);
}

.flow-step:last-child::before {
  display: none;
}

.flow-dot {
  width: 24px;
  height: 24px;
  background: var(--primary);
  border-radius: 50%;
  flex-shrink: 0;
  border: 3px solid white;
  box-shadow: 0 0 0 2px var(--primary);
  z-index: 1;
}
</style>
