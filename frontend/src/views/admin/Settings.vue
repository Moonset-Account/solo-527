<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">系统设置</h2>
    </div>

    <el-tabs v-model="activeTab" class="settings-tabs">
      <el-tab-pane label="基本设置" name="basic">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>基本信息配置</span>
            </div>
          </template>
          <el-form :model="basicForm" label-width="120px" style="max-width: 640px;">
            <el-form-item label="系统名称">
              <el-input v-model="basicForm.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            <el-form-item label="系统Logo">
              <el-upload
                class="avatar-uploader"
                :show-file-list="false"
                :before-upload="handleBeforeLogoUpload"
              >
                <img v-if="basicForm.logo" :src="basicForm.logo" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="系统描述">
              <el-input v-model="basicForm.description" type="textarea" :rows="3" placeholder="请输入系统描述" />
            </el-form-item>
            <el-form-item label="默认语言">
              <el-select v-model="basicForm.language" style="width: 200px;">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
            <el-form-item label="时区设置">
              <el-select v-model="basicForm.timezone" style="width: 200px;">
                <el-option label="UTC+8 北京" value="Asia/Shanghai" />
                <el-option label="UTC+0 伦敦" value="Europe/London" />
                <el-option label="UTC-5 纽约" value="America/New_York" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveBasic">
                <el-icon><Check /></el-icon>
                保存设置
              </el-button>
              <el-button @click="handleResetBasic">
                <el-icon><RefreshLeft /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="邮件配置" name="email">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>SMTP 邮件服务器配置</span>
              <el-button size="small" type="primary" plain @click="handleTestEmail">
                <el-icon><Promotion /></el-icon>
                测试连接
              </el-button>
            </div>
          </template>
          <el-form :model="emailForm" label-width="120px" style="max-width: 640px;">
            <el-form-item label="SMTP服务器">
              <el-input v-model="emailForm.host" placeholder="例如: smtp.example.com" />
            </el-form-item>
            <el-form-item label="端口">
              <el-input-number v-model="emailForm.port" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="emailForm.username" placeholder="邮箱账号" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="emailForm.password" type="password" placeholder="邮箱密码或授权码" show-password />
            </el-form-item>
            <el-form-item label="加密方式">
              <el-radio-group v-model="emailForm.encryption">
                <el-radio value="none">无</el-radio>
                <el-radio value="ssl">SSL</el-radio>
                <el-radio value="tls">TLS</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="发件人名称">
              <el-input v-model="emailForm.fromName" placeholder="邮件显示的发件人名称" />
            </el-form-item>
            <el-form-item label="发件人邮箱">
              <el-input v-model="emailForm.fromAddress" placeholder="发件人邮箱地址" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveEmail">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="AI 配置" name="ai">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>大语言模型 API 配置</span>
              <el-button size="small" type="primary" plain @click="handleTestAI">
                <el-icon><MagicStick /></el-icon>
                测试连接
              </el-button>
            </div>
          </template>
          <el-form :model="aiForm" label-width="120px" style="max-width: 640px;">
            <el-form-item label="API 服务商">
              <el-select v-model="aiForm.provider" style="width: 240px;">
                <el-option label="OpenAI" value="openai" />
                <el-option label="Anthropic" value="anthropic" />
                <el-option label="智谱AI" value="zhipu" />
                <el-option label="通义千问" value="qwen" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item label="API Base URL">
              <el-input v-model="aiForm.baseUrl" placeholder="API 接口地址" />
            </el-form-item>
            <el-form-item label="API Key">
              <el-input v-model="aiForm.apiKey" type="password" placeholder="请输入 API Key" show-password />
            </el-form-item>
            <el-form-item label="模型名称">
              <el-input v-model="aiForm.model" placeholder="例如: gpt-4, gpt-3.5-turbo" />
            </el-form-item>
            <el-form-item label="温度 (Temperature)">
              <el-slider v-model="aiForm.temperature" :min="0" :max="2" :step="0.1" show-input />
            </el-form-item>
            <el-form-item label="最大 Token 数">
              <el-input-number v-model="aiForm.maxTokens" :min="100" :max="32000" :step="100" />
            </el-form-item>
            <el-form-item label="请求超时(秒)">
              <el-input-number v-model="aiForm.timeout" :min="10" :max="300" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveAI">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="安全设置" name="security">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>安全与权限配置</span>
            </div>
          </template>
          <el-form :model="securityForm" label-width="160px" style="max-width: 640px;">
            <el-form-item label="会话超时时间(分钟)">
              <el-input-number v-model="securityForm.sessionTimeout" :min="5" :max="1440" />
            </el-form-item>
            <el-form-item label="密码最小长度">
              <el-input-number v-model="securityForm.passwordMinLength" :min="6" :max="32" />
            </el-form-item>
            <el-form-item label="密码复杂度要求">
              <el-checkbox-group v-model="securityForm.passwordRules">
                <el-checkbox value="uppercase">包含大写字母</el-checkbox>
                <el-checkbox value="lowercase">包含小写字母</el-checkbox>
                <el-checkbox value="number">包含数字</el-checkbox>
                <el-checkbox value="special">包含特殊字符</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="登录失败锁定">
              <el-form-item label="尝试次数" style="margin-bottom: 0;">
                <el-input-number v-model="securityForm.maxLoginAttempts" :min="3" :max="20" />
              </el-form-item>
              <el-form-item label="锁定时长(分钟)" style="margin-bottom: 0;">
                <el-input-number v-model="securityForm.lockDuration" :min="5" :max="1440" />
              </el-form-item>
            </el-form-item>
            <el-form-item label="启用双因素认证">
              <el-switch v-model="securityForm.enable2FA" />
            </el-form-item>
            <el-form-item label="登录IP白名单">
              <el-input
                v-model="securityForm.ipWhitelist"
                type="textarea"
                :rows="3"
                placeholder="每行一个IP，支持IP段，如: 192.168.1.0/24"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveSecurity">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Check, RefreshLeft, Promotion, MagicStick } from '@element-plus/icons-vue'

