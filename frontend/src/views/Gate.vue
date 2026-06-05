<template>
  <div class="gate-verify">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>门岗验证放行</span>
          </template>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="通行证号验证" name="pass">
              <el-form :model="passForm" label-width="100px">
                <el-form-item label="通行证号">
                  <el-input v-model="passForm.pass_number" placeholder="请输入或扫描通行证号" size="large">
                    <template #append>
                      <el-button type="primary" :loading="verifying" @click="verifyPass">验证</el-button>
                    </template>
                  </el-input>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="身份证验证" name="id_card">
              <el-form :model="idCardForm" label-width="100px">
                <el-form-item label="身份证号">
                  <el-input v-model="idCardForm.id_card" placeholder="请输入或扫描身份证号" size="large">
                    <template #append>
                      <el-button type="primary" :loading="verifying" @click="verifyIdCard">验证</el-button>
                    </template>
                  </el-input>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="车牌验证" name="plate">
              <el-form :model="plateForm" label-width="100px">
                <el-form-item label="车牌号">
                  <el-input v-model="plateForm.plate_number" placeholder="请输入车牌号" size="large">
                    <template #append>
                      <el-button type="primary" :loading="verifying" @click="verifyPlate">验证</el-button>
                    </template>
                  </el-input>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>

          <el-divider />

          <el-form label-width="100px">
            <el-form-item label="门岗">
              <el-select v-model="gateName" style="width: 100%">
                <el-option label="东门" value="东门" />
                <el-option label="西门" value="西门" />
                <el-option label="南门" value="南门" />
                <el-option label="北门" value="北门" />
              </el-select>
            </el-form-item>
            <el-form-item label="方向">
              <el-radio-group v-model="actionType">
                <el-radio value="in">进场</el-radio>
                <el-radio value="out">出场</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>验证结果</span>
          </template>
          <div v-if="verifyResult" class="verify-result">
            <div :class="['result-status', verifyResult.result === 'allowed' ? 'allowed' : 'denied']">
              <el-icon size="60">
                <component :is="verifyResult.result === 'allowed' ? 'CircleCheck' : 'CircleClose'" />
              </el-icon>
              <span>{{ verifyResult.result === 'allowed' ? '放行' : '拦截' }}</span>
            </div>
            <p class="result-remark">{{ verifyResult.remark }}</p>

            <el-divider />

            <div v-if="verifyResult.person" class="info-section">
              <h4>人员信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="姓名">{{ verifyResult.person.name }}</el-descriptions-item>
                <el-descriptions-item label="身份证号">{{ verifyResult.person.id_card }}</el-descriptions-item>
                <el-descriptions-item label="类型">{{ verifyResult.person.person_type }}</el-descriptions-item>
                <el-descriptions-item label="单位">{{ verifyResult.person.company }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <div v-if="verifyResult.vehicle" class="info-section">
              <h4>车辆信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="车牌号">{{ verifyResult.vehicle.plate_number }}</el-descriptions-item>
                <el-descriptions-item label="类型">{{ verifyResult.vehicle.vehicle_type }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <div v-if="verifyResult.pass" class="info-section">
              <h4>通行证信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="通行证号">{{ verifyResult.pass.pass_number }}</el-descriptions-item>
                <el-descriptions-item label="类型">{{ verifyResult.pass.pass_type }}</el-descriptions-item>
                <el-descriptions-item label="有效期从">{{ verifyResult.pass.valid_from }}</el-descriptions-item>
                <el-descriptions-item label="有效期至">{{ verifyResult.pass.valid_until }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
          <div v-else class="empty-result">
            <el-empty description="请输入信息进行验证" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>今日门岗统计 - {{ gateName }}</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-num">{{ todayStats.total || 0 }}</div>
            <div class="stat-label">总记录</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box allowed">
            <div class="stat-num">{{ todayStats.allowed || 0 }}</div>
            <div class="stat-label">放行</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box denied">
            <div class="stat-num">{{ todayStats.denied || 0 }}</div>
            <div class="stat-label">拦截</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-num">
              {{ todayStats.in_count || 0 }} / {{ todayStats.out_count || 0 }}
            </div>
            <div class="stat-label">进/出场</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { gateLogsApi } from '@/api'

const activeTab = ref('pass')
const verifying = ref(false)
const verifyResult = ref(null)
const gateName = ref('东门')
const actionType = ref('in')
const todayStats = ref({})

const passForm = reactive({ pass_number: '' })
const idCardForm = reactive({ id_card: '' })
const plateForm = reactive({ plate_number: '' })

const doVerify = async (params) => {
  verifying.value = true
  try {
    verifyResult.value = await gateLogsApi.verifyAndLog({
      ...params,
      gate_name: gateName.value,
      action_type: actionType.value
    })
    fetchTodayStats()
  } catch (e) {
  } finally {
    verifying.value = false
  }
}

const verifyPass = () => doVerify({ pass_number: passForm.pass_number })
const verifyIdCard = () => doVerify({ id_card: idCardForm.id_card })
const verifyPlate = () => doVerify({ plate_number: plateForm.plate_number })

const fetchTodayStats = async () => {
  try {
    todayStats.value = await gateLogsApi.todayStats(gateName.value)
  } catch (e) {}
}

watch(gateName, () => {
  fetchTodayStats()
})

onMounted(() => {
  fetchTodayStats()
})
</script>

<style scoped>
.gate-verify {
  max-width: 1200px;
  margin: 0 auto;
}

.verify-result .result-status {
  text-align: center;
  padding: 30px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: bold;
}

.result-status.allowed {
  background: #f0f9ff;
  color: #67c23a;
}

.result-status.denied {
  background: #fef0f0;
  color: #f56c6c;
}

.result-remark {
  text-align: center;
  margin: 16px 0;
  font-size: 16px;
  color: #606266;
}

.info-section {
  margin-top: 16px;
}

.info-section h4 {
  margin-bottom: 10px;
  color: #303133;
}

.empty-result {
  padding: 60px 0;
}

.stat-box {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-box.allowed {
  background: #f0f9ff;
}

.stat-box.denied {
  background: #fef0f0;
}

.stat-num {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}
</style>
