<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-vue-next'
import { useDictionaries } from '@/composables/useDictionaries'
import { useAuthStore } from '@/stores/auth'
import { requirementApi, adminApi } from '@/api'
import type { User, DefaultAssignee, Priority } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const { departments, priorities, fetchAll: fetchDicts } = useDictionaries()

const title = ref('')
const description = ref('')
const priority = ref<Priority | ''>('')
const department = ref('')
const deadline = ref('')
const assigneeId = ref<number | ''>('')
const files = ref<File[]>([])
const isDragOver = ref(false)
const isSubmitting = ref(false)
const errorMsg = ref('')
const titleError = ref('')
const departmentError = ref('')

const users = ref<User[]>([])
const defaultAssignees = ref<DefaultAssignee[]>([])

async function loadUsers() {
  try {
    const { data } = await adminApi.users.list()
    users.value = data
  } catch {}
}

async function loadDefaultAssignees() {
  try {
    const { data } = await adminApi.defaultAssignees.list()
    defaultAssignees.value = data
  } catch {}
}

watch(department, (newDept) => {
  if (!newDept) {
    assigneeId.value = ''
    return
  }
  const match = defaultAssignees.value.find((d) => d.department === newDept)
  if (match) {
    assigneeId.value = match.userId
  }
})

function addFiles(fileList: FileList | File[]) {
  for (const f of fileList) {
    if (!files.value.some((existing) => existing.name === f.name && existing.size === f.size)) {
      files.value.push(f)
    }
  }
}

function removeFile(index: number) {
  files.value.splice(index, 1)
}

function onFileInput(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(target.files)
    target.value = ''
  }
}

function onDrop(event: DragEvent) {
  isDragOver.value = false
  if (event.dataTransfer?.files) {
    addFiles(event.dataTransfer.files)
  }
}

function onDragOver() {
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function validate(): boolean {
  titleError.value = ''
  departmentError.value = ''
  let valid = true
  if (!title.value.trim()) {
    titleError.value = '请输入需求标题'
    valid = false
  }
  if (!department.value) {
    departmentError.value = '请选择所属部门'
    valid = false
  }
  return valid
}

async function handleSubmit() {
  if (!validate()) return
  isSubmitting.value = true
  errorMsg.value = ''

  const formData = new FormData()
  formData.append('title', title.value.trim())
  formData.append('description', description.value.trim())
  formData.append('priority', priority.value || 'medium')
  formData.append('department', department.value)
  formData.append('deadline', deadline.value || '')
  if (assigneeId.value) {
    formData.append('assigneeId', String(assigneeId.value))
  }
  for (const file of files.value) {
    formData.append('files', file)
  }

  try {
    await requirementApi.create(formData)
    router.push('/requirements')
  } catch {
    errorMsg.value = '提交失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  router.push('/requirements')
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

onMounted(async () => {
  await Promise.all([fetchDicts(), loadUsers(), loadDefaultAssignees()])
})
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <button
        class="btn-outline btn-sm"
        @click="router.push('/requirements')"
      >
        <ArrowLeft class="w-4 h-4" />
      </button>
      <h1 class="text-xl font-semibold text-slate-800">新建需求</h1>
    </div>

    <div class="max-w-3xl mx-auto card p-8">
      <div v-if="errorMsg" class="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
        {{ errorMsg }}
      </div>

      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            需求标题 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            class="input"
            placeholder="请输入需求标题"
          />
          <p v-if="titleError" class="mt-1 text-xs text-red-500">{{ titleError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">需求描述</label>
          <textarea
            v-model="description"
            class="input resize-none"
            rows="6"
            placeholder="请详细描述需求内容..."
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">优先级</label>
            <select v-model="priority" class="select">
              <option value="" disabled>请选择优先级</option>
              <option v-for="opt in priorities" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              所属部门 <span class="text-red-500">*</span>
            </label>
            <select v-model="department" class="select">
              <option value="" disabled>请选择部门</option>
              <option v-for="opt in departments" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <p v-if="departmentError" class="mt-1 text-xs text-red-500">{{ departmentError }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">截止时间</label>
            <input
              v-model="deadline"
              type="date"
              class="input"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">负责人</label>
            <select v-model="assigneeId" class="select">
              <option value="">请选择负责人</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">附件上传</label>
          <div
            class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
            :class="isDragOver ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300'"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
            @click="($refs.fileInput as HTMLInputElement)?.click()"
          >
            <Upload class="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p class="text-sm text-slate-500">点击或拖拽文件到此处上传</p>
            <input
              ref="fileInput"
              type="file"
              multiple
              class="hidden"
              @change="onFileInput"
            />
          </div>

          <div v-if="files.length" class="mt-3 space-y-2">
            <div
              v-for="(file, index) in files"
              :key="file.name + file.size"
              class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 group"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm text-slate-700 truncate">{{ file.name }}</p>
                <p class="text-xs text-slate-400">{{ formatFileSize(file.size) }}</p>
              </div>
              <button
                class="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                @click="removeFile(index)"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-8">
        <button
          class="btn-accent flex-1"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          提交需求
        </button>
        <button
          class="btn-outline"
          :disabled="isSubmitting"
          @click="handleCancel"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>
