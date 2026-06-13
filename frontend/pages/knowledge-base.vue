<template>
  <div class="kb-page">
    <n-layout has-sider style="min-height: calc(100vh - 64px)">
      <n-layout-sider width="260" bordered style="background: #fff">
        <div class="sider-header">
          <n-text strong>分类</n-text>
          <n-button
            v-if="canCreateCategory"
            size="small"
            type="primary"
            quaternary
            @click="showCategoryModal = true"
          >
            <template #icon>
              <n-icon>➕</n-icon>
            </template>
            新建
          </n-button>
        </div>
        <n-scrollbar style="height: calc(100vh - 64px - 52px)">
          <n-tree
            :data="categoryTree"
            :selected-keys="selectedCategoryKeys"
            :expand-on-click="true"
            block-line
            @update:selected-keys="handleCategorySelect"
          />
        </n-scrollbar>
      </n-layout-sider>

      <n-layout style="background: #f2f3f5; padding: 20px">
        <n-card class="toolbar-card">
          <n-space justify="space-between" align="center">
            <n-space :size="12">
              <n-input
                v-model:value="searchKeyword"
                placeholder="搜索文章标题或内容"
                clearable
                style="width: 360px"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <n-icon>🔍</n-icon>
                </template>
              </n-input>
              <n-select
                v-if="!auth.isCustomer"
                v-model:value="filterPublished"
                placeholder="发布状态"
                :options="publishedOptions"
                clearable
                style="width: 140px"
              />
              <n-button type="primary" @click="handleSearch">
                <template #icon>
                  <n-icon>🔍</n-icon>
                </template>
                查询
              </n-button>
              <n-button @click="handleReset">重置</n-button>
            </n-space>
            <n-button
              v-if="auth.canManageKB"
              type="primary"
              @click="showArticleModal = true"
            >
              <template #icon>
                <n-icon>📝</n-icon>
              </template>
              新建文章
            </n-button>
          </n-space>
        </n-card>

        <div v-if="loadingArticles" class="loading-wrap">
          <n-spin size="large" />
        </div>

        <n-empty v-else-if="articleList.length === 0" description="暂无文章" />

        <div v-else class="article-list">
          <n-grid :cols="1" :x-gap="12" :y-gap="12">
            <n-grid-item v-for="article in articleList" :key="article.id">
              <n-card class="article-card" hoverable @click="goToDetail(article.id)">
                <n-space vertical :size="12">
                  <n-space justify="space-between" align="start">
                    <n-text strong class="article-title">{{ article.title }}</n-text>
                    <n-space :size="8">
                      <n-tag
                        v-if="!article.is_published"
                        type="warning"
                        size="small"
                      >草稿</n-tag>
                      <n-tag v-if="article.category" size="small" type="info">
                        {{ article.category.name }}
                      </n-tag>
                    </n-space>
                  </n-space>

                  <n-text depth="3" class="article-summary">
                    {{ getSummary(article.content) }}
                  </n-text>

                  <n-space v-if="article.keywords && article.keywords.length > 0" :size="6">
                    <n-tag
                      v-for="(kw, idx) in article.keywords.slice(0, 5)"
                      :key="idx"
                      size="small"
                      round
                      style="background: #eef9ff; color: #1d6fe0; border: none"
                    >#{{ kw }}</n-tag>
                  </n-space>

                  <n-space justify="space-between" align="center" class="article-meta">
                    <n-space :size="16">
                      <n-space :size="4">
                        <n-icon size="14">👤</n-icon>
                        <n-text depth="2" style="font-size: 13px">
                          {{ article.author?.full_name || article.author?.username || '-' }}
                        </n-text>
                      </n-space>
                      <n-space :size="4">
                        <n-icon size="14">📌</n-icon>
                        <n-text depth="2" style="font-size: 13px">v{{ article.version }}</n-text>
                      </n-space>
                      <n-space :size="4">
                        <n-icon size="14">👁️</n-icon>
                        <n-text depth="2" style="font-size: 13px">{{ article.view_count }}</n-text>
                      </n-space>
                    </n-space>
                    <n-space :size="12" align="center">
                      <n-space :size="4">
                        <n-icon size="14" color="#18a058">👍</n-icon>
                        <n-text depth="2" style="font-size: 13px">
                          {{ helpfulMap[article.id] ?? article.helpful_count }}
                        </n-text>
                      </n-space>
                      <n-button
                        size="small"
                        type="success"
                        quaternary
                        :disabled="helpfulClickedMap[article.id]"
                        @click.stop="handleHelpful(article.id)"
                      >
                        有帮助
                      </n-button>
                    </n-space>
                  </n-space>
                </n-space>
              </n-card>
            </n-grid-item>
          </n-grid>

          <div v-if="pagination.itemCount > pagination.pageSize" class="pagination-wrap">
            <n-pagination
              v-model:page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :item-count="pagination.itemCount"
              :page-sizes="pagination.pageSizes"
              show-size-picker
              :prefix="({ itemCount }) => `共 ${itemCount} 篇`"
              @update:page="handlePageChange"
              @update:page-size="handlePageSizeChange"
            />
          </div>
        </div>
      </n-layout>
    </n-layout>

    <n-modal
      v-model:show="showCategoryModal"
      :mask-closable="false"
      preset="card"
      title="新建分类"
      style="width: 480px"
    >
      <n-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-placement="top"
      >
        <n-form-item label="分类名称" path="name">
          <n-input v-model:value="categoryForm.name" placeholder="请输入分类名称" maxlength="50" show-count />
        </n-form-item>
        <n-form-item label="上级分类" path="parent_id">
          <n-select
            v-model:value="categoryForm.parent_id"
            :options="categorySelectOptions"
            placeholder="可选，不选则为顶级分类"
            clearable
          />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="categoryForm.description"
            type="textarea"
            placeholder="请输入分类描述（可选）"
            :autosize="{ minRows: 2, maxRows: 4 }"
            maxlength="200"
            show-count
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCategoryModal = false">取消</n-button>
          <n-button type="primary" :loading="creatingCategory" @click="handleCreateCategory">创建</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showArticleModal"
      :mask-closable="false"
      preset="card"
      title="新建文章"
      style="width: 720px"
    >
      <n-form
        ref="articleFormRef"
        :model="articleForm"
        :rules="articleRules"
        label-placement="top"
      >
        <n-form-item label="标题" path="title">
          <n-input v-model:value="articleForm.title" placeholder="请输入文章标题" maxlength="200" show-count />
        </n-form-item>
        <n-space :size="16" style="width: 100%">
          <n-form-item label="分类" path="category_id" style="flex: 1">
            <n-select
              v-model:value="articleForm.category_id"
              :options="categorySelectOptions"
              placeholder="请选择分类"
              clearable
            />
          </n-form-item>
          <n-form-item label="是否发布" path="is_published" style="flex: 1">
            <n-switch v-model:value="articleForm.is_published" />
          </n-form-item>
        </n-space>
        <n-form-item label="关键词标签" path="keywords">
          <n-input
            v-model:value="keywordsInput"
            placeholder="输入关键词后按回车添加，多个关键词以逗号分隔"
            @keydown.enter.prevent="handleAddKeyword"
          />
          <div v-if="articleForm.keywords.length > 0" class="keyword-tags">
            <n-space :size="6" wrap>
              <n-tag
                v-for="(kw, idx) in articleForm.keywords"
                :key="idx"
                closable
                round
                type="info"
                @close="removeKeyword(idx)"
              >#{{ kw }}</n-tag>
            </n-space>
          </div>
        </n-form-item>
        <n-form-item label="内容" path="content">
          <n-input
            v-model:value="articleForm.content"
            type="textarea"
            placeholder="请输入文章正文内容"
            :autosize="{ minRows: 8, maxRows: 16 }"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showArticleModal = false">取消</n-button>
          <n-button type="primary" :loading="creatingArticle" @click="handleCreateArticle">提交</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInst, TreeOption, SelectMixedOption } from 'naive-ui'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const { get, post } = useApi()
