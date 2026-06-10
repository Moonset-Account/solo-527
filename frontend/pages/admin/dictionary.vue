<template>
  <n-card :bordered="false">
    <template #header>
      <div class="header">
        <span>字典配置</span>
        <n-button type="primary" @click="showTypeModal = true">新增字典类型</n-button>
      </div>
    </template>

    <n-grid :cols="2" :x-gap="20">
      <n-grid-item>
        <n-card title="字典类型" size="small" :bordered="false" style="height: 100%">
          <n-list bordered>
            <n-list-item
              v-for="t in dictTypes"
              :key="t.id"
              :style="{ cursor: 'pointer', background: selectedType?.id === t.id ? '#f0f5ff' : '' }"
              @click="selectType(t)"
            >
              <n-thing :title="t.type_name" :description="t.type_code">
                <template #extra>
                  <n-tag v-if="t.is_system" type="info" size="small">系统</n-tag>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card
          title="字典项"
          size="small"
          :bordered="false"
          :extra="selectedType && !selectedType.is_system ? () => h(NButton, { size: 'small', type: 'primary', onClick: () => showItemModal = true }, () => '新增') : null"
        >
          <n-table single-column>
            <thead>
              <tr>
                <th>编码</th>
                <th>值</th>
                <th>排序</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dictItems" :key="item.id">
                <td>{{ item.item_code }}</td>
                <td>{{ item.item_value }}</td>
                <td>{{ item.sort_order }}</td>
                <td>
                  <n-tag size="small" :type="item.is_active ? 'success' : 'default'">
                    {{ item.is_active ? '启用' : '停用' }}
                  </n-tag>
                </td>
                <td>
                  <n-button size="small" quaternary @click="handleEditItem(item)">编辑</n-button>
                </td>
              </tr>
              <tr v-if="dictItems.length === 0">
                <td colspan="5" style="text-align: center; color: #999; padding: 20px">
                  暂无字典项
                </td>
              </tr>
            </tbody>
          </n-table>
        </n-card>
      </n-grid-item>
    </n-grid>
  </n-card>

  <n-modal v-model:show="showTypeModal" preset="dialog" title="新增字典类型" :style="{ width: '400px' }">
    <n-form label-placement="top">
      <n-form-item label="类型编码">
        <n-input v-model:value="typeForm.type_code" />
      </n-form-item>
      <n-form-item label="类型名称">
        <n-input v-model:value="typeForm.type_name" />
      </n-form-item>
      <n-form-item label="描述">
        <n-input v-model:value="typeForm.description" type="textarea" :rows="2" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showTypeModal = false">取消</n-button>
      <n-button type="primary" @click="createType">创建</n-button>
    </template>
  </n-modal>

  <n-modal v-model:show="showItemModal" preset="dialog" title="新增字典项" :style="{ width: '400px' }">
    <n-form label-placement="top">
      <n-form-item label="项编码">
        <n-input v-model:value="itemForm.item_code" />
      </n-form-item>
      <n-form-item label="项值">
        <n-input v-model:value="itemForm.item_value" />
      </n-form-item>
      <n-form-item label="排序">
        <n-input-number v-model:value="itemForm.sort_order" :min="0" style="width: 100%" />
      </n-form-item>
      <n-form-item label="备注">
        <n-input v-model:value="itemForm.remark" type="textarea" :rows="2" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showItemModal = false">取消</n-button>
      <n-button type="primary" @click="createItem">创建</n-button>
    </template>
  </n-modal>

  <n-modal v-model:show="showEditItemModal" preset="dialog" title="编辑字典项" :style="{ width: '400px' }">
    <n-form label-placement="top">
      <n-form-item label="项编码">
        <n-input v-model:value="editItemForm.item_code" />
      </n-form-item>
      <n-form-item label="项值">
        <n-input v-model:value="editItemForm.item_value" />
      </n-form-item>
      <n-form-item label="排序">
        <n-input-number v-model:value="editItemForm.sort_order" :min="0" style="width: 100%" />
      </n-form-item>
      <n-form-item label="是否启用">
        <n-switch v-model:value="editItemForm.is_active" />
      </n-form-item>
      <n-form-item label="备注">
        <n-input v-model:value="editItemForm.remark" type="textarea" :rows="2" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showEditItemModal = false">取消</n-button>
      <n-button type="primary" :loading="editingItem" @click="updateItem">保存</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useMessage, NButton } from 'naive-ui'
import api from '~/utils/api'
import type { DictionaryType, DictionaryItem } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()

const dictTypes = ref<DictionaryType[]>([])
const dictItems = ref<DictionaryItem[]>([])
const selectedType = ref<DictionaryType | null>(null)

const showTypeModal = ref(false)
const showItemModal = ref(false)
const showEditItemModal = ref(false)
const editingItemId = ref<number | null>(null)
const editingItem = ref(false)

const typeForm = ref({ type_code: '', type_name: '', description: '' })
const itemForm = ref({ item_code: '', item_value: '', sort_order: 0, remark: '' })
const editItemForm = ref({ item_code: '', item_value: '', sort_order: 0, remark: '', is_active: true })

async function loadTypes() {
  try {
    const res = await api.get('/dictionary/types')
    dictTypes.value = res.data
  } catch (e) {
    message.error('加载失败')
  }
}

async function selectType(type: DictionaryType) {
  selectedType.value = type
  try {
    const res = await api.get('/dictionary/items', { params: { type_id: type.id } })
    dictItems.value = res.data
  } catch (e) {
    message.error('加载失败')
  }
}

async function createType() {
  if (!typeForm.value.type_code || !typeForm.value.type_name) {
    message.warning('请填写完整')
    return
  }
  try {
    await api.post('/dictionary/types', typeForm.value)
    message.success('创建成功')
    showTypeModal.value = false
    loadTypes()
  } catch (e) {
    message.error('创建失败')
  }
}

async function createItem() {
  if (!selectedType.value || !itemForm.value.item_code || !itemForm.value.item_value) {
    message.warning('请填写完整')
    return
  }
  try {
    await api.post('/dictionary/items', {
      ...itemForm.value,
      type_id: selectedType.value.id,
    })
    message.success('创建成功')
    showItemModal.value = false
    selectType(selectedType.value)
  } catch (e) {
    message.error('创建失败')
  }
}

function handleEditItem(item: DictionaryItem) {
  editingItemId.value = item.id
  editItemForm.value = {
    item_code: item.item_code,
    item_value: item.item_value,
    sort_order: item.sort_order,
    remark: item.remark || '',
    is_active: item.is_active,
  }
  showEditItemModal.value = true
}

async function updateItem() {
  if (editingItemId.value === null || !editItemForm.value.item_code || !editItemForm.value.item_value) {
    message.warning('请填写完整')
    return
  }
  editingItem.value = true
  try {
    await api.put(`/dictionary/items/${editingItemId.value}`, editItemForm.value)
    message.success('更新成功')
    showEditItemModal.value = false
    editingItemId.value = null
    if (selectedType.value) {
      selectType(selectedType.value)
    }
  } catch (e) {
    message.error('更新失败')
  } finally {
    editingItem.value = false
  }
}

onMounted(() => {
  loadTypes()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
