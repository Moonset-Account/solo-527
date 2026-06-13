<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑内容' : '新建内容' }}</h2>
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
    </div>

    <div class="card">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入内容标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="选题方向" prop="topic">
          <el-input v-model="form.topic" placeholder="请输入选题方向说明" />
        </el-form-item>
        <el-form-item label="脚本内容" prop="script">
          <el-input
            v-model="form.script"
            type="textarea"
            :rows="8"
            placeholder="请输入脚本内容"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="审稿流程">
          <el-select v-model="form.reviewFlowId" placeholder="请选择审稿流程" style="width: 300px">
            <el-option v-for="f in flowList" :key="f._id" :label="f.name" :value="f._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标平台">
          <el-select v-model="form.targetPlatforms" multiple placeholder="请选择发布平台" style="width: 100%">
            <el-option v-for="(v, k) in PLATFORM_TYPE" :key="k" :label="v.label" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="form.assignee" placeholder="请选择负责人" style="width: 300px" clearable>
            <el-option v-for="u in USERS" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            multiple
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="form.attachments?.map((f, i) => ({ name: f.name, uid: i, url: f.url }))"
          >
            <el-button type="primary"><el-icon><Upload /></el-icon>选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持上传视频、图片、文档等附件（演示用）</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item>
          <div class="form-footer">
            <el-button @click="$router.back()">取消</el-button>
            <el-button type="primary" @click="handleSave('draft')">保存草稿</el-button>
            <el-button type="success" @click="handleSave('submit')" :disabled="!form.reviewFlowId">
              保存并提交审稿
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { contentApi, reviewApi } from '@/api'
import { PLATFORM_TYPE, USERS } from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const flowList = ref([])
const editId = computed(() => route.query.id)
const isEdit = computed(() => !!editId.value)

const form = reactive({
  title: '',
  topic: '',
  script: '',
  reviewFlowId: '',
  targetPlatforms: [],
  assignee: '',
  attachments: [],
  remark: '',
  creator: 'u001'
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

async function loadFlows() {
  try {
    flowList.value = await reviewApi.activeFlows()
  } catch (e) {}
}

async function loadDetail() {
  if (!editId.value) return
  try {
    const data = await contentApi.detail(editId.value)
    Object.assign(form, {
      title: data.title,
      topic: data.topic || '',
      script: data.script || '',
      reviewFlowId: data.reviewFlowId || '',
      targetPlatforms: data.targetPlatforms || [],
      assignee: data.assignee || '',
      attachments: data.attachments || [],
      remark: data.remark || ''
    })
  } catch (e) {}
}

function handleFileChange(uploadFile) {
  const file = uploadFile.raw || uploadFile
  form.attachments.push({
    name: file.name,
    url: URL.createObjectURL(file),
    type: file.type || '',
    size: file.size || 0
  })
}

function handleFileRemove(uploadFile) {
  form.attachments.splice(uploadFile.uid, 1)
}

async function handleSave(action) {
  await formRef.value?.validate()
  if (!form.title) return
  try {
    if (isEdit.value) {
      await contentApi.update(editId.value, { ...form, operator: 'u001' })
      ElMessage.success('保存成功')
    } else {
      const res = await contentApi.create(form)
      ElMessage.success('保存成功')
      if (action === 'submit') {
        await contentApi.submitReview(res._id, { operator: 'u001' })
        ElMessage.success('已提交审稿')
      }
    }
    if (action === 'submit' && !isEdit.value) {
      router.push('/contents')
      return
    }
    router.back()
  } catch (e) {}
}

onMounted(() => {
  loadFlows()
  loadDetail()
})
</script>
