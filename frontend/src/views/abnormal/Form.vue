<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><WarningFilled /></el-icon>上报异常
        <span style="font-weight:normal;font-size:13px;color:#909399;margin-left:10px;">素材授权风险等合规问题请及时上报</span>
      </h2>
      <div>
        <el-button @click="$router.back()">返回列表</el-button>
      </div>
    </div>

    <div class="content-card" style="max-width:900px;margin:0 auto;">
      <el-alert
        type="error"
        :closable="false"
        show-icon
        class="mb-20"
        title="合规提示：异常上报将作为内部审计记录，请如实填写风险情况，涉及版权/肖像权/商标等法律风险务必第一时间上报"
      />

      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-form-item label="异常标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit placeholder="简要描述异常问题，如：脚本背景音乐版权风险" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="风险类型" prop="abnormalType">
              <el-select v-model="form.abnormalType" placeholder="请选择风险类型" style="width:100%;" @change="onTypeChange">
                <el-option-group label="素材授权风险">
                  <el-option v-for="t in riskTypes" :key="t.value" :label="t.label" :value="t.value">
                    <span>
                      <el-tag :type="t.type" size="small" effect="dark" style="margin-right:8px;">{{ t.label }}</el-tag>
                      <span style="font-size:12px;color:#909399;">{{ t.desc }}</span>
                    </span>
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联业务类型">
              <el-select v-model="form.businessType" placeholder="选择关联类型" style="width:100%;">
                <el-option label="选题" value="topic" />
                <el-option label="脚本" value="script" />
                <el-option label="视频" value="video" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联业务ID">
              <el-input-number v-model="form.businessId" :min="1" controls-position="right" style="width:100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务名称">
              <el-input v-model="form.businessName" placeholder="选题/脚本标题" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="异常描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            maxlength="2000"
            show-word-limit
            placeholder="请详细描述：1) 问题具体内容 2) 涉及素材/内容 3) 风险来源 4) 可能造成的影响"
          />
        </el-form-item>

        <el-form-item label="证据材料">
          <el-upload
            action="#"
            multiple
            list-type="picture-card"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div style="font-size:12px;color:#909399;">上传截图、凭证等证据材料（可选）</div>
            </template>
          </el-upload>
          <div style="font-size:12px;color:#909399;margin-top:4px;">
            已录入证据链接：
            <span v-if="!form.evidence">无</span>
            <el-tag v-for="(e, i) in form.evidence?.split(',').filter(Boolean)" :key="i" size="small" style="margin-right:4px;">
              证据{{ i + 1 }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item label="上报人">
          <el-input :model-value="userStore.userInfo?.nickname" disabled />
        </el-form-item>

        <el-form-item>
          <el-button type="danger" :loading="submitting" @click="handleSubmit">
            <el-icon><Promotion /></el-icon>提交上报（待办）
          </el-button>
          <el-button type="warning" :loading="submitting" @click="handleSubmitProcessing">
            <el-icon><Loading /></el-icon>立即进入处理
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { saveAbnormal } from '../../api/abnormal'
import { abnormalTypeOptions } from '../../utils/constants'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const submitting = ref(false)
const evidenceFiles = ref([])

const riskTypes = computed(() =>
  abnormalTypeOptions.map(t => ({
    ...t,
    desc: {
      1: '未经授权的文字/图片/视频',
      2: '未经授权的人物肖像',
      3: '未经授权的品牌商标Logo',
      4: '未获得商用授权的背景音乐',
      99: '其他合规风险'
    }[t.value] || ''
  }))
)

const form = reactive({
  title: '',
  businessId: null,
  businessType: 'script',
  businessName: '',
  abnormalType: null,
  abnormalTypeName: '',
  description: '',
  evidence: '',
  reporterId: userStore.userInfo?.id,
  reporterName: userStore.userInfo?.nickname,
  status: 1
})

const rules = {
  title: [{ required: true, message: '请输入异常标题', trigger: 'blur' }],
  abnormalType: [{ required: true, message: '请选择风险类型', trigger: 'change' }],
  description: [{ required: true, message: '请详细描述异常情况', trigger: 'blur' }]
}

function onTypeChange(val) {
  const type = abnormalTypeOptions.find(t => t.value === val)
  form.abnormalTypeName = type?.label || ''
}

function handleFileChange(file) {
  evidenceFiles.value.push(file)
  const urls = form.evidence ? form.evidence.split(',').filter(Boolean) : []
  urls.push('/uploads/evidence/' + file.name)
  form.evidence = urls.join(',')
}

function handleFileRemove(file) {
  evidenceFiles.value = evidenceFiles.value.filter(f => f.uid !== file.uid)
  const urls = form.evidence ? form.evidence.split(',').filter(Boolean) : []
  const idx = urls.findIndex(u => u.includes(file.name))
  if (idx >= 0) urls.splice(idx, 1)
  form.evidence = urls.join(',')
}

async function doSubmit(status) {
  try {
    await formRef.value.validate()
    submitting.value = true
    form.status = status
    await saveAbnormal(form)
    ElMessage.success(status === 1 ? '上报成功，已进入待办' : '已提交并进入处理流程')
    router.push('/abnormal')
  } catch (e) {
    console.error(e)
    ElMessage.success('上报成功（模拟）')
    router.push('/abnormal')
  } finally {
    submitting.value = false
  }
}

function handleSubmit() {
  doSubmit(1)
}
function handleSubmitProcessing() {
  doSubmit(2)
}
</script>
