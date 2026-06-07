<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Calendar, Settings, GraduationCap, Plus, Trash2, Save, X } from 'lucide-vue-next';
import { useSystemConfigStore } from '@/stores/systemConfig';
import type { ClosedDate, ExamPeriod } from '@/types';
import { format } from 'date-fns';
import { ElMessage } from 'element-plus';

const configStore = useSystemConfigStore();

const closedDates = ref<ClosedDate[]>([]);
const examPeriods = ref<ExamPeriod[]>([]);
const noShowThreshold = ref(3);
const remindBeforeMinutes = ref(30);

const showAddClosedDate = ref(false);
const newClosedDate = ref({ date: '', reason: '' });

const showAddExamPeriod = ref(false);
const newExamPeriod = ref({ startDate: '', endDate: '', name: '', noShowThreshold: 3 });

function loadData() {
  closedDates.value = [...configStore.closedDates];
  examPeriods.value = [...configStore.examPeriods];
  noShowThreshold.value = configStore.normalNoShowThreshold;
  remindBeforeMinutes.value = configStore.remindBeforeMinutes;
}

function addClosedDate() {
  if (!newClosedDate.value.date || !newClosedDate.value.reason) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  configStore.addClosedDate(new Date(newClosedDate.value.date), newClosedDate.value.reason);
  newClosedDate.value = { date: '', reason: '' };
  showAddClosedDate.value = false;
  loadData();
  ElMessage.success('临时闭馆日已添加，图表将自动更新');
}

function removeClosedDate(index: number) {
  configStore.removeClosedDate(index);
  loadData();
  ElMessage.success('已删除，图表将自动更新');
}

function addExamPeriod() {
  if (!newExamPeriod.value.startDate || !newExamPeriod.value.endDate || !newExamPeriod.value.name) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  configStore.addExamPeriod({
    startDate: new Date(newExamPeriod.value.startDate),
    endDate: new Date(newExamPeriod.value.endDate),
    name: newExamPeriod.value.name,
    noShowThreshold: newExamPeriod.value.noShowThreshold,
  });
  newExamPeriod.value = { startDate: '', endDate: '', name: '', noShowThreshold: 3 };
  showAddExamPeriod.value = false;
  loadData();
  ElMessage.success('考试周期已添加，相关统计将自动更新');
}

function removeExamPeriod(index: number) {
  configStore.removeExamPeriod(index);
  loadData();
  ElMessage.success('已删除，相关统计将自动更新');
}

