<template>
  <div class="my-activities">
    <h2>我的活动</h2>
    
    <el-tabs v-model="activeTab" class="activity-tabs">
      <el-tab-pane label="已报名活动" name="registered">
        <el-table :data="registeredActivities" v-loading="loading" stripe>
          <el-table-column prop="activity_title" label="活动名称" />
          <el-table-column prop="child_name" label="参与孩子" />
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ row.status_display }}
              </el-tag>
              <span v-if="row.status === 'waitlisted'" class="waitlist-position">
                候补排位：第 {{ row.waitlist_position }} 位
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="activity_start_time" label="活动时间">
            <template #default="{ row }">
              {{ formatDate(row.activity_start_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="activity_location" label="活动地点" />
          <el-table-column prop="registered_at" label="报名时间">
            <template #default="{ row }">
              {{ formatDate(row.registered_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button 
                type="danger" 
                size="small" 
                @click="cancelRegistration(row)"
                v-if="row.status === 'registered' || row.status === 'waitlisted' || row.status === 'promoted'"
              >
                取消报名
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                @click="goToDetail(row.activity_id)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="候补通知" name="notifications">
        <el-table :data="notifications" v-loading="loadingNotifications" stripe>
          <el-table-column label="活动名称">
            <template #default="{ row }">
              {{ row.registration?.activity_title || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="notification_type_display" label="通知类型" />
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-tag :type="row.read_at ? 'info' : 'warning'">
                {{ row.read_at ? '已读' : '未读' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="通知内容" />
          <el-table-column prop="sent_at" label="通知时间">
            <template #default="{ row }">
              {{ formatDate(row.sent_at || row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250">
            <template #default="{ row }">
              <el-button 
                type="success" 
                size="small" 
                @click="confirmWaitlist(row)"
                v-if="row.notification_type === 'promoted' && row.registration?.status === 'promoted'"
              >
                确认参加
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                @click="markAsRead(row)"
                v-if="!row.read_at"
              >
                标记已读
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                @click="goToDetail(row.registration?.activity_id)"
                v-if="row.registration?.activity_id"
              >
                查看活动
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty v-if="!loadingNotifications && notifications.length === 0" description="暂无通知" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const router = useRouter()

const activeTab = ref('registered')
const loading = ref(false)
const loadingNotifications = ref(false)
const registeredActivities = ref([])
const notifications = ref([])

const getStatusType = (status) => {
  const typeMap = {
    'registered': 'success',
    'waitlisted': 'warning',
    'confirmed': 'primary',
    'cancelled': 'info',
    'attended': 'success',
    'no_show': 'danger',
    'promoted': 'warning'
  }
  return typeMap[status] || 'info'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadRegistrations = async () => {
  loading.value = true
  try {
    const res = await api.activities.myRegistrations()
    registeredActivities.value = res.results || res
  } catch (error) {
    ElMessage.error('加载活动报名失败')
  } finally {
    loading.value = false
  }
}

const loadNotifications = async () => {
  loadingNotifications.value = true
  try {
    const res = await api.activities.waitlistNotifications()
    notifications.value = res.results || res
  } catch (error) {
    console.error('加载候补通知失败', error)
  } finally {
    loadingNotifications.value = false
  }
}

const cancelRegistration = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消报名吗？取消后候补顺位将失效', '确认取消', {
      type: 'warning'
    })
  } catch {
    return
  }
  
  try {
    await api.activities.cancelRegistration(row.id)
    ElMessage.success('已取消报名')
    loadRegistrations()
  } catch (error) {
    ElMessage.error('取消失败')
  }
}

const confirmWaitlist = async (notification) => {
  try {
    await ElMessageBox.confirm('候补转正通知！确认参加此活动吗？请在规定时间内确认，否则名额将顺延给下一位候补', '确认参加', {
      type: 'success'
    })
  } catch {
    return
  }
  
  try {
    await api.activities.confirmWaitlistPromotion(notification.id)
    ElMessage.success('已确认参加')
    loadNotifications()
    loadRegistrations()
  } catch (error) {
    ElMessage.error('确认失败')
  }
}

const markAsRead = async (notification) => {
  try {
    await api.activities.markNotificationRead(notification.id)
    notification.read_at = new Date().toISOString()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const goToDetail = (activityId) => {
  if (activityId) {
    router.push(`/activities/${activityId}`)
  }
}

onMounted(() => {
  loadRegistrations()
  loadNotifications()
})
</script>

<style scoped>
.my-activities {
  padding: 20px;
}

.my-activities h2 {
  margin-bottom: 20px;
}

.activity-tabs {
  margin-top: 20px;
}

.waitlist-position {
  margin-left: 10px;
  color: #e6a23c;
  font-size: 13px;
}
</style>
