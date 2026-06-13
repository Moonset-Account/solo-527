<template>
  <div class="kb-detail-wrapper">
    <n-spin :show="loading">
    <n-space vertical :size="16" style="padding: 20px;">
      <n-card v-if="article">
        <template #header>
          <div class="article-header">
            <div class="header-left">
              <n-button text size="small" @click="goBack">
                ← 返回
              </n-button>
              <h2 class="article-title">{{ displayTitle }}</h2>
              <n-tag v-if="!displayIsPublished" type="warning" size="small" round>
                草稿
              </n-tag>
              <n-tag v-else type="success" size="small" round>
                已发布
              </n-tag>
            </div>
            <div class="header-right">
              <n-space>
                <n-button
                  v-if="canEdit"
                  type="primary"
                  size="small"
                  @click="openEditModal"
                >
                  ✏️ 编辑
                </n-button>
                <n-button
                  type="default"
                  size="small"
                  :type="hasLiked ? 'success' : 'default'"
                  @click="toggleLike"
                  :loading="likeLoading"
                >
                  👍 有帮助 ({{ likeCount }})
                </n-button>
              </n-space>
            </div>
          </div>
        </template>

        <n-descriptions :column="3" bordered size="small">
          <n-descriptions-item label="文章编号">
            #{{ article.id }}
          </n-descriptions-item>
          <n-descriptions-item label="版本号">
            <n-tag type="info" size="small">v{{ displayVersion }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="分类">
            <n-space :size="6">
              <n-tag v-if="displayCategory" :bordered="false" size="small" type="primary">
                📁 {{ displayCategory }}
              </n-tag>
              <span v-else>-</span>
            </n-space>
          </n-descriptions-item>
          <n-descriptions-item label="作者">
            {{ displayAuthor }}
          </n-descriptions-item>
          <n-descriptions-item label="更新时间">
            {{ formatDateTime(displayUpdatedAt) }}
          </n-descriptions-item>
          <n-descriptions-item label="浏览量">
            👁️ {{ displayViews }}
          </n-descriptions-item>
          <n-descriptions-item label="关键词" :span="3">
            <n-space :size="6" v-if="displayKeywords && displayKeywords.length > 0">
              <n-tag
                v-for="(kw, idx) in displayKeywords"
                :key="idx"
                size="small"
                :bordered="false"
              >
                #{{ kw }}
              </n-tag>
            </n-space>
            <span v-else>-</span>
          </n-descriptions-item>
        </n-descriptions>

        <n-divider />

        <div class="article-content">
          <div class="markdown-body" v-html="renderedContent"></div>
        </div>

        <n-divider v-if="viewingVersion" />

        <n-alert v-if="viewingVersion" type="info" :show-icon="true">
          当前正在查看历史版本 v{{ viewingVersion.version }}
          <n-space style="margin-top: 8px;">
            <n-button size="small" type="primary" @click="restoreCurrent">
              返回最新版本
            </n-button>
          </n-space>
        </n-alert>
      </n-card>

      <n-tabs v-model:value="activeTab" type="line" animated v-if="article">
        <n-tab-pane name="detail" tab="详情">
          <n-space vertical :size="16">
            <n-card title="基本信息" :bordered="true">
              <n-descriptions :column="2" size="small">
                <n-descriptions-item label="创建时间">
                  {{ formatDateTime(article.created_at) }}
                </n-descriptions-item>
                <n-descriptions-item label="最后编辑人">
                  {{ displayLastEditor }}
                </n-descriptions-item>
                <n-descriptions-item label="变更说明" :span="2">
                  <div style="white-space: pre-wrap; word-break: break-word; line-height: 1.6;">
                    {{ displayChangeNote || '-' }}
                  </div>
                </n-descriptions-item>
              </n-descriptions>
            </n-card>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="versions" tab="版本历史">
          <n-card title="版本历史记录" :bordered="true">
            <n-timeline v-if="versions.length > 0" size="medium">
              <n-timeline-item
                v-for="ver in sortedVersions"
                :key="ver.id"
                :type="getVersionTimelineType(ver)"
              >
                <template #title>
                  <div class="version-title">
                    <n-space :size="8">
                      <n-tag
                        type="info"
                        size="small"
                        :bordered="false"
                      >
                        v{{ ver.version }}
                      </n-tag>
                      <a
                        v-if="!isViewingVersion(ver)"
                        class="version-view-link"
                        @click="viewVersion(ver)"
                      >
                        查看此版本
                      </a>
                      <n-tag v-else type="success" size="small">
                        当前查看
                      </n-tag>
                      <n-tag v-if="isLatestVersion(ver)" type="success" size="small" :bordered="false">
                        最新
                      </n-tag>
                    </n-space>
                  </div>
                </template>
                <template #time>
                  {{ formatDateTime(ver.created_at) }}
                </template>
                <div class="version-content">
                  <div class="version-meta">
                    <n-space :size="12">
                      <span class="meta-item">
                        👤 变更人: {{ getVersionAuthor(ver) }}
                      </span>
                    </n-space>
                  </div>
                  <div class="version-note" v-if="ver.change_note">
                    <n-alert type="default" :show-icon="false">
                      <template #icon>
                        <span>📝</span>
                      </template>
                      {{ ver.change_note }}
                    </n-alert>
                  </div>
                  <div class="version-summary" v-else>
                    <span style="color: #86909c;">（未填写变更说明）</span>
                  </div>
                </div>
              </n-timeline-item>
            </n-timeline>
            <n-empty v-else description="暂无版本历史记录" />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="tickets" tab="关联工单">
          <n-card title="引用此知识库的工单" :bordered="true">
            <n-space vertical :size="12" v-if="relatedTickets.length > 0">
              <n-card
                v-for="ticket in relatedTickets"
                :key="ticket.id"
                size="small"
                hoverable
              >
                <div class="related-ticket-item">
                  <div class="ticket-info">
                    <div class="ticket-header">
                      <n-space :size="8">
                        <a
                          class="ticket-link"
                          @click="navigateToTicket(ticket.id)"
                        >
                          #{{ ticket.id }} {{ ticket.title }}
                        </a>
                        <n-tag
                          :type="getTicketStatusType(ticket.status)"
                          size="small"
                          round
                        >
                          {{ getTicketStatusLabel(ticket.status) }}
                        </n-tag>
                      </n-space>
                    </div>
                    <div class="ticket-meta">
                      <n-space :size="12">
                        <span>创建人: {{ getTicketRequester(ticket) }}</span>
                        <span>创建时间: {{ formatDateTime(ticket.created_at) }}</span>
                        <n-tag
                          v-if="ticket.priority"
                          :type="getTicketPriorityType(ticket.priority)"
                          size="small"
                        >
                          {{ getTicketPriorityLabel(ticket.priority) }}
                        </n-tag>
                      </n-space>
                    </div>
                  </div>
                </div>
              </n-card>
            </n-space>
            <n-empty v-else description="暂无关联工单" />
          </n-card>
        </n-tab-pane>
      </n-tabs>
    </n-space>

    <n-modal
      v-model:show="showEditModal"
      preset="card"
      title="编辑知识库文章"
      style="width: 800px; max-width: 95vw;"
      :mask-closable="false"
    >
      <n-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-placement="top"
      >
        <n-form-item label="标题" path="title">
          <n-input
            v-model:value="editForm.title"
            placeholder="请输入文章标题"
            clearable
          />
        </n-form-item>

        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="分类" path="category_id">
              <n-select
                v-model:value="editForm.category_id"
                placeholder="请选择分类"
                :options="categoryOptions"
                filterable
                clearable
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="是否发布" path="is_published">
              <n-switch
                v-model:value="editForm.is_published"
                round
              />
              <span style="margin-left: 8px; color: #86909c; font-size: 13px;">
                {{ editForm.is_published ? '已发布（所有人可见）' : '草稿（仅内部可见）' }}
              </span>
            </n-form-item>
          </n-grid-item>
        </n-grid>

        <n-form-item label="关键词">
          <n-select
            v-model:value="editForm.keywords"
            placeholder="输入关键词后回车添加"
            :options="keywordSuggestions"
            multiple
            allow-create
            filterable
            tag
          />
        </n-form-item>

        <n-form-item label="文章内容（支持 Markdown）" path="content">
          <n-input
            v-model:value="editForm.content"
            type="textarea"
            placeholder="请输入文章内容，支持 Markdown 格式"
            :autosize="{ minRows: 10, maxRows: 20 }"
          />
        </n-form-item>

        <n-form-item label="变更说明" path="change_summary">
          <n-input
            v-model:value="editForm.change_summary"
            type="textarea"
            placeholder="请简要描述本次修改内容，将在版本历史中显示"
            :rows="3"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditModal = false">
            取消
          </n-button>
          <n-button
            type="primary"
            :loading="editLoading"
            @click="submitEdit"
          >
            保存修改
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const { get, put, post } = useApi()
const auth = useAuthStore()
const message = useMessage()

const loading = ref(true)
const editLoading = ref(false)
const likeLoading = ref(false)
const activeTab = ref('detail')
const showEditModal = ref(false)
const editFormRef = ref()

const article = ref<any>(null)
const versions = ref<any[]>([])
const viewingVersion = ref<any>(null)
const relatedTickets = ref<any[]>([])
const hasLiked = ref(false)
const likeCount = ref(0)

const editForm = reactive({
  title: '',
  content: '',
  category_id: null as number | null,
  keywords: [] as string[],
  is_published: true as boolean,
  change_summary: ''
})

const categoryOptions = ref<any[]>([])

const keywordSuggestions = ref([
  { label: '登录', value: '登录' },
  { label: '密码', value: '密码' },
  { label: '报错', value: '报错' },
  { label: '使用方法', value: '使用方法' },
  { label: '充值', value: '充值' },
  { label: '发票', value: '发票' }
])

const editRules = {
  title: { required: true, message: '请输入文章标题', trigger: 'blur' },
  content: { required: true, message: '请输入文章内容', trigger: 'blur' }
}

const articleId = computed(() => Number(route.params.id))

const canEdit = computed(() => {
  if (!article.value) return false
  if (auth.isAdmin || auth.isSupervisor) return true
  if (auth.isAgent && article.value.author_id === auth.user?.id) return true
  return false
})

const displayTitle = computed(() =>
  viewingVersion.value ? viewingVersion.value.title : article.value?.title || ''
)

const displayContent = computed(() =>
  viewingVersion.value ? viewingVersion.value.content : article.value?.content || ''
)

const displayVersion = computed(() =>
  viewingVersion.value ? viewingVersion.value.version : article.value?.version || 1
)

const displayCategory = computed(() => {
  if (viewingVersion.value) return null
  const cat = article.value?.category
  if (!cat) return null
  return typeof cat === 'object' ? cat.name : null
})

const displayKeywords = computed(() => {
  const kw = viewingVersion.value ? viewingVersion.value.keywords : article.value?.keywords
  if (Array.isArray(kw)) return kw
  if (typeof kw === 'string' && kw) return kw.split(',').map(k => k.trim()).filter(Boolean)
  return []
})

const displayAuthor = computed(() => {
  const author = article.value?.author
  if (!author) return '-'
  return author.full_name || author.username || '-'
})

const displayLastEditor = computed(() => {
  const editor = article.value?.last_editor || article.value?.author
  if (!editor) return '-'
  return editor.full_name || editor.username || '-'
})

const displayUpdatedAt = computed(() =>
  viewingVersion.value ? viewingVersion.value.created_at : article.value?.updated_at
)

const displayIsPublished = computed(() =>
  viewingVersion.value ? viewingVersion.value.is_published : article.value?.is_published
)

const displayViews = computed(() => article.value?.view_count || article.value?.views || 0)

const displayChangeNote = computed(() => article.value?.change_note || article.value?.last_change_note)

const renderedContent = computed(() => simpleMarkdownToHtml(displayContent.value))

const sortedVersions = computed(() => {
  return [...versions.value].sort(
    (a: any, b: any) => b.version - a.version
  )
})

function simpleMarkdownToHtml(md: string): string {
  if (!md) return ''
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => {
    return `<pre class="md-code-block"><code>${code.trim()}</code></pre>`
  })

  html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>')

  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')
  html = html.replace(/_(.*?)_/g, '<em>$1</em>')
  html = html.replace(/`(.*?)`/g, '<code class="md-inline-code">$1</code>')
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>')

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  html = html.replace(/^\s*[-*+]\s+(.*)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)(?=\n|$)/sg, (_m, list) => {
    const items = list.match(/<li>.*?<\/li>/g) || []
    if (items.length === 0) return list
    return `<ul>${items.join('')}</ul>`
  })

  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li>$2</li>')
  html = html.replace(/(<li>.*<\/li>)(?=\n|$)/sg, (_m, list) => {
    const items = list.match(/<li>.*?<\/li>/g) || []
    if (items.length === 0) return list
    return `<ol>${items.join('')}</ol>`
  })

  html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')

  html = html.replace(/^\s*---+\s*$/gm, '<hr />')

  const paragraphs: string[] = []
  html.split(/\n{2,}/).forEach(block => {
    const trimmed = block.trim()
    if (!trimmed) return
    if (/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|p|a|code|del|strong|em|div)/i.test(trimmed)) {
      paragraphs.push(trimmed)
    } else {
      paragraphs.push(`<p>${trimmed.replace(/\n/g, '<br />')}</p>`)
    }
  })

  return paragraphs.join('\n')
}

