<template>
  <div class="export-page">
    <el-card>
      <template #header>
        <span>数据导出</span>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="export-section">
            <h3>基础数据导出</h3>
            <div class="export-item">
              <div>
                <div class="item-title">图书数据</div>
                <div class="item-desc">导出所有图书的详细信息，包括ISBN、书名、作者、价格、库存等</div>
              </div>
              <el-button type="primary" @click="exportBooks">导出 Excel</el-button>
            </div>
            <div class="export-item">
              <div>
                <div class="item-title">会员数据</div>
                <div class="item-desc">导出会员列表，包括会员编号、姓名、等级、积分等信息</div>
              </div>
              <el-button type="primary" @click="exportMembers">导出 Excel</el-button>
            </div>
            <div class="export-item">
              <div>
                <div class="item-title">供应商数据</div>
                <div class="item-desc">导出所有供应商的联系方式和地址信息</div>
              </div>
              <el-button type="primary" @click="exportSuppliers">导出 Excel</el-button>
            </div>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="export-section">
            <h3>业务数据导出</h3>
            <div class="export-item">
              <div>
                <div class="item-title">销售记录</div>
                <div class="item-desc">
                  <el-date-picker
                    v-model="salesDateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    size="small"
                  />
                </div>
              </div>
              <el-button type="primary" @click="exportSales">导出 Excel</el-button>
            </div>
            <div class="export-item">
              <div>
                <div class="item-title">预留记录</div>
                <div class="item-desc">
                  <el-date-picker
                    v-model="reservationDateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    size="small"
                  />
                </div>
              </div>
              <el-button type="primary" @click="exportReservations">导出 Excel</el-button>
            </div>
            <div class="export-item">
              <div>
                <div class="item-title">活动报名</div>
                <div class="item-desc">导出活动报名记录及签到情况</div>
              </div>
              <el-button type="primary" @click="exportEvents">导出 Excel</el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="mt-20">
      <template #header>
        <span>导出历史</span>
      </template>
      <el-table :data="exportHistory" stripe border>
        <el-table-column prop="file_name" label="文件名" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="export_time" label="导出时间" width="180" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="record_count" label="记录数" width="100" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="downloadFile(row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import * as XLSX from 'xlsx'
import { api } from '@/utils/request'
import { formatDate } from '@/utils/device'

const salesDateRange = ref([])
const reservationDateRange = ref([])
const exportHistory = ref([])

const exportToExcel = (data, fileName, columns) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  XLSX.writeFile(workbook, `${fileName}_${formatDate(new Date(), 'YYYYMMDDHHmmss')}.xlsx`)
}

const exportBooks = async () => {
  const loading = ElLoading.service({ text: '正在导出图书数据...' })
  try {
    const { data } = await api.get('/books/books/', { params: { page_size: 1000 } })
    const exportData = data.results.map(book => ({
      'ISBN': book.isbn,
      '书名': book.title,
      '作者': book.author,
      '译者': book.translator || '',
      '出版社': book.publisher,
      '分类': book.category?.name || '',
      '定价': book.price,
      '库存数量': book.stock_quantity,
      '可用数量': book.available_quantity,
      '预留数量': book.reserved_quantity,
      '书架位置': book.location || '',
      '状态': book.status_display,
      '是否可预留': book.allow_reservation ? '是' : '否',
      '创建时间': formatDate(book.created_at)
    }))
    exportToExcel(exportData, '图书数据')
    ElMessage.success('图书数据导出成功')
    addExportHistory('图书数据', '基础数据', exportData.length)
  } catch (e) {
    ElMessage.error('导出失败')
  } finally {
    loading.close()
  }
}

const exportMembers = async () => {
  const loading = ElLoading.service({ text: '正在导出会员数据...' })
  try {
    const { data } = await api.get('/members/members/', { params: { page_size: 1000 } })
    const exportData = data.results.map(member => ({
      '会员编号': member.member_no,
      '姓名': member.name,
      '性别': member.gender_display,
      '手机号': member.phone,
      '会员等级': member.level?.name || '',
      '可用积分': member.available_points,
      '累计积分': member.total_points,
      '状态': member.status_display,
      '注册时间': formatDate(member.register_date)
    }))
    exportToExcel(exportData, '会员数据')
    ElMessage.success('会员数据导出成功')
    addExportHistory('会员数据', '基础数据', exportData.length)
  } catch (e) {
    ElMessage.error('导出失败')
  } finally {
    loading.close()
  }
}

