<template>
  <n-card :bordered="false">
    <template #header>
      <div class="header">
        <span>测评题库</span>
        <div class="actions">
          <n-select
            v-model:value="filterType"
            placeholder="题型"
            :options="typeOptions"
            style="width: 120px"
            clearable
            @update:value="loadQuestions"
          />
          <n-select
            v-model:value="filterDifficulty"
            placeholder="难度"
            :options="difficultyOptions"
            style="width: 120px"
            clearable
            @update:value="loadQuestions"
          />
          <n-button type="primary" @click="showCreate = true">新建题目</n-button>
        </div>
      </div>
    </template>

    <n-data-table
      :columns="columns"
      :data="questions"
      :loading="loading"
      :row-key="(row: any) => row.id"
    />

    <n-pagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :item-count="total"
      show-size-picker
      style="margin-top: 16px; justify-content: flex-end"
      @update:page="loadQuestions"
      @update:page-size="loadQuestions"
    />
  </n-card>

  <n-modal v-model:show="showCreate" preset="dialog" title="新建题目" :style="{ width: '600px' }">
    <n-form :model="form" label-placement="top">
      <n-form-item label="题目内容">
        <n-input v-model:value="form.question_text" type="textarea" :rows="3" />
      </n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="题型">
            <n-select v-model:value="form.question_type" :options="typeOptions" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="难度">
            <n-select v-model:value="form.difficulty" :options="difficultyOptions" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-form-item label="分类">
        <n-input v-model:value="form.category" />
      </n-form-item>
      <n-form-item label="正确答案">
        <n-input v-model:value="form.correct_answer" />
      </n-form-item>
      <n-form-item label="分值">
        <n-input-number v-model:value="form.points" :min="1" style="width: 100%" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showCreate = false">取消</n-button>
      <n-button type="primary" :loading="creating" @click="createQuestion">创建</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useMessage } from 'naive-ui'
import api from '~/utils/api'
import { questionTypeLabels, difficultyLabels } from '~/utils/dict'
import type { Question } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()

const questions = ref<Question[]>([])
const loading = ref(false)
const filterType = ref<string | null>(null)
const filterDifficulty = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const showCreate = ref(false)
const creating = ref(false)

const form = ref({
  question_text: '',
  question_type: 'single_choice',
  difficulty: 'medium',
  category: '',
  correct_answer: '',
  points: 10,
  is_active: true,
})

const typeOptions = Object.entries(questionTypeLabels).map(([value, label]) => ({ label, value }))
const difficultyOptions = Object.entries(difficultyLabels).map(([value, label]) => ({ label, value }))

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '题目', key: 'question_text', ellipsis: true },
  {
    title: '题型',
    key: 'question_type',
    width: 100,
    render(row: any) {
      return questionTypeLabels[row.question_type] || '-'
    },
  },
  {
    title: '难度',
    key: 'difficulty',
    width: 80,
    render(row: any) {
      return difficultyLabels[row.difficulty] || '-'
    },
  },
  { title: '分类', key: 'category', width: 100 },
  { title: '分值', key: 'points', width: 80 },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render(row: any) {
      return h(
        'n-space',
        { size: 'small' },
        () => [
          h('n-button', { size: 'small', quaternary: true }, () => '编辑'),
          h('n-button', { size: 'small', type: 'error', quaternary: true }, () => '删除'),
        ]
      )
    },
  },
]

async function loadQuestions() {
  loading.value = true
  try {
    const res = await api.get('/assessments/questions', {
      params: {
        question_type: filterType.value || undefined,
        difficulty: filterDifficulty.value || undefined,
        skip: (page.value - 1) * pageSize.value,
        limit: pageSize.value,
      },
    })
    questions.value = res.data
  } catch (e) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function createQuestion() {
  if (!form.value.question_text) {
    message.warning('请输入题目内容')
    return
  }
  creating.value = true
  try {
    await api.post('/assessments/questions', form.value)
    message.success('创建成功')
    showCreate.value = false
    loadQuestions()
  } catch (e) {
    message.error('创建失败')
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadQuestions()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.actions {
  display: flex;
  gap: 8px;
}
</style>
