<template>
  <div class="admin-tools">
    <div class="admin-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3>工具管理</h3>
        <div>
          <el-button type="primary" @click="showAddDialog = true">新增工具</el-button>
        </div>
      </div>

      <el-table :data="tools" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="category" label="分类" />
        <el-table-column prop="deposit" label="押金" :formatter="formatDeposit" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="贵重工具" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isValuable" type="warning">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" />
        <el-table-column prop="totalBorrows" label="借用次数" width="100" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editTool(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteTool(row)">报废</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑工具' : '新增工具'" width="600px">
      <el-form :model="toolForm" label-width="100px">
        <el-form-item label="工具名称">
          <el-input v-model="toolForm.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="toolForm.category" placeholder="如：电动工具、户外用品" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="toolForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="押金(元)">
          <el-input-number v-model="toolForm.deposit" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="存放位置">
          <el-input v-model="toolForm.location" />
        </el-form-item>
        <el-form-item label="贵重工具">
          <el-switch v-model="toolForm.isValuable" />
          <span style="margin-left: 8px; color: #999;">开启后借用需要管理员审核</span>
        </el-form-item>
        <el-form-item label="图片">
          <el-upload v-model:file-list="toolImageList" list-type="picture-card" :limit="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTool">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { toolAPI } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const tools = ref([]);
const showAddDialog = ref(false);
const isEdit = ref(false);
const editId = ref(null);
const toolImageList = ref([]);

const toolForm = reactive({
  name: '',
  category: '',
  description: '',
  deposit: 0,
  location: '',
  isValuable: false
});

const getStatusText = (s) => {
  const m = { available: '可借', borrowed: '借出', maintenance: '维修', retired: '报废' };
  return m[s] || s;
};
const getStatusType = (s) => {
  const m = { available: 'success', borrowed: 'warning', maintenance: 'danger', retired: 'info' };
  return m[s] || '';
};
const formatDeposit = (row, col, v) => '¥' + v;

const editTool = (row) => {
  isEdit.value = true;
  editId.value = row.id;
  toolForm.name = row.name;
  toolForm.category = row.category;
  toolForm.description = row.description || '';
  toolForm.deposit = row.deposit;
  toolForm.location = row.location || '';
  toolForm.isValuable = row.isValuable;
  toolImageList.value = [];
  showAddDialog.value = true;
};

const deleteTool = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要报废「${row.name}」吗？`, '提示');
    await toolAPI.deleteTool(row.id);
    ElMessage.success('已报废');
    fetchTools();
  } catch (e) {}
};

const saveTool = async () => {
  try {
    const formData = new FormData();
    Object.keys(toolForm).forEach(k => formData.append(k, toolForm[k]));
    if (toolImageList.value.length > 0 && toolImageList.value[0].raw) {
      formData.append('image', toolImageList.value[0].raw);
    }

    if (isEdit.value) {
      await toolAPI.updateTool(editId.value, formData);
      ElMessage.success('更新成功');
    } else {
      await toolAPI.createTool(formData);
      ElMessage.success('创建成功');
    }
    showAddDialog.value = false;
    fetchTools();
  } catch (e) {}
};

const fetchTools = async () => {
  try {
    const res = await toolAPI.getTools();
    tools.value = res.tools;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchTools();
});
</script>
