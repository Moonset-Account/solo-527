<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">新建草稿</h2>
      <div>
        <el-button :icon="Back" @click="handleBack">返回</el-button>
      </div>
    </div>

    <div class="new-draft-wrapper">
      <div class="ai-panel card">
        <div class="panel-header">
          <el-icon :size="20" color="#409eff"><MagicStick /></el-icon>
          <span class="panel-title">AI 智能生成</span>
        </div>
        <el-form label-width="80px" class="ai-form">
          <el-form-item label="邮件类型">
            <el-select v-model="aiForm.type" placeholder="请选择邮件类型" style="width: 100%">
              <el-option label="商务开发" value="bd" />
              <el-option label="客户跟进" value="followup" />
              <el-option label="问题回复" value="reply" />
              <el-option label="会议邀约" value="meeting" />
              <el-option label="报价发送" value="quote" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="收件人信息">
            <el-input
              v-model="aiForm.recipientInfo"
              type="textarea"
              :rows="2"
              placeholder="请描述收件人背景、职位、与您的关系等"
            />
          </el-form-item>
          <el-form-item label="邮件目的">
            <el-input
              v-model="aiForm.purpose"
              type="textarea"
              :rows="3"
              placeholder="请描述邮件的主要目的、希望达成的效果"
            />
          </el-form-item>
          <el-form-item label="关键信息">
            <el-input
              v-model="aiForm.keyPoints"
              type="textarea"
              :rows="3"
              placeholder="请列出邮件需要包含的关键信息点（每行一条）"
            />
          </el-form-item>
          <el-form-item label="语气风格">
            <el-radio-group v-model="aiForm.tone">
              <el-radio-button label="formal">正式</el-radio-button>
              <el-radio-button label="friendly">友好</el-radio-button>
              <el-radio-button label="professional">专业</el-radio-button>
              <el-radio-button label="casual">轻松</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="generating" @click="handleGenerate">
              <el-icon><MagicStick /></el-icon>
              AI 生成邮件
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="editor-panel">
        <EmailEditor
          ref="editorRef"
          v-model="draftData"
          @save-version="handleSaveVersion"
          @submit="handleSubmit"
          @send="handleSend"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import EmailEditor from '@/components/EmailEditor.vue'

const router = useRouter()
const editorRef = ref(null)
const generating = ref(false)

const aiForm = reactive({
  type: '',
  recipientInfo: '',
  purpose: '',
  keyPoints: '',
  tone: 'professional'
})

const draftData = reactive({
  recipient: '',
  subject: '',
  cc: '',
  content: ''
})

function handleBack() {
  router.back()
}

async function handleGenerate() {
  if (!aiForm.type) {
    ElMessage.warning('请选择邮件类型')
    return
  }
  if (!aiForm.purpose) {
    ElMessage.warning('请描述邮件目的')
    return
  }

  generating.value = true

  setTimeout(() => {
    draftData.subject = generateMockSubject(aiForm.type)
    draftData.content = generateMockContent(aiForm)
    editorRef.value?.setContent(draftData.content)
    generating.value = false
    ElMessage.success('AI 生成完成')
  }, 1500)
}

function generateMockSubject(type) {
  const subjects = {
    bd: '关于合作机会的诚挚邀请',
    followup: '跟进之前的沟通 - 期待您的反馈',
    reply: '关于您咨询问题的回复',
    meeting: '会议邀约 - 期待与您深入交流',
    quote: '产品报价单 - 详见附件',
    other: '您好，希望与您进一步沟通'
  }
  return subjects[type] || subjects.other
}

function generateMockContent(form) {
  const greetings = {
    formal: '尊敬的先生/女士：',
    friendly: '您好！',
    professional: '您好：',
    casual: '嗨，您好~'
  }

  const closings = {
    formal: '此致敬礼',
    friendly: '祝好',
    professional: '顺祝商祺',
    casual: '期待您的回复！'
  }

  return `
<p>${greetings[form.tone]}</p>
<p>&nbsp;</p>
<p>${form.purpose || '感谢您百忙之中阅读此邮件。'}</p>
<p>&nbsp;</p>
<p>关键信息：</p>
${form.keyPoints ? form.keyPoints.split('\n').filter(Boolean).map(p => `<p>• ${p}</p>`).join('') : '<p>• （请在此处补充关键信息）</p>'}
<p>&nbsp;</p>
<p>${form.recipientInfo ? `基于对${form.recipientInfo}的了解，我们相信...` : '期待能有机会与您进一步交流。'}</p>
<p>&nbsp;</p>
<p>如有任何疑问，请随时与我联系。</p>
<p>&nbsp;</p>
<p>${closings[form.tone]}</p>
<p>（您的姓名）</p>
<p>${new Date().toLocaleDateString('zh-CN')}</p>
  `.trim()
}

function handleSaveVersion(data) {
  ElMessage.success('版本保存成功')
}

function handleSubmit(data) {
  ElMessage.success('已提交复核')
  setTimeout(() => {
    router.push('/drafts')
  }, 1000)
}

function handleSend(data) {
  ElMessage.success('邮件发送成功')
  setTimeout(() => {
    router.push('/drafts')
  }, 1000)
}
</script>

<style lang="scss" scoped>
.new-draft-wrapper {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;

  .ai-panel {
    padding: 20px;
    height: fit-content;
    position: sticky;
    top: 20px;

    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #ebeef5;

      .panel-title {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .ai-form {
      :deep(.el-form-item) {
        margin-bottom: 16px;
      }
    }
  }

  .editor-panel {
    min-width: 0;
  }
}

@media (max-width: 1024px) {
  .new-draft-wrapper {
    grid-template-columns: 1fr;

    .ai-panel {
      position: static;
    }
  }
}
</style>