const exportSuppliers = async () => {
  const loading = ElLoading.service({ text: '正在导出供应商数据...' })
  try {
    const { data } = await api.get('/books/suppliers/', { params: { page_size: 1000 } })
    const exportData = data.results.map(supplier => ({
      '供应商名称': supplier.name,
      '联系人': supplier.contact_person || '',
      '联系电话': supplier.phone || '',
      '邮箱': supplier.email || '',
      '地址': supplier.address || '',
      '备注': supplier.remark || '',
      '创建时间': formatDate(supplier.created_at)
    }))
    exportToExcel(exportData, '供应商数据')
    ElMessage.success('供应商数据导出成功')
    addExportHistory('供应商数据', '基础数据', exportData.length)
  } catch (e) {
    ElMessage.error('导出失败')
  } finally {
    loading.close()
  }
}

const exportSales = async () => {
  const loading = ElLoading.service({ text: '正在导出销售数据...' })
  try {
    const params = { page_size: 1000 }
    if (salesDateRange.value?.length === 2) {
      params.start_date = formatDate(salesDateRange.value[0], 'YYYY-MM-DD')
      params.end_date = formatDate(salesDateRange.value[1], 'YYYY-MM-DD')
    }
    const { data } = await api.get('/sales/orders/', { params })
    const exportData = data.results.map(order => ({
      '订单号': order.order_no,
      '会员': order.member?.name || '散客',
      '状态': order.status_display,
      '支付方式': order.payment_method_display || '',
      '商品数量': order.total_quantity,
      '商品金额': order.subtotal,
      '折扣金额': order.discount_amount,
      '实付金额': order.paid_amount,
      '获得积分': order.points_earned,
      '使用积分': order.points_used,
      '销售时间': formatDate(order.sale_date)
    }))
    exportToExcel(exportData, '销售记录')
    ElMessage.success('销售数据导出成功')
    addExportHistory('销售记录', '业务数据', exportData.length)
  } catch (e) {
    ElMessage.error('导出失败')
  } finally {
    loading.close()
  }
}

const exportReservations = async () => {
  const loading = ElLoading.service({ text: '正在导出预留数据...' })
  try {
    const params = { page_size: 1000 }
    if (reservationDateRange.value?.length === 2) {
      params.start_date = formatDate(reservationDateRange.value[0], 'YYYY-MM-DD')
      params.end_date = formatDate(reservationDateRange.value[1], 'YYYY-MM-DD')
    }
    const { data } = await api.get('/reservations/reservations/', { params })
    const exportData = data.results.map(reservation => ({
      '预留单号': reservation.reservation_no,
      '会员': reservation.member?.name || '',
      '联系人': reservation.contact_name,
      '联系电话': reservation.contact_phone,
      '图书数量': reservation.total_quantity,
      '总金额': reservation.total_amount,
      '状态': reservation.status_display,
      '过期时间': formatDate(reservation.expire_at),
      '创建时间': formatDate(reservation.created_at)
    }))
    exportToExcel(exportData, '预留记录')
    ElMessage.success('预留数据导出成功')
    addExportHistory('预留记录', '业务数据', exportData.length)
  } catch (e) {
    ElMessage.error('导出失败')
  } finally {
    loading.close()
  }
}

const exportEvents = async () => {
  const loading = ElLoading.service({ text: '正在导出活动数据...' })
  try {
    const { data } = await api.get('/events/registrations/', { params: { page_size: 1000 } })
    const exportData = data.results.map(reg => ({
      '活动名称': reg.event?.title || '',
      '会员': reg.member?.name || '',
      '手机号': reg.member?.phone || '',
      '状态': reg.status_display,
      '报名时间': formatDate(reg.registration_time),
      '签到时间': reg.check_in_time ? formatDate(reg.check_in_time) : '未签到',
      '支付金额': reg.amount_paid,
      '使用积分': reg.points_used
    }))
    exportToExcel(exportData, '活动报名记录')
    ElMessage.success('活动数据导出成功')
    addExportHistory('活动报名', '业务数据', exportData.length)
  } catch (e) {
    ElMessage.error('导出失败')
  } finally {
    loading.close()
  }
}

const addExportHistory = (fileName, type, recordCount) => {
  exportHistory.value.unshift({
    file_name: fileName,
    type,
    export_time: formatDate(new Date()),
    operator: '当前用户',
    record_count: recordCount
  })
}

const downloadFile = (row) => {
  ElMessage.info(`正在下载: ${row.file_name}`)
}

onMounted(() => {
  exportHistory.value = [
    { file_name: '图书数据', type: '基础数据', export_time: '2024-01-15 10:30:00', operator: 'admin', record_count: 156 },
    { file_name: '销售记录', type: '业务数据', export_time: '2024-01-14 16:45:00', operator: 'manager', record_count: 234 },
  ]
})
</script>

<style lang="scss" scoped>
.export-page {
  .export-section {
    h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #333;
    }
    
    .export-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 12px;
      
      .item-title {
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .item-desc {
        font-size: 13px;
        color: #666;
      }
    }
  }
  
  .mt-20 {
    margin-top: 20px;
  }
}
</style>