function formatDateTime(dt: string | null | undefined): string {
  if (!dt) return '-'
  const d = new Date(dt)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function isLatestVersion(ver: any): boolean {
  return article.value && ver.version === article.value.version
}

function isViewingVersion(ver: any): boolean {
  if (!viewingVersion.value) return false
  return viewingVersion.value.id === ver.id
}

function getVersionAuthor(ver: any): string {
  const user = ver.created_by || ver.editor || ver.user
  if (!user) return '未知'
  if (typeof user === 'string') return user
  if (typeof user === 'object') {
    return user.full_name || user.username || `用户 #${user.id}`
  }
  return `用户 #${user}`
}

function getVersionTimelineType(ver: any): string {
  if (viewingVersion.value && viewingVersion.value.id === ver.id) return 'success'
  if (article.value && ver.version === article.value.version) return 'primary'
  return 'default'
}

function getTicketStatusType(status: string): string {
  const map: Record<string, string> = {
    pending: 'warning',
    processing: 'info',
    resolved: 'success',
    closed: 'default'
  }
  return map[status] || 'default'
}

function getTicketStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return map[status] || status
}

function getTicketPriorityType(priority: string): string {
  const map: Record<string, string> = {
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'default'
  }
  return map[priority] || 'default'
}

function getTicketPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || priority
}