const message = useMessage()
const auth = useAuthStore()

interface Category {
  id: number
  name: string
  description: string | null
  parent_id: number | null
  created_at: string
}

interface ArticleAuthor {
  id: number
  username: string
  full_name: string | null
}

interface ArticleCategory {
  id: number
  name: string
}

interface Article {
  id: number
  title: string
  content: string
  category_id: number | null
  keywords: string[]
  version: number
  author_id: number
  is_published: boolean
  view_count: number
  helpful_count: number
  created_at: string
  updated_at: string
  author?: ArticleAuthor
  category?: ArticleCategory
}

interface ArticleListResponse {
  items: Article[]
  total: number
  page: number
  page_size: number
}

const canCreateCategory = computed(() => auth.isAdmin || auth.isSupervisor)

const loadingArticles = ref(false)
const loadingCategories = ref(false)
const creatingCategory = ref(false)
const creatingArticle = ref(false)

const showCategoryModal = ref(false)
const showArticleModal = ref(false)

const categoryFormRef = ref<FormInst | null>(null)
const articleFormRef = ref<FormInst | null>(null)

const categories = ref<Category[]>([])
const articleList = ref<Article[]>([])

const searchKeyword = ref('')
const selectedCategoryKeys = ref<(string | number)[]>([])
const filterPublished = ref<boolean | null>(null)
const helpfulMap = reactive<Record<number, number>>({})
const helpfulClickedMap = reactive<Record<number, boolean>>({})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageSizes: [10, 20, 50]
})

