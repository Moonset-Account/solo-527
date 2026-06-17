<template>
  <div class="forbidden-word">
    <div class="page-card">
      <div class="toolbar">
        <div class="page-title" style="margin-bottom: 0">
          <el-icon :size="20" color="#F56C6C"><Warning /></el-icon>
          禁用词管理
        </div>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          新增禁用词
        </el-button>
      </div>

      <el-form :inline="true" class="search-form">
        <el-form-item label="禁用词">
          <el-input v-model="query.word" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.category" placeholder="全部" clearable style="width: 150px">
            <el-option label="法律合规" value="LEGAL" />
            <el-option label="敏感词" value="SENSITIVE" />
            <el-option label="过度承诺" value="PROMISE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="query.riskLevel" placeholder="全部" clearable style="width: 120px">
            <el-option label="低" value="LOW" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="高" value="HIGH" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.enabled" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="word" label="禁用词" width="140">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.word }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getCategoryTagType(row.category)">
              {{ getCategoryLabel(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskLevel" label="风险等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getRiskTagType(row.riskLevel)">
              {{ getRiskLabel(row.riskLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="replacement" label="建议替换词" min-width="150" show-overflow-tooltip />
        <el-table-column prop="enabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled === 1"
              @change="(val) => toggleEnabled(row, val)" />
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="sourceOrderNo" label="来源单据号" width="140" show-overflow-tooltip />
        <el-table-column prop="operatorRemark" label="操作备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="editWord(row)">编辑</el-button>
            <el-button type="danger" link @click="deleteWord(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 16px; text-align: right"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-sizes="[10, 20, 50]"
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        @size-change="loadList"
        @current-change="loadList" />
    </div>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑禁用词' : '新增禁用词'" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="禁用词" required>
          <el-input v-model="form.word" placeholder="请输入禁用词" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="法律合规" value="LEGAL" />
            <el-option label="敏感词" value="SENSITIVE" />
            <el-option label="过度承诺" value="PROMISE" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级" required>
          <el-radio-group v-model="form.riskLevel">
            <el-radio value="LOW"><el-tag type="success">低</el-tag></el-radio>
            <el-radio value="MEDIUM"><el-tag type="warning">中</el-tag></el-radio>
            <el-radio value="HIGH"><el-tag type="danger">高</el-tag></el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="建议替换词">
          <el-input v-model="form.replacement" placeholder="请输入建议替换的词语" />
        </el-form-item>
        <el-form-item label="来源单据号">
          <el-input v-model="form.sourceOrderNo" placeholder="请输入关联来源单据号" />
        </el-form-item>
        <el-form-item label="操作备注">
          <el-input v-model="form.operatorRemark" type="textarea" :rows="2" placeholder="请输入操作备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { forbiddenWordApi } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  word: '',
  category: '',
  riskLevel: '',
  enabled: null
})
const tableData = ref([])
const total = ref(0)

const showDialog = ref(false)
const isEdit = ref(false)
const form = reactive({
  id: null,
  word: '',
  category: 'PROMISE',
  riskLevel: 'MEDIUM',
  replacement: '',
  enabled: 1,
  sourceOrderNo: '',
  operatorRemark: '',
  operatorId: null,
  operatorName: ''
})

onMounted(() => {
  loadList()
})

async function loadList() {
  const params = {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    word: query.word || undefined,
    category: query.category || undefined,
    riskLevel: query.riskLevel || undefined,
    enabled: query.enabled != null ? query.enabled : undefined
  }
  try {
    const res = await forbiddenWordApi.queryWords(params)
    if (res.success) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (e) {}
}

function resetQuery() {
  query.pageNum = 1
  query.word = ''
  query.category = ''
  query.riskLevel = ''
  query.enabled = null
  loadList()
}

function showAddDialog() {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    word: '',
    category: 'PROMISE',
    riskLevel: 'MEDIUM',
    replacement: '',
    enabled: 1,
    sourceOrderNo: '',
    operatorRemark: ''
  })
  showDialog.value = true
}

function editWord(row) {
  isEdit.value = true
  Object.assign(form, row)
  showDialog.value = true
}

async function submit() {
  if (!form.word) {
    ElMessage.warning('请输入禁用词')
    return
  }
  const user = userStore.currentUser
  form.operatorId = user.id
  form.operatorName = user.realName

  try {
    let res
    if (isEdit.value) {
      res = await forbiddenWordApi.updateWord({ ...form })
    } else {
      res = await forbiddenWordApi.addWord({ ...form })
    }
    if (res.success) {
      ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
      showDialog.value = false
      loadList()
    }
  } catch (e) {}
}

async function toggleEnabled(row, val) {
  row.enabled = val ? 1 : 0
  const user = userStore.currentUser
  row.operatorId = user.id
  row.operatorName = user.realName
  row.operatorRemark = val ? '启用' : '禁用'
  try {
    const res = await forbiddenWordApi.updateWord(row)
    if (res.success) {
      ElMessage.success(val ? '已启用' : '已禁用')
    }
  } catch (e) {
    loadList()
  }
}

async function deleteWord(row) {
  try {
    await ElMessageBox.confirm(`确定删除禁用词「${row.word}」？`, '确认删除', { type: 'warning' })
    const user = userStore.currentUser
    const res = await forbiddenWordApi.deleteWord(row.id, {
      operatorId: user.id,
      operatorName: user.realName,
      sourceOrderNo: row.sourceOrderNo,
      remark: `删除禁用词: ${row.word}`
    })
    if (res.success) {
      ElMessage.success('删除成功')
      loadList()
    }
  } catch (e) {}
}

function getCategoryLabel(cat) {
  const map = { LEGAL: '法律合规', SENSITIVE: '敏感词', PROMISE: '过度承诺', OTHER: '其他' }
  return map[cat] || cat
}
function getCategoryTagType(cat) {
  const map = { LEGAL: 'danger', SENSITIVE: 'warning', PROMISE: 'primary', OTHER: 'info' }
  return map[cat] || 'info'
}
function getRiskLabel(level) {
  const map = { LOW: '低', MEDIUM: '中', HIGH: '高' }
  return map[level] || level
}
function getRiskTagType(level) {
  const map = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' }
  return map[level] || 'info'
}
</script>

<style lang="scss" scoped>
</style>