function getTicketRequester(ticket: any): string {
  const r = ticket.requester
  if (!r) return '-'
  if (typeof r === 'object') return r.full_name || r.username || '-'
  return r
}

async function fetchCategories() {
  try {
    const cats: any[] = await get<any[]>('/knowledge-base/categories')
    categoryOptions.value = cats.map(c => ({ label: c.name, value: c.id }))
  } catch (e: any) {
    console.warn('获取分类失败:', e.message)
  }
}

async function fetchArticle() {
  loading.value = true
  try {
    article.value = await get<any>(`/knowledge-base/articles/${articleId.value}`)
    likeCount.value = article.value.helpful_count || 0
    await fetchRelatedTickets()
  } catch (e: any) {
    message.error(e.message || '获取文章详情失败')
  } finally {
    loading.value = false
  }
}

async function fetchVersions() {
  try {
    versions.value = await get<any[]>(`/knowledge-base/articles/${articleId.value}/versions`)
  } catch (e: any) {
    console.warn('获取版本历史失败:', e.message)
    versions.value = []
  }
}

async function fetchRelatedTickets() {
  try {
    const params = new URLSearchParams({
      kb_article_id: String(articleId.value),
      page: '1',
      page_size: '50'
    })
    const res = await get<any>(`/tickets?${params.toString()}`)
    relatedTickets.value = res.items || res.data || res || []
  } catch (e: any) {
    console.warn('获取关联工单失败:', e.message)
    relatedTickets.value = []
  }
}

