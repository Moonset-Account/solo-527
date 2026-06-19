<template>
  <div class="attachment-upload">
    <el-upload
      :action="uploadUrl"
      :headers="uploadHeaders"
      :name="fileParamName"
      :file-list="fileList"
      :multiple="multiple"
      :limit="limit"
      :accept="accept"
      list-type="text"
      :on-success="handleSuccess"
      :on-remove="handleRemove"
      :before-upload="beforeUpload"
    >
      <el-button type="primary" size="small">
        <el-icon><Upload /></el-icon>
        上传附件
      </el-button>
      <template #tip>
        <div class="upload-tip">
          支持格式：{{ accept || '所有格式' }}，单个文件不超过 {{ maxSize }}MB
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  uploadUrl: {
    type: String,
    default: '/api/upload'
  },
  fileParamName: {
    type: String,
    default: 'file'
  },
  multiple: {
    type: Boolean,
    default: true
  },
  limit: {
    type: Number,
    default: 10
  },
  maxSize: {
    type: Number,
    default: 10
  },
  accept: {
    type: String,
    default: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const fileList = ref([])
const uploadHeaders = computed(() => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
})

watch(() => props.modelValue, (val) => {
  if (val && val.length) {
    fileList.value = val.map((item, index) => ({
      name: item.name || `附件${index + 1}`,
      url: item.url,
      id: item.id
    }))
  }
}, { immediate: true, deep: true })

const beforeUpload = (file) => {
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }
  return true
}

const handleSuccess = (response, file) => {
  if (response.code === 200 || response.success) {
    const att = response.data || {}
    const newFile = {
      id: att.id,
      name: att.fileName || file.name,
      size: att.fileSize || file.size,
      url: att.fileUrl || att.url || file.url,
      filePath: att.filePath,
      fileType: att.fileType,
      response: response
    }
    const newValue = [...props.modelValue, newFile]
    emit('update:modelValue', newValue)
    emit('change', newValue)
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleRemove = (file) => {
  const newValue = props.modelValue.filter(item => item.id !== file.id && item.url !== file.url)
  emit('update:modelValue', newValue)
  emit('change', newValue)
}
</script>

<style lang="scss" scoped>
.attachment-upload {
  .upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
  }
}
</style>