const activeTab = ref('basic')

const basicForm = reactive({
  systemName: '销售邮件智能处理台',
  logo: '',
  description: 'AI 驱动的高效邮件撰写与管理平台',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai'
})

const emailForm = reactive({
  host: 'smtp.example.com',
  port: 465,
  username: 'noreply@example.com',
  password: '',
  encryption: 'ssl',
  fromName: '销售邮件智能平台',
  fromAddress: 'noreply@example.com'
})

const aiForm = reactive({
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 4000,
  timeout: 60
})

const securityForm = reactive({
  sessionTimeout: 30,
  passwordMinLength: 8,
  passwordRules: ['uppercase', 'lowercase', 'number'],
  maxLoginAttempts: 5,
  lockDuration: 30,
  enable2FA: false,
  ipWhitelist: ''
})

function handleBeforeLogoUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  ElMessage.success('Logo 上传成功')
  return false
}

function handleSaveBasic() {
  ElMessage.success('基本设置保存成功')
}

function handleResetBasic() {
  basicForm.systemName = '销售邮件智能处理台'
  basicForm.logo = ''
  basicForm.description = 'AI 驱动的高效邮件撰写与管理平台'
  basicForm.language = 'zh-CN'
  basicForm.timezone = 'Asia/Shanghai'
  ElMessage.info('已重置为默认值')
}

function handleTestEmail() {
  ElMessage.info('正在测试邮件连接...')
  setTimeout(() => {
    ElMessage.success('邮件服务器连接测试成功')
  }, 1000)
}

function handleSaveEmail() {
  ElMessage.success('邮件配置保存成功')
}

function handleTestAI() {
  if (!aiForm.apiKey) {
    ElMessage.warning('请先配置 API Key')
    return
  }
  ElMessage.info('正在测试 AI 连接...')
  setTimeout(() => {
    ElMessage.success('AI API 连接测试成功')
  }, 1000)
}

function handleSaveAI() {
  ElMessage.success('AI 配置保存成功')
}

function handleSaveSecurity() {
  ElMessage.success('安全设置保存成功')
}
</script>

<style lang="scss" scoped>
.settings-tabs {
  background: #fff;
  border-radius: 4px;
  padding: 0 20px;

  :deep(.el-tabs__content) {
    padding: 20px 0;
  }
}

.settings-card {
  border: none;
  box-shadow: none;

  :deep(.el-card__header) {
    padding: 0 0 16px;
    border-bottom: 1px solid #ebeef5;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    font-size: 15px;
  }
}

.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: #409eff;
    }
  }

  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
  }

  .avatar {
    width: 100px;
    height: 100px;
    display: block;
    object-fit: contain;
  }
}
</style>
