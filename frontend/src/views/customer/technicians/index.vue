<template>
  <div class="technicians-page">
    <div class="page-header">
      <h2>技师团队</h2>
      <p>专业的技师团队，为您提供优质服务</p>
    </div>

    <div v-loading="loading" class="technician-grid">
      <div v-for="tech in technicians" :key="tech._id" class="technician-card">
        <div class="tech-avatar">
          <el-avatar :size="120" :src="tech.avatar">
            {{ tech.name?.charAt(0) }}
          </el-avatar>
        </div>
        <div class="tech-info">
          <h3>{{ tech.name }}</h3>
          <p class="position">{{ tech.position }}</p>
          <p class="description">{{ tech.description }}</p>
          <div class="skills">
            <el-tag v-for="skill in tech.skills" :key="skill" size="small" type="info">
              {{ skill }}
            </el-tag>
          </div>
          <el-button type="primary" class="book-btn" @click="goToAppointment(tech)">
            立即预约
          </el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && technicians.length === 0" description="暂无技师信息" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getActiveTechnicians } from '@/api/technicians'

const router = useRouter()
const loading = ref(false)
const technicians = ref([])

async function loadTechnicians() {
  loading.value = true
  try {
    const data = await getActiveTechnicians()
    technicians.value = data
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

function goToAppointment(tech) {
  router.push('/customer/appointment')
}

onMounted(() => {
  loadTechnicians()
})
</script>

<style scoped lang="scss">
.technicians-page {
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

  .technician-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }

  .technician-card {
    background: #fff;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .tech-avatar {
      margin-bottom: 16px;

      :deep(.el-avatar) {
        border: 4px solid #f0f0f0;
      }
    }

    .tech-info {
      h3 {
        margin: 0 0 4px 0;
        font-size: 20px;
      }

      .position {
        color: #e91e63;
        font-size: 14px;
        margin: 0 0 12px 0;
      }

      .description {
        font-size: 13px;
        color: #666;
        margin: 0 0 16px 0;
        min-height: 40px;
      }

      .skills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
        margin-bottom: 20px;
      }

      .book-btn {
        width: 100%;
      }
    }
  }
}
</style>
