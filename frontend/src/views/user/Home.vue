<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">专业家电维修服务</h1>
        <p class="hero-subtitle">快速上门 · 透明报价 · 质保无忧</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="goCreateOrder">
            立即下单
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
          <el-button size="large" @click="scrollToServices">了解更多</el-button>
        </div>
        <div v-if="isDemoMode" class="demo-banner">
          <el-tag type="warning" size="large">演示模式 - 数据仅供展示</el-tag>
        </div>
      </div>
      <div class="hero-image">
        <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop" alt="家电维修服务" />
      </div>
    </section>

    <section class="features-section">
      <div class="section-title">
        <h2>为什么选择我们</h2>
        <p>专业团队，用心服务</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon :size="40" color="#409eff"><Clock /></el-icon>
          </div>
          <h3>快速响应</h3>
          <p>30分钟内响应，24小时内上门服务</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon :size="40" color="#67c23a"><Money /></el-icon>
          </div>
          <h3>透明报价</h3>
          <p>明码标价，先报价后维修，无隐形消费</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon :size="40" color="#e6a23c"><Medal /></el-icon>
          </div>
          <h3>专业团队</h3>
          <p>持证上岗，经验丰富，专业技术保障</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon :size="40" color="#f56c6c"><Lock /></el-icon>
          </div>
          <h3>售后保障</h3>
          <p>维修后提供质保，让您安心使用</p>
        </div>
      </div>
    </section>

    <section id="services" class="services-section">
      <div class="section-title">
        <h2>服务项目</h2>
        <p>覆盖各类家电维修，一站式解决您的问题</p>
      </div>
      <div class="services-grid">
        <div v-for="service in services" :key="service.value" class="service-card" @click="selectService(service)">
          <div class="service-image">
            <img :src="service.image" :alt="service.label" />
          </div>
          <div class="service-info">
            <h3>{{ service.label }}</h3>
            <p class="service-price">起价 ¥{{ service.price }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="cta-content">
        <h2>家电出问题？立即下单维修</h2>
        <p>专业师傅快速上门，让您的家电重获新生</p>
        <el-button type="primary" size="large" @click="goCreateOrder">
          立即预约
          <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Clock, Money, Medal, Lock } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { DEVICE_TYPES } from '@/utils/constants'

const router = useRouter()
const appStore = useAppStore()

const isDemoMode = computed(() => appStore.isDemoMode)

const services = DEVICE_TYPES.map((type, index) => ({
  ...type,
  price: 50 + index * 10,
  image: `https://images.unsplash.com/photo-${1581091226825 + index * 1000}?w=300&h=200&fit=crop`
}))

function goCreateOrder() {
  router.push('/order/create')
}

function selectService(service: any) {
  router.push({
    path: '/order/create',
    query: { deviceType: service.value }
  })
}

function scrollToServices() {
  const el = document.getElementById('services')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style lang="scss" scoped>
.home-page {
  .hero-section {
    display: flex;
    align-items: center;
    gap: 60px;
    padding: 60px 0;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
    border-radius: 16px;
    padding: 60px 40px;
    margin-bottom: 60px;

    .hero-content {
      flex: 1;

      .hero-title {
        font-size: 42px;
        font-weight: 700;
        color: #303133;
        margin-bottom: 16px;
        line-height: 1.3;
      }

      .hero-subtitle {
        font-size: 18px;
        color: #606266;
        margin-bottom: 32px;
      }

      .hero-actions {
        display: flex;
        gap: 16px;
      }

      .demo-banner {
        margin-top: 20px;
      }
    }

    .hero-image {
      flex: 1;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);

      img {
        width: 100%;
        height: 360px;
        object-fit: cover;
        display: block;
      }
    }
  }

  .section-title {
    text-align: center;
    margin-bottom: 40px;

    h2 {
      font-size: 32px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 10px;
    }

    p {
      color: #909399;
      font-size: 16px;
    }
  }

  .features-section {
    margin-bottom: 60px;

    .features-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }

    .feature-card {
      background: #fff;
      padding: 32px 24px;
      border-radius: 12px;
      text-align: center;
      transition: transform 0.3s, box-shadow 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      }

      .feature-icon {
        margin-bottom: 16px;
      }

      h3 {
        font-size: 18px;
        color: #303133;
        margin-bottom: 8px;
      }

      p {
        color: #909399;
        font-size: 14px;
        line-height: 1.6;
      }
    }
  }

  .services-section {
    margin-bottom: 60px;

    .services-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .service-card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      }

      .service-image {
        height: 160px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
      }

      &:hover .service-image img {
        transform: scale(1.05);
      }

      .service-info {
        padding: 16px;

        h3 {
          font-size: 16px;
          color: #303133;
          margin-bottom: 6px;
        }

        .service-price {
          color: #f56c6c;
          font-weight: 600;
          font-size: 16px;
        }
      }
    }
  }

  .cta-section {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    border-radius: 16px;
    padding: 50px;
    text-align: center;
    color: #fff;

    .cta-content {
      h2 {
        font-size: 28px;
        margin-bottom: 12px;
      }

      p {
        font-size: 16px;
        margin-bottom: 24px;
        opacity: 0.9;
      }
    }
  }
}

@media (max-width: 1024px) {
  .home-page {
    .features-grid, .services-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .hero-section {
      flex-direction: column;
      text-align: center;

      .hero-actions {
        justify-content: center;
      }
    }
  }
}

@media (max-width: 600px) {
  .home-page {
    .features-grid, .services-grid {
      grid-template-columns: 1fr;
    }

    .hero-section .hero-title {
      font-size: 28px;
    }
  }
}
</style>
