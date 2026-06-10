<template>
  <div class="services-page">
    <div class="page-header">
      <h2>服务项目</h2>
      <p>精选优质美甲服务，让您的指甲更美丽</p>
    </div>

    <div class="category-filter">
      <el-tag
        v-for="cat in categories"
        :key="cat"
        :type="activeCategory === cat ? 'danger' : 'info'"
        class="cat-tag"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </el-tag>
    </div>

    <div v-loading="loading" class="service-grid">
      <div v-for="service in filteredServices" :key="service._id" class="service-card">
        <div class="service-image">
          <img v-if="service.images?.length" :src="service.images[0]" :alt="service.name" />
          <div v-else class="placeholder">
            <el-icon :size="64"><NailPolish /></el-icon>
          </div>
        </div>
        <div class="service-info">
          <h3>{{ service.name }}</h3>
          <p class="description">{{ service.description }}</p>
          <div class="meta">
            <span class="duration">
              <el-icon><Clock /></el-icon>
              {{ service.duration }}分钟
            </span>
          </div>
          <div class="price-row">
            <span class="price">¥{{ service.price }}</span>
            <el-button type="primary" size="small" @click="goToAppointment(service)">
              立即预约
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && filteredServices.length === 0" description="暂无服务项目" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, NailPolish } from '@element-plus/icons-vue'
import { getActiveServices } from '@/api/services'

const router = useRouter()
const loading = ref(false)
const services = ref([])
const activeCategory = ref('全部')

const categories = computed(() => {
  const cats = new Set(services.value.map(s => s.category).filter(Boolean))
  return ['全部', ...cats]
})

const filteredServices = computed(() => {
  if (activeCategory.value === '全部') {
    return services.value
  }
  return services.value.filter(s => s.category === activeCategory.value)
})

async function loadServices() {
  loading.value = true
  try {
    const data = await getActiveServices()
    services.value = data
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

function goToAppointment(service) {
  router.push('/customer/appointment')
}

onMounted(() => {
  loadServices()
})
</script>

<style scoped lang="scss">
.services-page {
  .page-header {
    text-align: center;
    margin-bottom: 30px;

    h2 {
      font-size: 28px;
      margin: 0 0 8px 0;
    }

    p {
      color: #999;
      margin: 0;
    }
  }

  .category-filter {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 30px;
    flex-wrap: wrap;

    .cat-tag {
      cursor: pointer;
      padding: 8px 20px;
      font-size: 14px;
    }
  }

  .service-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }

  .service-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .service-image {
      height: 180px;
      background: #f9f0f4;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .placeholder {
        color: #e91e63;
        opacity: 0.4;
      }
    }

    .service-info {
      padding: 20px;

      h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
      }

      .description {
        font-size: 13px;
        color: #999;
        margin: 0 0 12px 0;
        min-height: 40px;
      }

      .meta {
        margin-bottom: 16px;

        .duration {
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .price-row {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .price {
          font-size: 24px;
          font-weight: bold;
          color: #e91e63;
        }
      }
    }
  }
}
</style>
