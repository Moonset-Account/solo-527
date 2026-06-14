<template>
  <div class="subscribe-page">
    <header class="page-header">
      <div class="header-content">
        <div class="logo">
          <el-icon :size="32" color="#67c23a"><Aim /></el-icon>
          <span>青禾播客</span>
        </div>
        <el-button type="primary" plain @click="goLogin">后台登录</el-button>
      </div>
    </header>

    <section class="hero-section">
      <div class="hero-content">
        <h1>订阅青禾会员，解锁全部精彩内容</h1>
        <p class="subtitle">深度商业访谈、行业趋势分析、独家嘉宾分享，每周更新，陪你洞察商业本质</p>
        <div class="stats">
          <div class="stat-item">
            <span class="num">200+</span>
            <span class="label">会员专属节目</span>
          </div>
          <div class="stat-item">
            <span class="num">50+</span>
            <span class="label">行业顶级嘉宾</span>
          </div>
          <div class="stat-item">
            <span class="num">10万+</span>
            <span class="label">会员信赖之选</span>
          </div>
        </div>
      </div>
    </section>

    <section class="plans-section">
      <div class="section-title">选择适合你的计划</div>
      <el-row :gutter="24" class="plans-row">
        <el-col :xs="24" :md="8" v-for="plan in plans" :key="plan.id">
          <div class="plan-card" :class="{ featured: plan.level === 'vip' }">
            <div v-if="plan.level === 'vip'" class="badge">最受欢迎</div>
            <div class="plan-name">{{ plan.name }}</div>
            <div class="plan-desc">{{ plan.description }}</div>
            <div class="plan-price">
              <span class="currency">¥</span>
              <span class="amount">{{ plan.billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice }}</span>
              <span class="unit">/{{ plan.billingCycle === 'yearly' ? '年' : '月' }}</span>
            </div>
            <div v-if="plan.billingCycle === 'yearly'" class="save-tip">
              立省 ¥{{ Math.round(plan.monthlyPrice * 12 - plan.yearlyPrice) }}
            </div>
            <ul class="plan-features">
              <li v-for="(feat, idx) in parseFeatures(plan.features)" :key="idx">
                <el-icon color="#67c23a"><Check /></el-icon>
                <span>{{ feat }}</span>
              </li>
            </ul>
            <el-button
              type="primary"
              size="large"
              class="subscribe-btn"
              :plain="plan.level !== 'vip'"
              :loading="subscribingPlanId === plan.id"
              @click="handleSubscribe(plan)"
            >
              {{ plan.level === 'vip' ? '立即开通' : '选择方案' }}
            </el-button>
          </div>
        </el-col>
      </el-row>
    </section>

    <section class="features-section">
      <div class="section-title">会员专属权益</div>
      <el-row :gutter="24">
        <el-col :xs="12" :md="6" v-for="(feat, idx) in featureList" :key="idx">
          <div class="feature-item">
            <div class="feature-icon" :style="{ background: feat.bgColor }">
              <el-icon :size="32" color="#fff">
                <component :is="feat.icon" />
              </el-icon>
            </div>
            <div class="feature-title">{{ feat.title }}</div>
            <div class="feature-desc">{{ feat.desc }}</div>
          </div>
        </el-col>
      </el-row>
    </section>

    <footer class="page-footer">
      <p>© 2026 青禾播客 · 保留所有权利</p>
    </footer>

    <el-dialog v-model="payDialogVisible" title="确认订阅" width="420px">
      <div v-if="selectedPlan" class="pay-info">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="套餐名称">{{ selectedPlan.name }}</el-descriptions-item>
          <el-descriptions-item label="计费周期">
            {{ selectedPlan.billingCycle === 'yearly' ? '年付' : '月付' }}
          </el-descriptions-item>
          <el-descriptions-item label="应付金额">
            <span class="amount">
              ¥{{ selectedPlan.billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
        <div class="pay-method">
          <div class="pay-method-title">选择支付方式</div>
          <el-radio-group v-model="payMethod">
            <el-radio label="alipay">
              <el-icon><Monitor /></el-icon> 支付宝
            </el-radio>
            <el-radio label="wechat">
              <el-icon><ChatDotRound /></el-icon> 微信支付
            </el-radio>
            <el-radio label="card">
              <el-icon><CreditCard /></el-icon> 银行卡
            </el-radio>
          </el-radio-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="paying" @click="confirmPay">确认支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { subscriptionApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const plans = ref<any[]>([])
const featureList = [
  { icon: 'Headset', title: '无广告畅听', desc: '所有节目无广告打扰，纯净收听体验', bgColor: '#67c23a' },
  { icon: 'Crown', title: '独家深度内容', desc: '会员专属深度访谈和行业分析', bgColor: '#e6a23c' },
  { icon: 'UserFilled', title: '嘉宾互动', desc: '与行业大咖线上交流机会', bgColor: '#409eff' },
  { icon: 'DataLine', title: '专属数据报告', desc: '每月行业数据洞察报告', bgColor: '#909399' }
]
const payDialogVisible = ref(false)
const selectedPlan = ref<any>(null)
const subscribingPlanId = ref<number | null>(null)
const paying = ref(false)
const payMethod = ref('alipay')

const parseFeatures = (features: string) => {
  try {
    return JSON.parse(features)
  } catch {
    return []
  }
}

const goLogin = () => {
  router.push('/login')
}

const handleSubscribe = async (plan: any) => {
  if (!userStore.isLoggedIn()) {
    ElMessage.warning('请先登录后再订阅')
    router.push('/login')
    return
  }
  selectedPlan.value = plan
  subscribingPlanId.value = plan.id
  payDialogVisible.value = true
  subscribingPlanId.value = null
}

const confirmPay = async () => {
  if (!selectedPlan.value) return
  paying.value = true
  try {
    const cycle = selectedPlan.value.billingCycle === 'yearly' ? 'yearly' : 'monthly'
    await subscriptionApi.checkout({
      planId: selectedPlan.value.id,
      billingCycle: cycle,
      paymentMethod: payMethod.value
    })
    ElMessage.success('订阅成功！感谢您的支持')
    payDialogVisible.value = false
  } finally {
    paying.value = false
  }
}

onMounted(async () => {
  try {
    const res: any = await subscriptionApi.getActivePlans()
    plans.value = res.data || []
  } catch (e) {
    plans.value = [
      { id: 1, planCode: 'BASIC_MONTHLY', name: '基础会员', description: '适合个人用户，收听会员专属播客内容',
        features: JSON.stringify(['会员专属播客', '无广告收听', '高清音质', '基础数据看板']),
        monthlyPrice: 29, yearlyPrice: 290, billingCycle: 'monthly', level: 'basic' },
      { id: 2, planCode: 'PRO_MONTHLY', name: '专业会员', description: '适合重度用户，解锁全部会员权益',
        features: JSON.stringify(['全部基础会员权益', '专属社群', '嘉宾互动', '每月1张品牌优惠券']),
        monthlyPrice: 99, yearlyPrice: 990, billingCycle: 'monthly', level: 'pro' },
      { id: 3, planCode: 'VIP_YEARLY', name: 'VIP年度会员', description: '年度超值套餐，赠送2个月',
        features: JSON.stringify(['全部专业会员权益', '独家深度报告', '品牌合作优先权', '专属客服', '年度专属礼盒']),
        monthlyPrice: 0, yearlyPrice: 999, billingCycle: 'yearly', level: 'vip' }
    ]
  }
})
</script>

<style lang="scss" scoped>
.subscribe-page {
  min-height: 100vh;
  background: #fff;

  .page-header {
    background: #fff;
    border-bottom: 1px solid #ebeef5;
    position: sticky;
    top: 0;
    z-index: 100;

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }

  .hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    padding: 80px 24px;
    text-align: center;

    .hero-content {
      max-width: 800px;
      margin: 0 auto;

      h1 {
        font-size: 40px;
        margin-bottom: 16px;
      }

      .subtitle {
        font-size: 18px;
        opacity: 0.9;
        margin-bottom: 48px;
      }

      .stats {
        display: flex;
        justify-content: center;
        gap: 48px;

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .num {
            font-size: 36px;
            font-weight: 700;
          }

          .label {
            font-size: 14px;
            opacity: 0.8;
          }
        }
      }
    }
  }

  .plans-section, .features-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 64px 24px;

    .section-title {
      text-align: center;
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 48px;
      color: #303133;
    }
  }

  .plans-row {
    display: flex;
    justify-content: center;
  }

  .plan-card {
    background: #fff;
    border: 2px solid #ebeef5;
    border-radius: 12px;
    padding: 32px 24px;
    position: relative;
    transition: all 0.3s;
    height: 100%;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    }

    &.featured {
      border-color: #67c23a;
      background: linear-gradient(180deg, #f0f9eb 0%, #fff 30%);

      .subscribe-btn {
        background: #67c23a;
        border-color: #67c23a;
      }
    }

    .badge {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(90deg, #f56c6c, #e6a23c);
      color: #fff;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .plan-name {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }

    .plan-desc {
      font-size: 14px;
      color: #909399;
      margin-bottom: 24px;
      min-height: 40px;
    }

    .plan-price {
      margin-bottom: 8px;

      .currency {
        font-size: 20px;
        color: #303133;
      }

      .amount {
        font-size: 48px;
        font-weight: 700;
        color: #303133;
        margin: 0 4px;
      }

      .unit {
        font-size: 14px;
        color: #909399;
      }
    }

    .save-tip {
      color: #f56c6c;
      font-size: 13px;
      margin-bottom: 16px;
    }

    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0 0 24px;

      li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        font-size: 14px;
        color: #606266;
      }
    }

    .subscribe-btn {
      width: 100%;
      height: 44px;
      font-size: 16px;
    }
  }

  .features-section {
    background: #f5f7fa;
    .feature-item {
      text-align: center;
      padding: 24px;

      .feature-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      }

      .feature-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #303133;
      }

      .feature-desc {
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .page-footer {
    padding: 32px;
    text-align: center;
    color: #909399;
    font-size: 13px;
    border-top: 1px solid #ebeef5;
  }

  .pay-info {
    .amount {
      color: #f56c6c;
      font-size: 20px;
      font-weight: 600;
    }

    .pay-method {
      margin-top: 24px;

      .pay-method-title {
        font-weight: 500;
        margin-bottom: 12px;
      }

      :deep(.el-radio) {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
      }
    }
  }
}
</style>
