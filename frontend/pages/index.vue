<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1>票务运营签到核销系统</h1>
        <p>行业峰会专业票务管理解决方案</p>
        <div class="hero-buttons">
          <n-button type="primary" size="large" @click="goToRegister">
            立即报名
          </n-button>
          <n-button size="large" @click="goToAdmin">
            后台管理
          </n-button>
        </div>
      </div>
    </div>
    
    <div class="features-section">
      <n-grid :cols="3" :x-gap="24" :y-gap="24">
        <n-grid-item>
          <n-card :bordered="false" class="feature-card">
            <div class="feature-icon">
              <FileTrayStackedOutline :size="40" />
            </div>
            <h3>在线报名</h3>
            <p>快捷提交报名资料，支持实名信息登记，自动生成报名编号</p>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card :bordered="false" class="feature-card">
            <div class="feature-icon">
              <QrCodeOutline :size="40" />
            </div>
            <h3>扫码签到</h3>
            <p>支持多设备签到核销，实时统计到场数据，到场反馈记录</p>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card :bordered="false" class="feature-card">
            <div class="feature-icon">
              <BarChartOutline :size="40" />
            </div>
            <h3>数据报表</h3>
            <p>报名质量分级，历史记录追溯，支持Excel报表导出</p>
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton, NCard, NGrid, NGridItem, NIcon } from 'naive-ui'
import { FileTrayStackedOutline, QrCodeOutline, BarChartOutline } from '@vicons/ionicons5'

const router = useRouter()

const goToRegister = () => {
  router.push('/register')
}

const goToAdmin = () => {
  router.push('/admin')
}
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px;
  text-align: center;
  color: #fff;
  
  .hero-content {
    max-width: 800px;
    margin: 0 auto;
    
    h1 {
      font-size: 42px;
      margin-bottom: 16px;
    }
    
    p {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 32px;
    }
  }
  
  .hero-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
}

.features-section {
  max-width: 1000px;
  margin: 0 auto;
  padding: 60px 20px;
}

.feature-card {
  text-align: center;
  padding: 30px 20px;
  
  .feature-icon {
    color: #18a058;
    margin-bottom: 16px;
  }
  
  h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: #333;
  }
  
  p {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
  }
}
</style>
