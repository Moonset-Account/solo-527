<template>
  <div class="page-container">
    <div class="page-header">
      <h2>房态价格配置</h2>
      <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon> 新增房间</el-button>
    </div>
    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="房态" clearable @change="loadData" style="width:140px;">
        <el-option v-for="(v, k) in statusLabels" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="filters.roomType" placeholder="房型" clearable @change="loadData" style="width:140px;">
        <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
      </el-select>
      <el-select v-model="filters.configStatus" placeholder="配置状态" clearable @change="loadData" style="width:140px;">
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
        <el-option label="草稿" value="draft" />
      </el-select>
      <el-input v-model="filters.roomNo" placeholder="房间号" clearable @keyup.enter="loadData" style="width:140px;" />
    </div>
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="roomNo" label="房间号" width="100" />
        <el-table-column label="房型" width="120">
          <template #default="{ row }">{{ typeLabels[row.roomType] }}</template>
        </el-table-column>
        <el-table-column prop="floor" label="楼层" width="80" align="center" />
        <el-table-column prop="area" label="面积(㎡)" width="100" align="center" />
        <el-table-column label="房态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag[row.status]" size="small" effect="dark">{{ statusLabels[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="月租" width="120" align="right">
          <template #default="{ row }">¥ {{ row.monthlyRent.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="deposit" label="押金" width="100" align="right" />
        <el-table-column prop="waterRate" label="水费单价" width="100" />
        <el-table-column prop="electricityRate" label="电费单价" width="100" />
        <el-table-column label="配置状态" width="110">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(s) => handleConfigStatus(row, s)">
              <el-tag :type="configTag[row.configStatus]" size="small">{{ configLabels[row.configStatus] }}</el-tag>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="enabled">启用</el-dropdown-item>
                  <el-dropdown-item command="disabled">停用</el-dropdown-item>
                  <el-dropdown-item command="draft">草稿</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy.realName" label="录入人" width="100" />
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openView(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination :current-page="page" :page-size="limit" :total="total" layout="total, prev, pager, next" @current-change="handlePage" />
      </div>
    </el-card>
    <el-dialog v-model="showForm" :title="editId ? '编辑房间' : '新增房间'" width="540px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="房间号" required><el-input v-model="form.roomNo" /></el-form-item>
        <el-form-item label="房型" required>
          <el-select v-model="form.roomType" style="width:100%;">
            <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="楼层" required><el-input-number v-model="form.floor" style="width:100%;" /></el-form-item>
        <el-form-item label="面积(㎡)" required><el-input-number v-model="form.area" :min="0" :precision="1" style="width:100%;" /></el-form-item>
        <el-form-item label="房态">
          <el-select v-model="form.status" style="width:100%;">
            <el-option v-for="(v, k) in statusLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="月租(元)" required><el-input-number v-model="form.monthlyRent" :min="0" :precision="2" style="width:100%;" /></el-form-item>
        <el-form-item label="押金(元)"><el-input-number v-model="form.deposit" :min="0" :precision="2" style="width:100%;" /></el-form-item>
        <el-form-item label="水费单价"><el-input-number v-model="form.waterRate" :min="0" :precision="2" style="width:100%;" /></el-form-item>
        <el-form-item label="电费单价"><el-input-number v-model="form.electricityRate" :min="0" :precision="2" style="width:100%;" /></el-form-item>
        <el-form-item label="物业费"><el-input-number v-model="form.managementFee" :min="0" :precision="2" style="width:100%;" /></el-form-item>
        <el-form-item label="描述"><el-input type="textarea" v-model="form.description" :rows="2" /></el-form-item>
        <el-form-item label="配置状态">
          <el-select v-model="form.configStatus" style="width:100%;">
            <el-option v-for="(v, k) in configLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getRoomPricings, createRoomPricing, updateRoomPricing, updateRoomPricingConfigStatus } from '@/api/config';
import type { RoomPricing } from '@/types';

const loading = ref(false);
const list = ref<RoomPricing[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const filters = reactive({ status: '', roomType: '', configStatus: '', roomNo: '' });

const typeLabels: Record<string, string> = { studio: '单间', one_bed: '一房', two_bed: '两房', three_bed: '三房', deluxe: '豪华' };
const statusLabels: Record<string, string> = { occupied: '已入住', vacant: '空闲', maintenance: '维护中', reserved: '已预订' };
const statusTag: Record<string, any> = { occupied: 'danger', vacant: 'success', maintenance: 'warning', reserved: 'primary' };
const configLabels: Record<string, string> = { enabled: '启用', disabled: '停用', draft: '草稿' };
const configTag: Record<string, any> = { enabled: 'success', disabled: 'info', draft: 'warning' };

async function loadData() {
  loading.value = true;
  try {
    const res: any = await getRoomPricings({ page: page.value, limit: limit.value, ...filters });
    list.value = res.data || [];
    total.value = res.total || 0;
  } finally { loading.value = false; }
}
function handlePage(p: number) { page.value = p; loadData(); }
onMounted(loadData);

const showForm = ref(false);
const editId = ref('');
const form = reactive<any>({ roomNo: '', roomType: 'one_bed', floor: 1, area: 0, status: 'vacant', monthlyRent: 0, deposit: 0, waterRate: 0, electricityRate: 0, managementFee: 0, description: '', configStatus: 'enabled' });
function openCreate() {
  Object.assign(form, { roomNo: '', roomType: 'one_bed', floor: 1, area: 0, status: 'vacant', monthlyRent: 0, deposit: 0, waterRate: 0, electricityRate: 0, managementFee: 0, description: '', configStatus: 'enabled' });
  editId.value = '';
  showForm.value = true;
}
function openView(row: RoomPricing) {
  Object.assign(form, row);
  editId.value = row._id;
  showForm.value = true;
}
async function handleSubmit() {
  if (!form.roomNo || !form.roomType || !form.area || !form.monthlyRent) { ElMessage.warning('请填写必填项'); return; }
  try {
    if (editId.value) {
      await updateRoomPricing(editId.value, form);
      ElMessage.success('更新成功,已记录操作人');
    } else {
      await createRoomPricing(form);
      ElMessage.success('创建成功');
    }
    showForm.value = false;
    loadData();
  } catch (_) {}
}
async function handleConfigStatus(row: RoomPricing, s: string) {
  try {
    await updateRoomPricingConfigStatus(row._id, s);
    ElMessage.success(`已切换为${configLabels[s]}`);
    loadData();
  } catch (_) {}
}
</script>
