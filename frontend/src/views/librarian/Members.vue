<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">会员管理</h3>
      <el-table :data="members" stripe>
        <el-table-column prop="family_name" label="家庭名称" width="120" />
        <el-table-column prop="child_name" label="孩子姓名" width="100" />
        <el-table-column prop="child_age" label="孩子年龄" width="100" />
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column prop="role_display" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'librarian' ? 'primary' : 'success'" size="small">
              {{ row.role_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="membership_expire" label="会员到期" width="120" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const members = ref([
  { id: 1, family_name: '李馆员', child_name: '', child_age: null, phone: '13800000001', role: 'librarian', role_display: '馆员', membership_expire: '-' },
  { id: 2, family_name: '王家长', child_name: '小明', child_age: 5, phone: '13800000002', role: 'parent', role_display: '家长', membership_expire: '2024-12-31' },
  { id: 3, family_name: '张家长', child_name: '小红', child_age: 4, phone: '13800000003', role: 'parent', role_display: '家长', membership_expire: '2024-06-30' }
])
</script>
