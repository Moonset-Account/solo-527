<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><EditPen /></el-icon>{{ isEdit ? '编辑选题' : '提交选题' }}
      </h2>
      <div>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </div>

    <div class="content-card" style="max-width:900px;margin:0 auto;">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px" v-loading="loading">
        <el-form-item label="选题标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit placeholder="请输入选题标题" />
        </el-form-item>

        <el-form-item label="选题标签">
          <el-select
            v-model="selectedTags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入标签后回车"
            style="width:100%;"
            @change="onTagsChange"
          >
            <el-option v-for="t in presetTags" :key="t" :label="t" :value="t" />
          </el-select>
          <div style="color:#909399;font-size:12px;margin-top:4px;">建议添加3-5个标签，便于后期分类复盘</div>
        </el-form-item>

        <el-form-item label="目标受众" prop="targetAudience">
          <el-input v-model="form.targetAudience" type="textarea" :rows="2" placeholder="如：18-35岁女性、都市白领、宝妈群体等" />
        </el-form-item>

        <el-form-item label="选题描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="简要描述选题背景、核心卖点、用户痛点等" />
        </el-form-item>

        <el-form-item label="内容方向" prop="contentDirection">
          <el-input v-model="form.contentDirection" type="textarea" :rows="4" placeholder="阐述内容创作方向、脚本形式、拍摄思路等" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="其他补充说明" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSave(1)">
            <el-icon><CircleCheck /></el-icon>保存为待办
          </el-button>
          <el-button type="success" :loading="submitting" @click="handleSave(2)">
            <el-icon><Promotion /></el-icon>提交审核
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { saveTopic, getTopicDetail } from '../../api/topic'
import { useUserStore } from '../../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const selectedTags = ref([])

const isEdit = computed(() => !!route.params.id)

const presetTags = ['夏季', '穿搭', '种草', '测评', '职场', '通勤', '运动', '休闲', '618', '大促', '爆款', '清单', '亲子', '家庭', '干货', '避坑', '教程']

const form = reactive({
  id: null,
  title: '',
  description: '',
  tags: '',
  targetAudience: '',
  contentDirection: '',
  creatorId: userStore.userInfo?.id,
  creatorName: userStore.userInfo?.nickname,
  status: 1,
  remark: ''
})

const rules = {
  title: [{ required: true, message: '请输入选题标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入选题描述', trigger: 'blur' }]
}

function onTagsChange(val) {
  form.tags = val.join(',')
}

async function handleSave(status) {
  try {
    await formRef.value.validate()
    submitting.value = true
    form.status = status
    await saveTopic(form)
    ElMessage.success(isEdit.value ? '修改成功' : '提交成功')
    router.push('/topic')
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

async function loadDetail() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const res = await getTopicDetail(route.params.id)
    Object.assign(form, res.data)
    selectedTags.value = res.data.tags ? res.data.tags.split(',').filter(Boolean) : []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)
</script>
