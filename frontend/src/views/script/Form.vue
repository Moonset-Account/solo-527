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
      <el-alert
        v-if="isEdit"
        type="info"
        :closable="false"
        show-icon
        class="mb-20"
        title="编辑模式提示：本次修改将自动记录到审核追溯，脚本内容与素材标签变更将分别留痕，请在下方如实填写审稿意见"
      />

      <el-form :model="form" :rules="activeRules" ref="formRef" label-width="110px" v-loading="loading">
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

        <template v-if="isEdit">
          <el-divider content-position="left">
            <el-icon><ChatDotRound /></el-icon>
            <span style="font-weight:600;">审核留痕（必填）</span>
          </el-divider>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="审核员">
                <el-input :model-value="form.reviewerName" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="审核结果" prop="reviewResult">
                <el-radio-group v-model="form.reviewResult">
                  <el-radio :value="1">通过</el-radio>
                  <el-radio :value="3">需修改</el-radio>
                  <el-radio :value="2">驳回</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="审稿意见" prop="reviewOpinion">
            <el-input
              v-model="form.reviewOpinion"
              type="textarea"
              :rows="4"
              maxlength="1000"
              show-word-limit
              placeholder="请填写本次修改的审稿意见，例如：脚本内容已完善，素材标签补充完整，通过审核。该意见将与变更快照一起永久留存。"
            />
            <div style="color:#E6A23C;font-size:12px;margin-top:4px;">
              <el-icon><InfoFilled /></el-icon>
              该意见将写入 review_record 表，脚本内容与素材标签的变更都会各自独立留痕，作为合规审计依据，不可删除或修改
            </div>
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSave(1)">
            <el-icon><CircleCheck /></el-icon>保存为待办
          </el-button>
          <el-button type="success" :loading="submitting" @click="handleSave(2)">
            <el-icon><Promotion /></el-icon>{{ isEdit ? '保存并记录审核' : '提交审核' }}
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
  remark: '',
  reviewOpinion: '',
  reviewerId: userStore.userInfo?.id,
  reviewerName: userStore.userInfo?.nickname,
  reviewResult: 1
})

const rules = {
  topicId: [{ required: true, message: '请选择关联选题', trigger: 'change' }],
  title: [{ required: true, message: '请输入脚本标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入脚本内容', trigger: 'blur' }]
}

const editRules = {
  ...rules,
  reviewOpinion: [{ required: true, message: '编辑模式必须填写审稿意见，用于留存审核记录', trigger: 'blur' }],
  reviewResult: [{ required: true, message: '请选择审核结果', trigger: 'change' }]
}

const activeRules = computed(() => isEdit.value ? editRules : rules)

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
    formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      form.status = status
      if (isEdit.value && !form.reviewOpinion?.trim()) {
        ElMessage.warning('请填写审稿意见，该记录将进入审核追溯')
        submitting.value = false
        return
      }
      await saveScript(form)
      ElMessage.success(isEdit.value ? '修改成功，变更已写入审核追溯' : '提交成功')
      router.push('/script')
    })
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
    form.reviewerId = userStore.userInfo?.id
    form.reviewerName = userStore.userInfo?.nickname
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
