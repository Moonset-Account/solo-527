<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><EditPen /></el-icon>{{ isEdit ? '编辑选题' : '提交选题' }}
      </h2>
      <div>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </div>

    <div class="content-card" style="max-width:900px;margin:0 auto;">
      <el-alert
        v-if="isEdit"
        type="info"
        :closable="false"
        show-icon
        class="mb-20"
        title="编辑模式提示：本次修改将自动记录到审核追溯（V{{ nextVersion }} 版本），请在下方如实填写审稿意见，留痕永久保存"
      />

      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px" v-loading="loading">
        <el-form-item label="选题标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit placeholder="请输入选题标题" />
        </el-form-item>

        <el-form-item label="选题标签">
          <el-select
            v-model="selectedTags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入标签后回车"
            style="width:100%;"
            @change="onTagsChange"
          >
            <el-option v-for="t in presetTags" :key="t" :label="t" :value="t" />
          </el-select>
          <div style="color:#909399;font-size:12px;margin-top:4px;">建议添加3-5个标签，便于后期分类复盘</div>
        </el-form-item>

        <el-form-item label="目标受众" prop="targetAudience">
          <el-input v-model="form.targetAudience" type="textarea" :rows="2" placeholder="如：18-35岁女性、都市白领、宝妈群体等" />
        </el-form-item>

        <el-form-item label="选题描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="简要描述选题背景、核心卖点、用户痛点等" />
        </el-form-item>

        <el-form-item label="内容方向" prop="contentDirection">
          <el-input v-model="form.contentDirection" type="textarea" :rows="4" placeholder="阐述内容创作方向、脚本形式、拍摄思路等" />
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
              placeholder="请填写本次修改的审稿意见，例如：补充了目标受众描述，选题更精准，通过审核。该意见将与变更快照一起永久留存。"
            />
            <div style="color:#E6A23C;font-size:12px;margin-top:4px;">
              <el-icon><InfoFilled /></el-icon>
              该意见将写入 review_record 表，作为合规审计依据，不可删除或修改
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
import { saveTopic, getTopicDetail } from '../../api/topic'
import { useUserStore } from '../../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const selectedTags = ref([])
const nextVersion = ref(1)

const isEdit = computed(() => !!route.params.id)

const presetTags = ['夏季', '穿搭', '种草', '测评', '职场', '通勤', '运动', '休闲', '618', '大促', '爆款', '清单', '亲子', '家庭', '干货', '避坑', '教程']

const form = reactive({
  id: null,
  title: '',
  description: '',
  tags: '',
  targetAudience: '',
  contentDirection: '',
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
  title: [{ required: true, message: '请输入选题标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入选题描述', trigger: 'blur' }]
}

const editRules = {
  ...rules,
  reviewOpinion: [{ required: true, message: '编辑模式必须填写审稿意见，用于留存审核记录', trigger: 'blur' }],
  reviewResult: [{ required: true, message: '请选择审核结果', trigger: 'change' }]
}

const activeRules = computed(() => isEdit.value ? editRules : rules)

function onTagsChange(val) {
  form.tags = val.join(',')
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
      await saveTopic(form)
      ElMessage.success(isEdit.value ? '修改成功，变更已写入审核追溯' : '提交成功')
      router.push('/topic')
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
    const res = await getTopicDetail(route.params.id)
    Object.assign(form, res.data)
    form.reviewerId = userStore.userInfo?.id
    form.reviewerName = userStore.userInfo?.nickname
    selectedTags.value = res.data.tags ? res.data.tags.split(',').filter(Boolean) : []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)
</script>