const categoryForm = reactive({
  name: '',
  parent_id: null as number | null,
  description: ''
})

const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '分类名称长度在 1 到 50 个字符之间', trigger: 'blur' }
  ]
}

const keywordsInput = ref('')
const articleForm = reactive({
  title: '',
  content: '',
  category_id: null as number | null,
  keywords: [] as string[],
  is_published: true
})

const articleRules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题长度在 2 到 200 个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' },
    { min: 10, message: '内容至少 10 个字符', trigger: 'blur' }
  ]
}

const publishedOptions: SelectMixedOption[] = [
  { label: '已发布', value: true },
  { label: '草稿', value: false }
]

const categorySelectOptions = computed<SelectMixedOption[]>(() => {
  return categories.value.map(c => ({
    label: c.name,
    value: c.id
  }))
})

const categoryTree = computed<TreeOption[]>(() => {
  const map: Record<number, TreeOption> = {}
  const roots: TreeOption[] = []

  categories.value.forEach(c => {
    map[c.id] = {
      key: c.id,
      label: c.name,
      children: []
    }
  })

  categories.value.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children!.push(map[c.id])
    } else {
      roots.push(map[c.id])
    }
  })

  roots.unshift({
    key: 'all',
    label: '全部文章',
    prefix: () => h('span', '📚')
  })

  return roots
})

const buildArticleQuery = () => {
  const params = new URLSearchParams()
  params.append('page', String(pagination.page))
  params.append('page_size', String(pagination.pageSize))

  const selectedId = selectedCategoryKeys.value[0]
  if (selectedId && selectedId !== 'all' && typeof selectedId === 'number') {
    params.append('category_id', String(selectedId))
  }
  if (searchKeyword.value.trim()) {
    params.append('keyword', searchKeyword.value.trim())
  }
  if (filterPublished.value !== null) {
    params.append('is_published', String(filterPublished.value))
  }
  return params.toString()
}

const fetchCategories = async () => {
  try {
    loadingCategories.value = true
    categories.value = await get<Category[]>('/knowledge-base/categories')
  } catch (e: any) {
    message.error(e.message || '获取分类失败')
  } finally {
    loadingCategories.value = false
  }
}

