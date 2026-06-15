<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><DocumentAdd /></el-icon>{{ isEdit ? '编辑脚本' : '提交脚本' }}
      </h2>
      <div>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </div>

    <div class="content-card" style="max-width:1000px;margin:0 auto;">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px" v-loading="loading">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联选题" prop="topicId">
              <el-select v-model="form.topicId" placeholder="请选择关联选题" filterable style="width:100%;" @change="onTopicChange">
                <el-option v-for="t in topicList" :key="t.id" :label="t.title" :value="t.id">
                  <span>{{ t.title }}</span>
                  <el-tag size="small" :type="getStatusTag(t.status).type" style="float:right;">
                    {{ getStatusTag(t.status).label }}
                  </el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计时长">
              <el-select v-model="form.duration" placeholder="选择或输入" allow-create filterable style="width:100%;">
                <el-option label="30s以内" value="30s以内" />
                <el-option label="30s-60s" value="30s-60s" />
                <el-option label="60s-90s" value="60s-90s" />
                <el-option label="90s-120s" value="90s-120s" />
                <el-option label="2分钟以上" value="2分钟以上" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="脚本标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit placeholder="请输入脚本标题（建议包含关键词）" />
        </el-form-item>

        <el-form-item label="素材标签">
          <el-select
            v-model="selectedMatTags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入素材标签后回车，用于审核追溯"
            style="width:100%;"
            @change="onMatTagsChange"
          >
            <el-option v-for="t in presetMatTags" :key="t" :label="t" :value="t" />
          </el-select>
          <div style="color:#909399;font-size:12px;margin-top:4px;">详细标注使用的素材类型，审核时会追溯标签的变更记录</div>
        </el-form-item>

        <el-form-item label="脚本内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="10"
            placeholder="请分段落撰写脚本内容，如：【开场】、【正文】、【结尾】等结构"
          />
        </el-form-item>

        <el-form-item label="拍摄要求" prop="shootingRequirement">
          <el-input
            v-model="form.shootingRequirement"
            type="textarea"
            :rows="4"
            placeholder="具体拍摄要求：场景、道具、服装、运镜方式、BGM风格等"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="其他补充说明" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSave(1)">
            <el-icon><CircleCheck /></el-icon>保存为待办
          </el-button>
          <el-button type="success" :loading="submitting" @click="handleSave(2)">
            <el-icon><Promotion /></el-icon>提交审核
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { saveScript, getScriptDetail } from '../../api/script'
import { getTopicPage } from '../../api/topic'
import { useUserStore } from '../../stores/user'
import { getStatusTag } from '../../utils/constants'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const topicList = ref([])
const selectedMatTags = ref([])

const isEdit = computed(() => !!route.params.id)

const presetMatTags = ['产品特写', '穿搭展示', '对比实验', '真人测评', '数据图表', '街拍场景', '办公室场景', '居家场景', 'BGM配乐', '字幕动画', '画外音解说', '剧情演绎', '开箱场景', '拍摄花絮']

const form = reactive({
  id: null,
  topicId: null,
  topicTitle: '',
  title: '',
  content: '',
  shootingRequirement: '',
  materialTags: '',
  duration: '',
  creatorId: userStore.userInfo?.id,
  creatorName: userStore.userInfo?.nickname,
  status: 1,
  remark: ''
})

const rules = {
  topicId: [{ required: true, message: '请选择关联选题', trigger: 'change' }],
  title: [{ required: true, message: '请输入脚本标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入脚本内容', trigger: 'blur' }]
}

function onMatTagsChange(val) {
  form.materialTags = val.join(',')
}

function onTopicChange(id) {
  const topic = topicList.value.find(t => t.id === id)
  if (topic) {
    form.topicTitle = topic.title
  }
}

async function fetchTopics() {
  try {
    const res = await getTopicPage({ current: 1, size: 200 })
    topicList.value = res.data.records
  } catch (e) {
    console.error(e)
  }
}

async function handleSave(status) {
  try {
    await formRef.value.validate()
    submitting.value = true
    form.status = status
    await saveScript(form)
    ElMessage.success(isEdit.value ? '修改成功' : '提交成功')
    router.push('/script')
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

async function loadDetail() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const res = await getScriptDetail(route.params.id)
    Object.assign(form, res.data)
    selectedMatTags.value = res.data.materialTags ? res.data.materialTags.split(',').filter(Boolean) : []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTopics()
  loadDetail()
})
</script>
