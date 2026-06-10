<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <el-button type="primary" link :icon="ArrowLeft" @click="goBack">返回</el-button>
        <h2 class="page-title" style="display: inline-block; margin-left: 12px;">会员详情</h2>
      </div>
    </div>

    <div class="member-card card-wrapper mb-20">
      <div class="member-header">
        <div class="member-avatar">{{ member?.name?.charAt(0) }}</div>
        <div class="member-info">
          <div class="member-name">
            {{ member?.name }}
            <el-tag size="small" :type="levelTagType(member?.level)" effect="light" style="margin-left: 8px;">
              {{ getLevelName(member?.level) }}
            </el-tag>
          </div>
          <div class="member-meta">
            <span>会员号：{{ member?.memberNo }}</span>
            <span>手机：{{ member?.phone }}</span>
            <span>门店：{{ member?.storeName }}</span>
          </div>
        </div>
        <div class="member-stats">
          <div class="stat-item">
            <div class="stat-num">{{ member?.availablePoints || 0 }}</div>
            <div class="stat-label">可用积分</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ member?.totalPoints || 0 }}</div>
            <div class="stat-label">累计积分</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">¥{{ member?.totalConsumption || 0 }}</div>
            <div class="stat-label">累计消费</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ member?.orderCount || 0 }}</div>
            <div class="stat-label">订单数</div>
          </div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="活跃记录" name="activity">
        <div class="table-wrapper">
          <el-table :data="activityList" stripe style="width: 100%">
            <el-table-column prop="activityNo" label="记录编号" width="180" />
            <el-table-column label="类型" width="120">
              <template #default="{ row }">{{ getActivityTypeText(row.type) }}</template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">{{ row.amount ? '¥' + row.amount : '-' }}</template>
            </el-table-column>
            <el-table-column label="积分" width="100" align="right">
              <template #default="{ row }">{{ row.points || '-' }}</template>
            </el-table-column>
            <el-table-column label="商品" width="180">
              <template #default="{ row }">{{ row.productName || '-' }}</template>
            </el-table-column>
            <el-table-column label="时间" width="180">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="优惠券" name="coupon">
        <div class="table-wrapper">
          <el-table :data="couponList" stripe style="width: 100%">
            <el-table-column prop="couponNo" label="券编号" width="160" />
            <el-table-column prop="name" label="券名称" />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">{{ getCouponTypeText(row.type) }}</template>
            </el-table-column>
            <el-table-column label="面值" width="100" align="right">
              <template #default="{ row }">{{ row.value ? '¥' + row.value : '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="couponStatusType(row.status)">
                  {{ getCouponStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="有效期" width="240">
              <template #default="{ row }">
                {{ formatDate(row.validFrom) }} 至 {{ formatDate(row.validTo) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="积分明细" name="points">
        <div class="table-wrapper">
          <el-table :data="pointsList" stripe style="width: 100%">
            <el-table-column prop="recordNo" label="记录编号" width="180" />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="pointsTypeTag(row.type)">
                  {{ getPointsTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="140" />
            <el-table-column label="积分变动" width="120" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.points > 0 ? '#67c23a' : '#f56c6c' }">
                  {{ row.points > 0 ? '+' : '' }}{{ row.points }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="变动后余额" width="120" align="right">
              <template #default="{ row }">{{ row.balanceAfter }}</template>
            </el-table-column>
            <el-table-column prop="orderNo" label="关联订单" width="160" />
            <el-table-column label="操作人" prop="operatorName" width="120" />
            <el-table-column label="时间" width="180">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="兑换记录" name="redeem">
        <div class="table-wrapper">
          <el-table :data="redeemList" stripe style="width: 100%">
            <el-table-column prop="redeemNo" label="兑换编号" width="180" />
            <el-table-column prop="benefitName" label="兑换商品" />
            <el-table-column label="消耗积分" prop="pointsCost" width="120" align="right" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="redeemStatusType(row.status)">
                  {{ getRedeemStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作人" prop="operatorName" width="120" />
            <el-table-column label="兑换时间" width="180">
              <template #default="{ row }">{{ formatDate(row.redeemTime) }}</template>
            </el-table-column>
            <el-table-column prop="failReason" label="失败原因" />
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const memberId = ref('')
const member = ref(null)
const activeTab = ref('activity')
const activityList = ref([])
const couponList = ref([])
const pointsList = ref([])
const redeemList = ref([])

const levelNames = {
  bronze: '青铜会员',
  silver: '白银会员',
  gold: '黄金会员',
  platinum: '铂金会员',
  diamond: '钻石会员',
}
const levelTagTypes = {
  bronze: 'info', silver: 'info', gold: 'warning', platinum: 'success', diamond: 'danger',
}

const activityTypes = {
  login: { text: '登录', type: 'info' },
  purchase: { text: '购买', type: 'success' },
  signin: { text: '签到', type: 'warning' },
  browse: { text: '浏览', type: 'info' },
  share: { text: '分享', type: 'primary' },
}

const couponTypes = { repurchase: '复购券', discount: '折扣券', cash: '现金券' }
const couponStatus = {
  unused: { text: '未使用', type: 'warning' },
  used: { text: '已使用', type: 'success' },
  expired: { text: '已过期', type: 'info' },
}

const pointsTypes = {
  earn: { text: '获取', type: 'success' },
  consume: { text: '消耗', type: 'danger' },
  expire: { text: '过期', type: 'info' },
}

const redeemStatus = {
  pending: { text: '待处理', type: 'warning' },
  success: { text: '成功', type: 'success' },
  failed: { text: '失败', type: 'danger' },
}

function getLevelName(l) { return levelNames[l] || l }
function levelTagType(l) { return levelTagTypes[l] || 'info' }
function getActivityTypeText(t) { return activityTypes[t]?.text || t }
function getCouponTypeText(t) { return couponTypes[t] || t }
function getCouponStatusText(s) { return couponStatus[s]?.text || s }
function couponStatusType(s) { return couponStatus[s]?.type || 'info' }
function getPointsTypeText(t) { return pointsTypes[t]?.text || t }
function pointsTypeTag(t) { return pointsTypes[t]?.type || 'info' }
function getRedeemStatusText(s) { return redeemStatus[s]?.text || s }
function redeemStatusType(s) { return redeemStatus[s]?.type || 'info' }

function formatDate(d) {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD HH:mm')
}

function goBack() {
  router.back()
}

async function loadMember() {
  try {
    const res = await request.get(`/members/${memberId.value}`)
    member.value = res
  } catch (e) { console.error(e) }
}

async function loadActivities() {
  try {
    const res = await request.get('/activities', { params: { memberId: memberId.value, pageSize: 50 } })
    activityList.value = res.list
  } catch (e) { console.error(e) }
}

async function loadCoupons() {
  try {
    const res = await request.get('/coupons', { params: { memberId: memberId.value, type: 'repurchase', pageSize: 50 } })
    couponList.value = res.list
  } catch (e) { console.error(e) }
}

async function loadPoints() {
  try {
    const res = await request.get('/points', { params: { memberId: memberId.value, pageSize: 50 } })
    pointsList.value = res.list
  } catch (e) { console.error(e) }
}

async function loadRedeems() {
  try {
    const res = await request.get('/redeems', { params: { memberId: memberId.value, pageSize: 50 } })
    redeemList.value = res.list
  } catch (e) { console.error(e) }
}

onMounted(() => {
  memberId.value = route.params.id
  loadMember()
  loadActivities()
  loadCoupons()
  loadPoints()
  loadRedeems()
})
</script>

<style lang="scss" scoped>
.member-card {
  background: #fff;
  border-radius: 12px;
}

.member-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.member-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: #fff;
  font-size: 32px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.member-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #6b7280;
}

.member-stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #ec4899;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #9ca3af;
}

.table-wrapper {
  padding-top: 16px;
}
</style>
