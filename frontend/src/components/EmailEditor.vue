<template>
  <div class="email-editor">
    <div class="editor-header">
      <el-form :model="form" label-width="80px">
        <el-form-item label="收件人">
          <el-input
            v-model="form.recipient"
            placeholder="请输入收件人邮箱"
            clearable
          />
        </el-form-item>
        <el-form-item label="主题">
          <el-input
            v-model="form.subject"
            placeholder="请输入邮件主题"
            clearable
          />
        </el-form-item>
        <el-form-item label="抄送">
          <el-input
            v-model="form.cc"
            placeholder="请输入抄送邮箱（多个用逗号分隔）"
            clearable
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="editor-toolbar">
      <el-button-group>
        <el-button size="small" @click="execCommand('bold')">
          <el-icon><Bold /></el-icon>
        </el-button>
        <el-button size="small" @click="execCommand('italic')">
          <el-icon><Italic /></el-icon>
        </el-button>
        <el-button size="small" @click="execCommand('underline')">
          <el-icon><Underline /></el-icon>
        </el-button>
        <el-button size="small" @click="execCommand('strikeThrough')">
          <el-icon><Strikethrough /></el-icon>
        </el-button>
      </el-button-group>
      <el-divider direction="vertical" />
      <el-button-group>
        <el-button size="small" @click="execCommand('justifyLeft')">
          <el-icon><DArrowLeft /></el-icon>
        </el-button>
        <el-button size="small" @click="execCommand('justifyCenter')">
          <el-icon><DArrowRight /></el-icon>
        </el-button>
        <el-button size="small" @click="execCommand('justifyRight')">
          <el-icon><DArrowLeft /></el-icon>
        </el-button>
      </el-button-group>
      <el-divider direction="vertical" />
      <el-button-group>
        <el-button size="small" @click="execCommand('insertUnorderedList')">
          <el-icon><List /></el-icon>
        </el-button>
        <el-button size="small" @click="execCommand('insertOrderedList')">
          <el-icon><List /></el-icon>
        </el-button>
      </el-button-group>
      <el-divider direction="vertical" />
      <el-color-picker v-model="fontColor" size="small" @change="handleColorChange" />
      <el-select v-model="fontSize" size="small" style="width: 100px" @change="handleFontSize">
        <el-option label="小" value="2" />
        <el-option label="中" value="3" />
        <el-option label="大" value="5" />
        <el-option label="特大" value="7" />
      </el-select>
      <div class="toolbar-right">
        <el-button size="small" @click="handleSaveVersion">
          <el-icon><Collection /></el-icon>
          保存版本
        </el-button>
        <el-button type="primary" size="small" @click="handleSubmit">
          <el-icon><Check /></el-icon>
          提交复核
        </el-button>
        <el-button type="success" size="small" @click="handleSend">
          <el-icon><Promotion /></el-icon>
          发送邮件
        </el-button>
      </div>
    </div>

    <div
      ref="editorRef"
      class="editor-content"
      contenteditable="true"
      @input="handleInput"
      @blur="handleBlur"
    ></div>

    <div class="editor-footer">
      <span class="word-count">字数：{{ wordCount }}</span>
      <span class="save-status" v-if="lastSaved">
        <el-icon><Clock /></el-icon>
        上次保存：{{ formatRelativeTime(lastSaved) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatRelativeTime } from '@/utils/format'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save-version', 'submit', 'send', 'change'])

const editorRef = ref(null)
const fontColor = ref('#303133')
const fontSize = ref('3')
const lastSaved = ref(null)
const wordCount = ref(0)

const form = reactive({
  recipient: '',
  subject: '',
  cc: '',
  content: ''
})

watch(() => props.modelValue, (val) => {
  if (val) {
    form.recipient = val.recipient || ''
    form.subject = val.subject || ''
    form.cc = val.cc || ''
    form.content = val.content || ''
    if (editorRef.value) {
      editorRef.value.innerHTML = form.content
      updateWordCount()
    }
  }
}, { immediate: true, deep: true })

onMounted(() => {
  if (editorRef.value && props.readonly) {
    editorRef.value.contentEditable = 'false'
    editorRef.value.style.backgroundColor = '#f5f7fa'
  }
})

function execCommand(command, value = null) {
  document.execCommand(command, false, value)
  handleInput()
}

function handleColorChange(color) {
  execCommand('foreColor', color)
}

function handleFontSize(size) {
  execCommand('fontSize', size)
}

function handleInput() {
  form.content = editorRef.value?.innerHTML || ''
  updateWordCount()
  emit('change', { ...form })
  emit('update:modelValue', { ...form })
}

function handleBlur() {
  handleInput()
}

function updateWordCount() {
  const text = editorRef.value?.innerText || ''
  wordCount.value = text.replace(/\s/g, '').length
}

async function handleSaveVersion() {
  if (!form.subject) {
    ElMessage.warning('请输入邮件主题')
    return
  }
  try {
    const { value: versionNote } = await ElMessageBox.prompt('请输入版本备注', '保存版本', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：初版修改、优化措辞等'
    })
    lastSaved.value = new Date()
    emit('save-version', { ...form, versionNote })
    ElMessage.success('版本保存成功')
  } catch (e) {
  }
}

function handleSubmit() {
  if (!form.recipient) {
    ElMessage.warning('请输入收件人')
    return
  }
  if (!form.subject) {
    ElMessage.warning('请输入邮件主题')
    return
  }
  emit('submit', { ...form })
}

function handleSend() {
  if (!form.recipient) {
    ElMessage.warning('请输入收件人')
    return
  }
  if (!form.subject) {
    ElMessage.warning('请输入邮件主题')
    return
  }
  ElMessageBox.confirm('确定要发送此邮件吗？', '提示', {
    confirmButtonText: '发送',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('send', { ...form })
  }).catch(() => {})
}

defineExpose({
  setContent: (html) => {
    if (editorRef.value) {
      editorRef.value.innerHTML = html
      handleInput()
    }
  },
  getContent: () => form.content
})
</script>

<style lang="scss" scoped>
.email-editor {
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  overflow: hidden;

  .editor-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e4e7ed;

    :deep(.el-form-item) {
      margin-bottom: 12px;
    }

    :deep(.el-form-item:last-child) {
      margin-bottom: 0;
    }
  }

  .editor-toolbar {
    padding: 10px 20px;
    border-bottom: 1px solid #e4e7ed;
    background-color: #fafbfc;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;

    .toolbar-right {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }
  }

  .editor-content {
    min-height: 400px;
    padding: 20px;
    outline: none;
    line-height: 1.8;
    font-size: 14px;

    &:focus {
      box-shadow: inset 0 0 0 2px rgba(64, 158, 255, 0.1);
    }
  }

  .editor-footer {
    padding: 10px 20px;
    border-top: 1px solid #e4e7ed;
    background-color: #fafbfc;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #909399;
    font-size: 12px;

    .save-status {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
