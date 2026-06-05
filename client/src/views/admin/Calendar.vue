<template>
  <div class="admin-calendar">
    <div class="admin-card">
      <h3 style="margin-bottom: 20px;">库存日历</h3>
      
      <el-select v-model="selectedTool" placeholder="选择工具" style="width: 250px; margin-bottom: 20px;" @change="fetchBookings">
        <el-option v-for="t in tools" :key="t.id" :label="t.name" :value="t.id" />
      </el-select>

      <div class="calendar-container">
        <div class="calendar-header">
          <el-button size="small" @click="prevMonth">‹</el-button>
          <span>{{ currentMonthText }}</span>
          <el-button size="small" @click="nextMonth">›</el-button>
        </div>
        <div class="calendar-grid">
          <div v-for="d in ['日', '一', '二', '三', '四', '五', '六']" class="calendar-weekday">{{ d }}</div>
          <div 
            v-for="(day, idx) in calendarDays" 
            :key="idx" 
            class="calendar-day"
            :class="{ 
              'other-month': day.otherMonth,
              'today': day.isToday,
              'has-booking': day.bookings.length > 0
            }"
          >
            <span class="day-number">{{ day.date }}</span>
            <div v-if="day.bookings.length > 0" class="day-bookings">
              <div v-for="b in day.bookings.slice(0, 2)" :key="b.id" class="day-booking">
                {{ b.user?.realName || b.user?.username }}
              </div>
              <div v-if="day.bookings.length > 2" class="more-booking">
                +{{ day.bookings.length - 2 }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <h3 style="margin-bottom: 16px;">预约列表</h3>
      <el-table :data="bookings" border size="small">
        <el-table-column prop="tool.name" label="工具" />
        <el-table-column prop="user.realName" label="借用人" />
        <el-table-column label="借用时间">
          <template #default="{ row }">
            {{ formatDate(row.borrowDate) }} - {{ formatDate(row.expectedReturnDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { toolAPI } from '@/api';
import dayjs from 'dayjs';

const tools = ref([]);
const selectedTool = ref(null);
const bookings = ref([]);
const currentDate = ref(dayjs());

const currentMonthText = computed(() => currentDate.value.format('YYYY年 MM月'));

const calendarDays = computed(() => {
  const year = currentDate.value.year();
  const month = currentDate.value.month();
  const firstDay = dayjs(new Date(year, month, 1));
  const startDay = firstDay.startOf('week');
  const days = [];
  
  for (let i = 0; i < 42; i++) {
    const d = startDay.add(i, 'day');
    const dayBookings = bookings.value.filter(b => {
      const borrowStart = dayjs(b.borrowDate).startOf('day');
      const borrowEnd = dayjs(b.expectedReturnDate).endOf('day');
      return d.isBetween(borrowStart, borrowEnd, 'day', '[]');
    });
    
    days.push({
      date: d.date(),
      otherMonth: d.month() !== month,
      isToday: d.isSame(dayjs(), 'day'),
      bookings: dayBookings,
      fullDate: d
    });
  }
  return days;
});

const prevMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month');
};
const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month');
};

const formatDate = (d) => dayjs(d).format('MM-DD');
const getStatusText = (s) => {
  const m = { pending: '待审核', approved: '已预约', borrowed: '借用中' };
  return m[s] || s;
};
const getStatusType = (s) => {
  const m = { pending: 'warning', approved: 'primary', borrowed: 'success' };
  return m[s] || '';
};

const fetchTools = async () => {
  try {
    const res = await toolAPI.getTools();
    tools.value = res.tools;
    if (tools.value.length > 0) {
      selectedTool.value = tools.value[0].id;
      fetchBookings();
    }
  } catch (e) {}
};

const fetchBookings = async () => {
  if (!selectedTool.value) return;
  try {
    const start = currentDate.value.startOf('month').format('YYYY-MM-DD');
    const end = currentDate.value.endOf('month').format('YYYY-MM-DD');
    const res = await toolAPI.getCalendar({
      toolId: selectedTool.value,
      startDate: start,
      endDate: end
    });
    bookings.value = res.bookings;
  } catch (e) {}
};

onMounted(() => {
  fetchTools();
});
</script>

<style scoped>
.calendar-container {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
.calendar-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.calendar-weekday {
  padding: 8px;
  text-align: center;
  background: #f5f7fa;
  font-weight: 500;
  border-bottom: 1px solid #e4e7ed;
}
.calendar-day {
  min-height: 80px;
  padding: 6px;
  border-bottom: 1px solid #e4e7ed;
  border-right: 1px solid #e4e7ed;
}
.calendar-day:nth-child(7n) {
  border-right: none;
}
.day-number {
  font-size: 14px;
}
.other-month {
  color: #c0c4cc;
}
.today {
  background: #ecf5ff;
}
.today .day-number {
  color: #409eff;
  font-weight: bold;
}
.has-booking {
  background: #fef0f0;
}
.day-bookings {
  margin-top: 4px;
}
.day-booking {
  font-size: 10px;
  background: #f56c6c;
  color: #fff;
  padding: 1px 4px;
  border-radius: 2px;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.more-booking {
  font-size: 10px;
  color: #909399;
}
</style>
