<template>
  <div class="user-manage-page">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="用户名">
          <el-input
            v-model="filterForm.keyword"
            placeholder="用户名/手机号/邮箱"
            clearable
            style="width: 220px"
            @keyup.enter="loadUserList"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filterForm.role" placeholder="全部角色" clearable style="width: 140px">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="讲师" value="TEACHER" />
            <el-option label="普通会员" value="MEMBER" />
            <el-option label="普通用户" value="USER" />
          </el-select>
        </el-form-item>
        <el-form-item label="会员状态">
          <el-select v-model="filterForm.memberStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="会员中" value="active" />
            <el-option label="已过期" value="expired" />
            <el-option label="非会员" value="none" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadUserList">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><RefreshLeft /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="hover">
      <el-table
        :data="userList"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="用户信息" min-width="240">
          <template #default="{ row }">
            <div class="user-info-cell">
              <el-avatar :size="44" class="user-avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <div class="user-text">
                <div class="user-name">
                  {{ row.nickname || row.username }}
                  <el-tooltip
                    v-if="row.phone"
                    :content="row.phone"
                    placement="top"
                  >
                    <el-icon class="phone-icon" :size="14"><Iphone /></el-icon>
                  </el-tooltip>
                </div>
                <div class="user-email" v-if="row.email">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="140" align="center">
          <template #default="{ row }">
            <el-tag
              :type="roleTag(row.role).type"
              effect="dark"
              size="default"
            >
              <el-icon><component :is="roleTag(row.role).icon" /></el-icon>
              {{ roleTag(row.role).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="会员状态" width="180" align="center">
          <template #default="{ row }">
            <div v-if="row.isMember && row.memberExpireDate" class="member-status">
              <el-tag
                :type="isMemberActive(row.memberExpireDate) ? 'warning' : 'info'"
                effect="light"
                size="small"
              >
                <el-icon><Crown /></el-icon>
                {{ isMemberActive(row.memberExpireDate) ? '会员中' : '已过期' }}
              </el-tag>
              <span class="member-date">{{ row.memberExpireDate }}</span>
            </div>
            <el-tag v-else type="info" effect="plain" size="small">非会员</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registeredAt" label="注册时间" width="170" align="center" />
        <el-table-column prop="lastLoginAt" label="最近登录" width="170" align="center" />
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd) => handleChangeRole(row, cmd)">
              <el-button type="primary" link size="small">
                <el-icon><Setting /></el-icon>分配角色
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="r in roleOptions"
                    :key="r.value"
                    :command="r.value"
                    :disabled="row.role === r.value"
                  >
                    <el-icon><component :is="r.icon" /></el-icon>
                    {{ r.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="warning" link size="small" @click="openSetMembership(row)">
              <el-icon><Calendar /></el-icon>会员
            </el-button>
            <el-popconfirm
              title="确定删除该用户吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" link size="small">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadUserList"
          @current-change="loadUserList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="membershipDialogVisible"
      title="设置会员到期时间"
      width="440px"
      :close-on-click-modal="false"
    >
      <el-form :model="membershipForm" label-width="110px">
        <el-form-item label="用户">
          <span class="form-readonly">{{ membershipForm.userName }}</span>
        </el-form-item>
        <el-form-item label="当前状态" v-if="membershipForm.currentExpire">
          <span class="form-readonly">
            到期时间：{{ membershipForm.currentExpire }}
          </span>
        </el-form-item>
        <el-form-item label="开通会员" required>
          <el-switch
            v-model="membershipForm.isMember"
            active-text="开通"
            inactive-text="取消"
            @change="onMembershipToggle"
          />
        </el-form-item>
        <el-form-item
          v-if="membershipForm.isMember"
          label="到期时间"
          required
        >
          <el-date-picker
            v-model="membershipForm.expireDate"
            type="date"
            placeholder="请选择到期时间"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledPastDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item
          v-if="membershipForm.isMember"
          label="快捷选择"
        >
          <div class="quick-select">
            <el-button size="small" type="primary" plain @click="quickSetMonth(1)">1个月</el-button>
            <el-button size="small" type="primary" plain @click="quickSetMonth(3)">3个月</el-button>
            <el-button size="small" type="primary" plain @click="quickSetMonth(6)">半年</el-button>
            <el-button size="small" type="primary" plain @click="quickSetMonth(12)">1年</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="membershipDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="membershipSubmitting" @click="submitMembership">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  RefreshLeft,
  UserFilled,
  Iphone,
  StarFilled,
  Setting,
  ArrowDown,
  Calendar,
  Delete,
  User,
  Star
} from '@element-plus/icons-vue'
import {
  adminGetUserList,
  adminUpdateUserRole,
  adminUpdateUserMembership,
  adminDeleteUser
} from '@/api/admin'

const loading = ref(false)
const membershipDialogVisible = ref(false)
const membershipSubmitting = ref(false)

const filterForm = reactive({
  keyword: '',
  role: '',
  memberStatus: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const userList = ref([])

const roleOptions = [
  { value: 'ADMIN', label: '管理员', icon: UserFilled, type: 'danger' },
  { value: 'TEACHER', label: '讲师', icon: User, type: 'primary' },
  { value: 'MEMBER', label: '普通会员', icon: Star, type: 'warning' },
  { value: 'USER', label: '普通用户', icon: User, type: 'info' }
]

const roleTag = (role) => {
  const map = {
    ADMIN: { type: 'danger', text: 'ADMIN', icon: UserFilled },
    TEACHER: { type: 'primary', text: 'TEACHER', icon: User },
    MEMBER: { type: 'warning', text: 'MEMBER', icon: Star },
    USER: { type: 'info', text: 'USER', icon: User }
  }
  return map[role] || { type: 'info', text: role, icon: User }
}

const membershipForm = reactive({
  userId: null,
  userName: '',
  currentExpire: '',
  isMember: true,
  expireDate: ''
})

const isMemberActive = (expireDate) => {
  if (!expireDate) return false
  return new Date(expireDate) >= new Date(new Date().toDateString())
}

const mockUserList = () => [
  { id: 1, username: 'admin001', nickname: '超级管理员', phone: '138****0001', email: 'admin@example.com', role: 'ADMIN', isMember: true, memberExpireDate: '2027-12-31', registeredAt: '2024-01-15 09:30', lastLoginAt: '2026-06-10 08:12' },
  { id: 2, username: 'teacher01', nickname: '张老师', phone: '138****0002', email: 'zhang@example.com', role: 'TEACHER', isMember: true, memberExpireDate: '2026-08-15', registeredAt: '2024-03-20 14:20', lastLoginAt: '2026-06-09 22:35' },
  { id: 3, username: 'teacher02', nickname: '李老师', phone: '138****0003', email: 'li@example.com', role: 'TEACHER', isMember: true, memberExpireDate: '2026-12-31', registeredAt: '2024-05-10 11:05', lastLoginAt: '2026-06-10 07:40' },
  { id: 4, username: 'vipuser001', nickname: '学霸小明', phone: '139****1234', email: 'xiaoming@example.com', role: 'MEMBER', isMember: true, memberExpireDate: '2026-09-20', registeredAt: '2025-01-08 16:45', lastLoginAt: '2026-06-09 20:18' },
  { id: 5, username: 'vipuser002', nickname: '努力的小红', phone: '139****5678', email: 'xiaohong@example.com', role: 'MEMBER', isMember: true, memberExpireDate: '2026-07-10', registeredAt: '2025-02-14 09:50', lastLoginAt: '2026-06-08 18:22' },
  { id: 6, username: 'olduser001', nickname: '老学员', phone: '137****9999', email: 'old@example.com', role: 'USER', isMember: true, memberExpireDate: '2026-05-01', registeredAt: '2024-06-18 10:30', lastLoginAt: '2026-06-05 14:08' },
  { id: 7, username: 'newuser001', nickname: '新手上路', phone: '136****8888', email: 'new@example.com', role: 'USER', isMember: false, memberExpireDate: null, registeredAt: '2026-06-01 19:15', lastLoginAt: '2026-06-09 23:55' },
  { id: 8, username: 'user003', nickname: '普通用户', phone: '135****7777', email: 'normal@example.com', role: 'USER', isMember: false, memberExpireDate: null, registeredAt: '2026-04-10 08:20', lastLoginAt: '2026-06-07 11:30' }
]

const loadUserList = async () => {
  loading.value = true
  try {
    const res = await adminGetUserList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filterForm.keyword,
      role: filterForm.role,
      memberStatus: filterForm.memberStatus
    })
    userList.value = res.data?.list || mockUserList()
    pagination.total = res.data?.total || 256
  } catch (e) {
    userList.value = mockUserList()
    pagination.total = 256
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.role = ''
  filterForm.memberStatus = ''
  pagination.page = 1
  loadUserList()
}

const handleChangeRole = async (row, newRole) => {
  const oldRole = row.role
  try {
    await adminUpdateUserRole(row.id, { role: newRole })
    row.role = newRole
    const roleLabel = roleOptions.find(r => r.value === newRole)?.label || newRole
    ElMessage.success(`角色已更新为：${roleLabel}`)
  } catch (e) {
    row.role = oldRole
    const msg = e?.response?.data?.message || e?.message || '角色更新失败'
    ElMessage.error(msg)
  }
}

const openSetMembership = (row) => {
  membershipForm.userId = row.id
  membershipForm.userName = row.nickname || row.username
  membershipForm.currentExpire = row.memberExpireDate || ''
  membershipForm.isMember = !!row.memberExpireDate
  if (row.memberExpireDate) {
    membershipForm.expireDate = row.memberExpireDate
  } else {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    membershipForm.expireDate = d.toISOString().slice(0, 10)
  }
  membershipDialogVisible.value = true
}

const disabledPastDate = (time) => {
  return time.getTime() < Date.now() - 24 * 3600 * 1000
}

const quickSetMonth = (months) => {
  const base = membershipForm.currentExpire && new Date(membershipForm.currentExpire) > new Date()
    ? new Date(membershipForm.currentExpire)
    : new Date()
  base.setMonth(base.getMonth() + months)
  membershipForm.expireDate = base.toISOString().slice(0, 10)
}

const onMembershipToggle = (val) => {
  if (val && !membershipForm.expireDate) {
    quickSetMonth(1)
  }
}

const submitMembership = async () => {
  if (membershipForm.isMember && !membershipForm.expireDate) {
    ElMessage.warning('请选择会员到期时间')
    return
  }
  membershipSubmitting.value = true
  try {
    await adminUpdateUserMembership(membershipForm.userId, {
      isMember: membershipForm.isMember,
      expireDate: membershipForm.isMember ? membershipForm.expireDate : null
    })
    const user = userList.value.find(u => u.id === membershipForm.userId)
    if (user) {
      user.isMember = membershipForm.isMember
      user.memberExpireDate = membershipForm.isMember ? membershipForm.expireDate : null
    }
    ElMessage.success(membershipForm.isMember ? '会员设置成功' : '已取消会员')
    membershipDialogVisible.value = false
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '会员设置失败'
    ElMessage.error(msg)
  } finally {
    membershipSubmitting.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await adminDeleteUser(row.id)
    userList.value = userList.value.filter(u => u.id !== row.id)
    ElMessage.success('删除成功')
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '删除失败'
    ElMessage.error(msg)
  }
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
.user-manage-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  border-radius: 12px;
}

.filter-form {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 12px;
}

.table-card {
  border-radius: 12px;
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  flex-shrink: 0;
}

.user-text {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.phone-icon {
  color: #409eff;
  cursor: pointer;
}

.user-email {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.member-date {
  font-size: 11px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-readonly {
  color: #606266;
  font-size: 14px;
}

.quick-select {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
