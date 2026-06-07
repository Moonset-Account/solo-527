<script setup lang="ts">
import { ref } from 'vue';
import { Download, ChevronDown, FileSpreadsheet, FileJson } from 'lucide-vue-next';
import { exportToCSV, exportToJSON } from '@/utils/export';

const props = defineProps<{
  data: any[];
  filename: string;
}>();

const showMenu = ref(false);

function handleExport(format: 'csv' | 'json') {
  if (format === 'csv') {
    exportToCSV(props.data, props.filename);
  } else {
    exportToJSON(props.data, props.filename);
  }
  showMenu.value = false;
}
</script>

<template>
  <div class="relative">
    <button 
      class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      @click="showMenu = !showMenu"
    >
      <Download class="w-4 h-4" />
      导出
      <ChevronDown class="w-4 h-4" :class="{ 'rotate-180': showMenu }" />
    </button>
    
    <div 
      v-if="showMenu"
      class="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 min-w-[140px]"
    >
      <button 
        class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
        @click="handleExport('csv')"
      >
        <FileSpreadsheet class="w-4 h-4 text-green-600" />
        导出 CSV
      </button>
      <button 
        class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
        @click="handleExport('json')"
      >
        <FileJson class="w-4 h-4 text-blue-600" />
        导出 JSON
      </button>
    </div>
  </div>
</template>