function viewVersion(ver: any) {
  viewingVersion.value = ver
  message.info(`正在查看版本 v${ver.version}`)
}

function restoreCurrent() {
  viewingVersion.value = null
  message.success('已返回最新版本')
}

function openEditModal() {
  if (!article.value) return
  editForm.title = article.value.title || ''
  editForm.content = article.value.content || ''
  editForm.category_id = article.value.category_id || article.value.category?.id || null
  editForm.is_published = article.value.is_published === true ? true : false
  editForm.change_summary = ''

  const kw = article.value.keywords
  if (Array.isArray(kw)) {
    editForm.keywords = [...kw]
  } else if (typeof kw === 'string' && kw) {
    editForm.keywords = kw.split(',').map(k => k.trim()).filter(Boolean)
  } else {
    editForm.keywords = []
  }

  showEditModal.value = true
}

async function submitEdit() {
  try {
    await editFormRef.value?.validate()
  } catch {
    return
  }

  editLoading.value = true
  try {
    const payload: any = {
      title: editForm.title,
      content: editForm.content,
      category_id: editForm.category_id,
      is_published: editForm.is_published,
      keywords: editForm.keywords,
      change_summary: editForm.change_summary || undefined
    }

    const updated = await put<any>(`/knowledge-base/articles/${articleId.value}`, payload)
    article.value = updated
    likeCount.value = updated.helpful_count || likeCount.value
    showEditModal.value = false
    message.success('文章保存成功')
    viewingVersion.value = null
    await fetchVersions()
  } catch (e: any) {
    message.error(e.message || '保存失败')
  } finally {
    editLoading.value = false
  }
}

