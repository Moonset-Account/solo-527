<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">等级规则配置</h2>
      <el-button type="primary" :icon="Plus" @click="openAddDialog" v-if="canManage">
        新增等级
      </el-button>
    </div>

    <div class="level-list">
      <div v-for="level in levelList" :key="level._id" class="level-card" :style="{ borderColor: level.color }">
        <div class="card-header">
          <div class="level-badge" :style="{ background: level.color }">
            {{ level.icon }}
          </div>
          <div class="level-info">
            <h3 class="level-name">{{ level.levelName }}</h3>
            <el-tag size="small" :type="level.enabled ? 'success' : 'info'">
              {{ level.enabled ? '启用中' : '已停用' }}
            </el-tag>
          </div>
          <div v-if="canManage" class="card-actions">
            <el-button type="primary" link :icon="Edit" @click="openEditDialog(level)">编辑</el-button>
          </div>
        </div>

        <el-descriptions :column="3" border size="small" class="level-desc">
          <el-descriptions-item label="所需积分">{{ level.minPoints }}</el-descriptions-item>
          <el-descriptions-item label="累计消费">¥{{ level.minConsumption }}</el-descriptions-item>
          <el-descriptions-item label="订单数量">{{ level.minOrderCount }}单</el-descriptions-item>
          <el-descriptions-item label="积分倍率">{{ level.pointsMultiplier }}x</el-descriptions-item>
          <el-descriptions-item label="排序">{{ level.sort }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ level.enabled ? '启用' : '停用' }}</el-descriptions-item>
        </el-descriptions>

        <div class="level-description">
          <span class="desc-label">权益说明：</span>
          <span class="desc-text">{{ level.description }}</span>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="等级标识" prop="level">
          <el-select v-model="form.level" placeholder="请选择等级" style="width: 100%" :disabled="isEdit">
            <el-option label="青铜会员" value="bronze" />
            <el-option label="白银会员" value="silver" />
            <el-option label="黄金会员" value="gold" />
            <el-option label="铂金会员" value="platinum" />
            <el-option label="钻石会员" value="diamond" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级名称" prop="levelName">
          <el-input v-model="form.levelName" placeholder="请输入等级名称" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入emoji图标" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-input v-model="form.color" placeholder="请输入颜色值，如 #FFD700" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="所需积分" prop="minPoints">
              <el-input-number v-model="form.minPoints" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="累计消费" prop="minConsumption">
              <el-input-number v-model="form.minConsumption" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="订单数量" prop="minOrderCount">
              <el-input-number v-model="form.minOrderCount" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="积分倍率" prop="pointsMultiplier">
          <el-input-number v-model="form.pointsMultiplier" :min="1" :step="0.1" style="width: 200px" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入等级权益说明" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width: 200px" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const userStore = useUserStore()
const canManage = computed(() => userStore.canManage)

const levelList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const loading = ref(false)
const formRef = ref(null)

const dialogTitle = computed(() => isEdit.value ? '编辑等级' : '新增等级')

const form = reactive({
  level: '',
  levelName: '',
  icon: '',
  color: '',
  minPoints: 0,
  minConsumption: 0,
  minOrderCount: 0,
  pointsMultiplier: 1,
  description: '',
  sort: 0,
  enabled: true,
})

const rules = {
  level: [{ required: true, message: '请选择等级', trigger: 'change' }],
  levelName: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
}

function resetForm() {
  Object.assign(form, {
    level: '',
    levelName: '',
    icon: '',
    color: '',
    minPoints: 0,
    minConsumption: 0,
    minOrderCount: 0,
    pointsMultiplier: 1,
    description: '',
    sort: 0,
    enabled: true,
  })
}

function openAddDialog() {
  isEdit.value = false
  editId.value = ''
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(level) {
  isEdit.value = true
  editId.value = level._id
  Object.assign(form, { ...level })
  dialogVisible.value = true
}

async function handleSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    if (isEdit.value) {
      await request.put(`/levels/${editId.value}`, form)
      ElMessage.success('修改成功')
    } else {
      await request.post('/levels', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadData() {
  try {
    const res = await request.get('/levels')
    levelList.value = res
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.level-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.level-card {
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.level-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.level-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.level-desc {
  margin-bottom: 16px;
}

.level-description {
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.desc-label {
  color: #6b7280;
}

.desc-text {
  color: #374151;
}
</style>