const fetchArticles = async () => {
  try {
    loadingArticles.value = true
    const query = buildArticleQuery()
    const res = await get<ArticleListResponse>(`/knowledge-base/articles?${query}`)
    articleList.value = res.items
    pagination.itemCount = res.total
  } catch (e: any) {
    message.error(e.message || '获取文章列表失败')
  } finally {
    loadingArticles.value = false
  }
}

const handleCategorySelect = (keys: (string | number)[]) => {
  selectedCategoryKeys.value = keys
  pagination.page = 1
  fetchArticles()
}

const handleSearch = () => {
  pagination.page = 1
  fetchArticles()
}

const handleReset = () => {
  searchKeyword.value = ''
  selectedCategoryKeys.value = ['all']
  filterPublished.value = null
  pagination.page = 1
  fetchArticles()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchArticles()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchArticles()
}

const handleCreateCategory = async () => {
  try {
    await categoryFormRef.value?.validate()
    creatingCategory.value = true
    await post('/knowledge-base/categories', {
      name: categoryForm.name,
      parent_id: categoryForm.parent_id,
      description: categoryForm.description || undefined
    })
    message.success('分类创建成功')
    showCategoryModal.value = false
    resetCategoryForm()
    await fetchCategories()
  } catch (e: any) {
    if (e?.errors) return
    message.error(e.message || '创建分类失败')
  } finally {
    creatingCategory.value = false
  }
}

const resetCategoryForm = () => {
  categoryForm.name = ''
  categoryForm.parent_id = null
  categoryForm.description = ''
}

const handleAddKeyword = () => {
  const raw = keywordsInput.value.trim()
  if (!raw) return
  const parts = raw.split(/[,，]/).map(s => s.trim()).filter(s => s)
  parts.forEach(p => {
    if (p && !articleForm.keywords.includes(p)) {
      articleForm.keywords.push(p)
    }
  })
  keywordsInput.value = ''
}

const removeKeyword = (idx: number) => {
  articleForm.keywords.splice(idx, 1)
}

const handleCreateArticle = async () => {
  try {
    await articleFormRef.value?.validate()
    creatingArticle.value = true
    await post('/knowledge-base/articles', {
      title: articleForm.title,
      content: articleForm.content,
      category_id: articleForm.category_id,
      keywords: articleForm.keywords,
      is_published: articleForm.is_published
    })
    message.success('文章创建成功')
    showArticleModal.value = false
    resetArticleForm()
    await fetchArticles()
  } catch (e: any) {
    if (e?.errors) return
    message.error(e.message || '创建文章失败')
  } finally {
    creatingArticle.value = false
  }
}

const resetArticleForm = () => {
  articleForm.title = ''
  articleForm.content = ''
  articleForm.category_id = null
  articleForm.keywords = []
  articleForm.is_published = true
  keywordsInput.value = ''
}

const handleHelpful = async (articleId: number) => {
  if (helpfulClickedMap[articleId]) return
  try {
    const res = await post<any>(`/knowledge-base/articles/${articleId}/helpful`)
    helpfulMap[articleId] = res.helpful_count
    helpfulClickedMap[articleId] = true
    message.success('感谢反馈')
  } catch (e: any) {
    message.error(e.message || '操作失败')
  }
}

const getSummary = (content: string, maxLen = 120) => {
  const plain = content.replace(/[#*`>\-\n\r]/g, ' ').replace(/\s+/g, ' ').trim()
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain
}

const goToDetail = (id: number) => {
  router.push(`/knowledge-base/${id}`)
}

onMounted(async () => {
  auth.restoreAuth()
  selectedCategoryKeys.value = ['all']
  await fetchCategories()
  fetchArticles()
})
</script>

<style scoped lang="scss">
.kb-page {
  min-height: calc(100vh - 64px);
}

.sider-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.toolbar-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-card {
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
}

.article-title {
  font-size: 16px;
  color: #303133;
}

.article-summary {
  font-size: 13px;
  line-height: 1.6;
}

.article-meta {
  border-top: 1px solid #f5f5f5;
  padding-top: 12px;
}

.keyword-tags {
  margin-top: 8px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}
</style>
