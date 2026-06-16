<template>
  <div class="data-table">
    <div class="table-toolbar" v-if="$slots.toolbar || showSearch || showActions">
      <div class="toolbar-left">
        <slot name="toolbar" />
        <el-input
          v-if="showSearch"
          v-model="searchKeyword"
          :placeholder="searchPlaceholder"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="toolbar-right">
        <slot name="actions" />
        <el-button v-if="showRefresh" :icon="Refresh" @click="handleRefresh">刷新</el-button>
      </div>
    </div>

    <el-table
      ref="tableRef"
      :data="tableData"
      v-loading="loading"
      :stripe="stripe"
      :border="border"
      :height="height"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="showSelection" type="selection" width="50" />
      <el-table-column v-if="showIndex" type="index" label="#" width="60" align="center" />
      <slot />
    </el-table>

    <div class="table-pagination" v-if="showPagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  stripe: {
    type: Boolean,
    default: true
  },
  border: {
    type: Boolean,
    default: false
  },
  height: {
    type: [String, Number],
    default: null
  },
  showSelection: {
    type: Boolean,
    default: false
  },
  showIndex: {
    type: Boolean,
    default: true
  },
  showSearch: {
    type: Boolean,
    default: false
  },
  searchPlaceholder: {
    type: String,
    default: '请输入关键词搜索'
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: false
  },
  showPagination: {
    type: Boolean,
    default: true
  },
  total: {
    type: Number,
    default: 0
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  defaultPageSize: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['search', 'refresh', 'selection-change', 'page-change', 'size-change'])

const tableRef = ref(null)
const tableData = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(props.defaultPageSize)
const selectedRows = ref([])

watch(() => props.data, (val) => {
  tableData.value = val || []
}, { immediate: true, deep: true })

function handleSearch() {
  currentPage.value = 1
  emit('search', searchKeyword.value)
}

function handleRefresh() {
  emit('refresh')
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
  emit('selection-change', rows)
}

function handleSizeChange(size) {
  currentPage.value = 1
  emit('size-change', size)
  emit('page-change', { page: currentPage.value, size })
}

function handleCurrentChange(page) {
  emit('page-change', { page, size: pageSize.value })
}

defineExpose({
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row, selected) => tableRef.value?.toggleRowSelection(row, selected),
  getSelectionRows: () => selectedRows.value,
  setCurrentPage: (page) => { currentPage.value = page }
})
</script>

<style lang="scss" scoped>
.data-table {
  background: #fff;
  border-radius: 4px;
  padding: 16px;

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .table-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