async function toggleLike() {
  likeLoading.value = true
  try {
    const res = await post<any>(`/knowledge-base/articles/${articleId.value}/helpful`, {})
    likeCount.value = res?.helpful_count ?? likeCount.value + 1
    hasLiked.value = true
    message.success('感谢您的反馈 😊')
  } catch (e: any) {
    if (e.message !== 'Unauthorized') message.error(e.message || '操作失败')
  } finally {
    likeLoading.value = false
  }
}

function goBack() {
  router.push('/knowledge-base')
}

function navigateToTicket(id: number) {
  router.push(`/tickets/${id}`)
}

onMounted(() => {
  auth.restoreAuth()
  fetchCategories()
  fetchArticle()
  fetchVersions()
})
</script>

<style scoped lang="scss">
.kb-detail-wrapper {
  min-height: 100vh;
  background-color: #f2f3f5;
}

.article-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .article-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1d2129;
  }

  .header-right {
    flex-shrink: 0;
  }
}

.article-content {
  padding: 8px 0;

  .markdown-body {
    line-height: 1.8;
    color: #1d2129;
    font-size: 14px;
    word-break: break-word;

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      font-weight: 600;
      color: #1d2129;
      margin: 20px 0 12px 0;
      line-height: 1.4;
    }

    :deep(h1) { font-size: 24px; border-bottom: 1px solid #e5e6eb; padding-bottom: 8px; }
    :deep(h2) { font-size: 20px; border-bottom: 1px solid #e5e6eb; padding-bottom: 6px; }
    :deep(h3) { font-size: 17px; }
    :deep(h4) { font-size: 15px; }

    :deep(p) {
      margin: 12px 0;
    }

    :deep(ul),
    :deep(ol) {
      margin: 12px 0;
      padding-left: 24px;

      li {
        margin: 6px 0;
      }
    }

    :deep(blockquote) {
      margin: 12px 0;
      padding: 8px 16px;
      border-left: 4px solid #e5e6eb;
      background: #f7f8fa;
      color: #4e5969;
      border-radius: 0 4px 4px 0;
    }

    :deep(hr) {
      border: none;
      border-top: 1px solid #e5e6eb;
      margin: 20px 0;
    }

    :deep(a) {
      color: #2080f0;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }

    :deep(.md-inline-code) {
      padding: 2px 6px;
      background: #f7f8fa;
      border: 1px solid #e5e6eb;
      border-radius: 4px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 13px;
      color: #d03050;
    }

    :deep(.md-code-block) {
      margin: 12px 0;
      padding: 16px;
      background: #1d2129;
      border-radius: 6px;
      overflow-x: auto;

      code {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #c9cdd4;
      }
    }

    :deep(strong) { font-weight: 600; color: #1d2129; }
    :deep(em) { font-style: italic; }
    :deep(del) { color: #86909c; text-decoration: line-through; }
  }
}

.version-title {
  display: flex;
  align-items: center;
  gap: 8px;

  .version-view-link {
    color: #2080f0;
    cursor: pointer;
    font-size: 13px;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.version-content {
  margin-top: 6px;

  .version-meta {
    font-size: 13px;
    color: #86909c;
    margin-bottom: 8px;

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }

  .version-note {
    margin-top: 4px;
  }

  .version-summary {
    font-size: 13px;
  }
}

.related-ticket-item {
  .ticket-info {
    flex: 1;
    min-width: 0;
  }

  .ticket-header {
    margin-bottom: 6px;
  }

  .ticket-link {
    font-weight: 500;
    color: #2080f0;
    cursor: pointer;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    &:hover {
      text-decoration: underline;
    }
  }

  .ticket-meta {
    font-size: 12px;
    color: #86909c;
  }
}
</style>