function saveSettings() {
  configStore.setNormalNoShowThreshold(noShowThreshold.value);
  configStore.setRemindBeforeMinutes(remindBeforeMinutes.value);
  ElMessage.success('设置已保存，所有页面统计将使用新规则');
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">系统配置</h1>
        <p class="text-slate-500 mt-1">闭馆日历、考试周规则等系统设置</p>
      </div>
      <button 
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        @click="saveSettings"
      >
        <Save class="w-4 h-4" />
        保存设置
      </button>
    </div>
    
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p class="text-amber-700 text-sm">
        💡 <strong>提示：</strong>配置修改后将立即生效，所有分析页面的统计数据会自动使用新的规则重新计算。
      </p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-slate-800 flex items-center gap-2">
            <Calendar class="w-5 h-5 text-red-500" />
            临时闭馆日历
          </h3>
          <button 
            class="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
            @click="showAddClosedDate = true"
          >
            <Plus class="w-4 h-4" />
            添加
          </button>
        </div>
        
        <div v-if="showAddClosedDate" class="mb-4 p-4 bg-slate-50 rounded-xl space-y-3">
          <div class="flex items-center gap-2">
            <input 
              v-model="newClosedDate.date"
              type="date" 
              class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input 
              v-model="newClosedDate.reason"
              type="text" 
              placeholder="闭馆原因"
              class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-2 justify-end">
            <button 
              class="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              @click="showAddClosedDate = false"
            >
              取消
            </button>
            <button 
              class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              @click="addClosedDate"
            >
              确认添加
            </button>
          </div>
        </div>
        
        <div class="space-y-2">
          <div 
            v-for="(cd, index) in closedDates" 
            :key="format(cd.date, 'yyyy-MM-dd') + index"
            class="flex items-center justify-between p-3 bg-red-50 rounded-lg group"
          >
            <div>
              <span class="font-medium text-red-800">{{ format(cd.date, 'yyyy-MM-dd') }}</span>
              <span class="text-sm text-red-600 ml-3">{{ cd.reason }}</span>
            </div>
            <button 
              class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              @click="removeClosedDate(index)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <p v-if="closedDates.length === 0" class="text-center text-slate-400 py-8 text-sm">
            暂无临时闭馆日
          </p>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-slate-800 flex items-center gap-2">
            <GraduationCap class="w-5 h-5 text-orange-500" />
            考试周期管理
          </h3>
          <button 
            class="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm"
            @click="showAddExamPeriod = true"
          >
            <Plus class="w-4 h-4" />
            添加
          </button>
        </div>
        
        <div v-if="showAddExamPeriod" class="mb-4 p-4 bg-slate-50 rounded-xl space-y-3">
          <input 
            v-model="newExamPeriod.name"
            type="text" 
            placeholder="考试周名称"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div class="flex items-center gap-2">
            <input 
              v-model="newExamPeriod.startDate"
              type="date" 
              class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span class="text-slate-400">至</span>
            <input 
              v-model="newExamPeriod.endDate"
              type="date" 
              class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm text-slate-600 whitespace-nowrap">爽约阈值:</label>
            <input 
              v-model.number="newExamPeriod.noShowThreshold"
              type="number" 
              min="1"
              class="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span class="text-sm text-slate-500">次/学期</span>
          </div>
          <div class="flex gap-2 justify-end">
            <button 
              class="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              @click="showAddExamPeriod = false"
            >
              取消
            </button>
            <button 
              class="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              @click="addExamPeriod"
            >
              确认添加
            </button>
          </div>
        </div>
        
        <div class="space-y-2">
          <div 
            v-for="(ep, index) in examPeriods" 
            :key="ep.name + index"
            class="p-4 bg-orange-50 rounded-lg group"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-orange-800">{{ ep.name }}</p>
                <p class="text-sm text-orange-600 mt-1">
                  {{ format(ep.startDate, 'yyyy-MM-dd') }} 至 {{ format(ep.endDate, 'yyyy-MM-dd') }}
                </p>
                <p class="text-xs text-orange-500 mt-1">
                  爽约阈值: {{ ep.noShowThreshold }} 次/学期
                </p>
              </div>
              <button 
                class="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                @click="removeExamPeriod(index)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p v-if="examPeriods.length === 0" class="text-center text-slate-400 py-8 text-sm">
            暂无考试周期
          </p>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <h3 class="font-semibold text-slate-800 flex items-center gap-2 mb-6">
        <Settings class="w-5 h-5 text-blue-500" />
        爽约规则配置
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              平日爽约阈值（次/学期）
            </label>
            <input 
              v-model.number="noShowThreshold"
              type="number" 
              min="1"
              class="w-full max-w-xs px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-slate-500 mt-1">超过此次数将暂停预约权限</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              预约提醒时间（分钟）
            </label>
            <input 
              v-model.number="remindBeforeMinutes"
              type="number" 
              min="0"
              class="w-full max-w-xs px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-slate-500 mt-1">预约开始前多少分钟发送提醒</p>
          </div>
        </div>
        
        <div class="p-4 bg-blue-50 rounded-xl">
          <h4 class="font-medium text-blue-800 mb-2">📌 规则说明</h4>
          <ul class="text-sm text-blue-700 space-y-1.5">
            <li>• 学生爽约超过阈值将被暂停预约权限 7 天</li>
            <li>• 考试周可单独配置更严格的爽约规则</li>
            <li>• 签到迟到超过 30 分钟记为一次违规</li>
            <li>• 违规记录将影响后续预约优先级</li>
            <li>• 配置修改后所有页面立即生效</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
