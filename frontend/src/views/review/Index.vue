<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><View /></el-icon>审核追溯
        <span style="font-weight:normal;font-size:13px;color:#909399;margin-left:10px;">素材标签、选题脚本、审稿意见变更历史</span>
      </h2>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="query" @submit.prevent>
        <el-form-item label="审核类型">
          <el-select v-model="query.reviewType" placeholder="全部" clearable style="width:160px;" @change="fetchRecords">
            <el-option v-for="t in reviewTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务ID">
          <el-input-number v-model="query.businessId" :min="1" placeholder="输入ID" controls-position="right" style="width:160px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRecords">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="quickLoad(1, 1)">选题ID=1</el-button>
          <el-button type="success" @click="quickLoad(1, 2)">脚本ID=1</el-button>
          <el-button type="warning" @click="quickLoad(3, 3)">素材ID=3</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-row :gutter="20">
      <el-col :span="9">
        <div class="content-card" style="min-height:500px;">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">变更历史时间轴</h3>
            <el-button size="small" type="primary" plain @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>新增变更记录
            </el-button>
          </div>
          <el-empty v-if="!records.length" description="暂无变更记录，选择上方查询条件或快捷按钮加载" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="(r, idx) in records"
              :key="r.id"
              :timestamp="r.createTime"
              :type="timelineType(r, idx)"
              :icon="timelineIcon(r, idx)"
              :hollow="idx === 0"
              @click="selectRecord(r)"
              class="timeline-item"
              :class="{ active: selected?.id === r.id }"
            >
              <div class="record-card">
                <div class="flex-between">
                  <span class="version-tag">
                    <el-tag :type="idx === 0 ? 'success' : 'info'" size="small">
                      V{{ r.version }} 版本
                    </el-tag>
                    <el-tag size="small" style="margin-left:6px;">{{ r.reviewTypeName }}</el-tag>
                  </span>
                  <el-tag v-if="r.reviewResult" :type="resultTagType(r.reviewResult)" size="small">
                    {{ resultTag(r.reviewResult) }}
                  </el-tag>
                </div>
                <div class="diff-text mt-10">
                  <el-icon color="#E6A23C"><Connection /></el-icon>
                  <span>{{ r.diffContent || '（无差异说明）' }}</span>
                </div>
                <div class="reviewer mt-10">
                  <el-avatar :size="24">{{ r.reviewerName?.charAt(0) }}</el-avatar>
                  <span>{{ r.reviewerName || '系统' }}</span>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-col>

      <el-col :span="15">
        <div class="content-card" style="min-height:500px;">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">
              变更详情对比
              <el-tag v-if="selected" size="small" type="success" style="margin-left:8px;">
                V{{ selected.version }}
              </el-tag>
            </h3>
          </div>
          <el-empty v-if="!selected" description="点击左侧时间轴条目查看详细对比" />
          <div v-else>
            <el-descriptions :column="2" border size="small" class="mb-20">
              <el-descriptions-item label="业务ID">{{ selected.businessId }}</el-descriptions-item>
              <el-descriptions-item label="审核类型">{{ selected.reviewTypeName }}</el-descriptions-item>
              <el-descriptions-item label="版本号">V{{ selected.version }}</el-descriptions-item>
              <el-descriptions-item label="审核时间">{{ selected.createTime }}</el-descriptions-item>
              <el-descriptions-item label="审核人">{{ selected.reviewerName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="审核结果">
                <el-tag v-if="selected.reviewResult" :type="resultTagType(selected.reviewResult)">
                  {{ resultTag(selected.reviewResult) }}
                </el-tag>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>

            <el-tabs v-model="activeTab" type="card">
              <el-tab-pane label="变更前后对比" name="diff">
                <div class="compare-box">
                  <div class="compare-col">
                    <div class="compare-header old-header">
                      <el-icon><ArrowLeft /></el-icon>变更前（Before）
                    </div>
                    <div class="compare-content old-content">
                      <pre v-if="selected.beforeContent">{{ formatJson(selected.beforeContent) }}</pre>
                      <el-empty v-else description="（初始版本，无变更前内容）" :image-size="80" />
                    </div>
                  </div>
                  <div class="vs-divider"><el-icon :size="28"><Rank /></el-icon></div>
                  <div class="compare-col">
                    <div class="compare-header new-header">
                      变更后（After）<el-icon><ArrowRight /></el-icon>
                    </div>
                    <div class="compare-content new-content">
                      <pre v-if="selected.afterContent">{{ formatJson(selected.afterContent) }}</pre>
                      <el-empty v-else description="暂无内容" :image-size="80" />
                    </div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="审稿意见" name="opinion">
                <div class="opinion-box">
                  <div class="opinion-meta">
                    <el-avatar :size="36">{{ selected.reviewerName?.charAt(0) || '审' }}</el-avatar>
                    <div>
                      <div class="opinion-name">{{ selected.reviewerName || '审核员' }}</div>
                      <div class="opinion-time">{{ selected.createTime }}</div>
                    </div>
                  </div>
                  <div class="opinion-content">
                    <el-empty v-if="!selected.reviewOpinion" description="暂无审稿意见" :image-size="80" />
                    <div v-else class="opinion-text">
                      <el-icon color="#67C23A" :size="20"><ChatDotRound /></el-icon>
                      <div>{{ selected.reviewOpinion }}</div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="差异说明" name="desc">
                <el-alert type="warning" :closable="false" show-icon class="mb-10">
                  <template #title>本次变更说明</template>
                  {{ selected.diffContent || '未填写差异说明' }}
                </el-alert>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="showAddDialog" title="新增审核变更记录" width="640px" destroy-on-close>
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="业务ID" required>
          <el-input-number v-model="addForm.businessId" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="审核类型" required>
          <el-select v-model="addForm.reviewType" style="width:100%;">
            <el-option v-for="t in reviewTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更前内容">
          <el-input v-model="addForm.beforeContent" type="textarea" :rows="3" placeholder="JSON格式或文本" />
        </el-form-item>
        <el-form-item label="变更后内容">
          <el-input v-model="addForm.afterContent" type="textarea" :rows="3" placeholder="JSON格式或文本" />
        </el-form-item>
        <el-form-item label="差异说明">
          <el-input v-model="addForm.diffContent" type="textarea" :rows="2" placeholder="简要说明变更内容" />
        </el-form-item>
        <el-form-item label="审稿意见">
          <el-input v-model="addForm.reviewOpinion" type="textarea" :rows="2" placeholder="审核员意见" />
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="addForm.reviewResult">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">驳回</el-radio>
            <el-radio :value="3">需修改</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="handleAddRecord">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getReviewListByBusiness, addReviewRecord } from '../../api/review'
import { reviewTypeOptions } from '../../utils/constants'
import { useUserStore } from '../../stores/user'

const route = useRoute()
const userStore = useUserStore()

const query = reactive({
  businessId: null,
  reviewType: null
})
const records = ref([])
const selected = ref(null)
const activeTab = ref('diff')
const showAddDialog = ref(false)
const adding = ref(false)
const addForm = reactive({
  businessId: 1,
  reviewType: 1,
  beforeContent: '',
  afterContent: '',
  diffContent: '',
  reviewOpinion: '',
  reviewResult: 1,
  reviewerId: userStore.userInfo?.id,
  reviewerName: userStore.userInfo?.nickname
})

function formatJson(str) {
  try {
    const obj = JSON.parse(str)
    return JSON.stringify(obj, null, 2)
  } catch {
    return str
  }
}

function resultTag(r) {
  return { 1: '审核通过', 2: '已驳回', 3: '需修改' }[r] || '-'
}
function resultTagType(r) {
  return { 1: 'success', 2: 'danger', 3: 'warning' }[r] || 'info'
}

function timelineType(r, idx) {
  if (idx === 0) return 'success'
  if (r.reviewResult === 2) return 'danger'
  if (r.reviewResult === 3) return 'warning'
  return 'primary'
}

function timelineIcon(r, idx) {
  if (idx === 0) return 'CircleCheckFilled'
  if (r.reviewType === 3) return 'CollectionTag'
  if (r.reviewType === 2) return 'Document'
  return 'Collection'
}

function selectRecord(r) {
  selected.value = r
}

function quickLoad(id, type) {
  query.businessId = id
  query.reviewType = type
  fetchRecords()
}

async function fetchRecords() {
  if (!query.businessId) {
    ElMessage.info('请先输入业务ID')
    return
  }
  try {
    const res = await getReviewListByBusiness(query.businessId, query.reviewType)
    records.value = res.data || []
    if (records.value.length) {
      selected.value = records.value[records.value.length - 1]
    } else {
      selected.value = null
    }
  } catch (e) {
    console.error(e)
    applyMock()
  }
}

function applyMock() {
  records.value = [
    {
      id: 1, businessId: query.businessId, reviewType: 1, reviewTypeName: '选题审核', version: 1,
      beforeContent: null,
      afterContent: '{"title":"夏季新品防晒衣种草","tags":"防晒衣,夏季,种草","targetAudience":"18-35岁女性"}',
      diffContent: '初始提交选题',
      reviewOpinion: '选题方向OK，建议增加更多人群细分',
      reviewResult: 3,
      reviewerId: 4, reviewerName: '陈审核',
      createTime: '2026-06-01 10:30:00'
    },
    {
      id: 2, businessId: query.businessId, reviewType: 1, reviewTypeName: '选题审核', version: 2,
      beforeContent: '{"targetAudience":"18-35岁女性"}',
      afterContent: '{"targetAudience":"18-35岁女性,都市白领,户外爱好者"}',
      diffContent: '目标受众增加了"都市白领,户外爱好者"',
      reviewOpinion: '受众更精准了，选题通过，建议脚本阶段补充素材授权清单',
      reviewResult: 1,
      reviewerId: 4, reviewerName: '陈审核',
      createTime: '2026-06-02 15:20:00'
    },
    {
      id: 3, businessId: query.businessId, reviewType: 2, reviewTypeName: '脚本审核', version: 1,
      beforeContent: null,
      afterContent: '{"title":"防晒衣测评...","duration":"60s-90s","materialTags":"防晒衣测评"}',
      diffContent: '初始提交脚本',
      reviewOpinion: '脚本结构清晰，建议增加洗后测试环节，素材标签不够完整需补充',
      reviewResult: 3,
      reviewerId: 4, reviewerName: '陈审核',
      createTime: '2026-06-03 09:45:00'
    },
    {
      id: 4, businessId: query.businessId, reviewType: 2, reviewTypeName: '脚本审核', version: 2,
      beforeContent: '{"content":"5个章节","materialTags":"防晒衣测评"}',
      afterContent: '{"content":"6个章节，新增洗后对比","materialTags":"防晒衣测评,蒸汽实验,穿搭展示,产品特写"}',
      diffContent: '内容增加洗后测试环节，素材标签扩展至4个',
      reviewOpinion: '修改到位，脚本通过，注意背景音乐版权合规',
      reviewResult: 1,
      reviewerId: 4, reviewerName: '陈审核',
      createTime: '2026-06-04 16:10:00'
    },
    {
      id: 5, businessId: query.businessId, reviewType: 3, reviewTypeName: '素材标签审核', version: 1,
      beforeContent: '{"materialTags":"防晒衣测评"}',
      afterContent: '{"materialTags":"防晒衣测评,蒸汽实验,穿搭展示,产品特写"}',
      diffContent: '素材标签从1个增加到4个，覆盖所有素材场景',
      reviewOpinion: '标签完整，覆盖所有素材场景，同意通过',
      reviewResult: 1,
      reviewerId: 4, reviewerName: '陈审核',
      createTime: '2026-06-04 17:30:00'
    }
  ]
  selected.value = records.value[records.value.length - 1]
}

async function handleAddRecord() {
  if (!addForm.businessId || !addForm.reviewType) {
    ElMessage.warning('请填写必填项')
    return
  }
  adding.value = true
  try {
    const type = reviewTypeOptions.find(t => t.value === addForm.reviewType)
    await addReviewRecord({
      ...addForm,
      reviewTypeName: type?.label
    })
    ElMessage.success('已添加变更记录')
    showAddDialog.value = false
    fetchRecords()
  } catch (e) {
    console.error(e)
    ElMessage.success('已添加（模拟）')
    showAddDialog.value = false
    fetchRecords()
  } finally {
    adding.value = false
  }
}

onMounted(() => {
  if (route.query.businessId) {
    query.businessId = Number(route.query.businessId)
    query.reviewType = route.query.reviewType ? Number(route.query.reviewType) : null
    fetchRecords()
  }
})
</script>

<style scoped lang="scss">
.timeline-item {
  cursor: pointer;

  &.active .record-card {
    background: #ecf5ff;
    border-color: #409EFF;
  }

  .record-card {
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    background: #fafbfc;
    transition: all 0.2s;

    &:hover {
      background: #f0f7ff;
    }

    .diff-text {
      font-size: 13px;
      color: #606266;
      display: flex;
      gap: 4px;
      align-items: flex-start;
    }

    .reviewer {
      display: flex;
      gap: 6px;
      align-items: center;
      font-size: 12px;
      color: #909399;
    }
  }
}

.compare-box {
  display: flex;
  gap: 10px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;

  .compare-col {
    flex: 1;

    .compare-header {
      padding: 10px 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .old-header {
      background: #fef0f0;
      color: #F56C6C;
    }

    .new-header {
      background: #f0f9eb;
      color: #67C23A;
      justify-content: flex-end;
    }

    .compare-content {
      padding: 14px;
      min-height: 280px;
      max-height: 380px;
      overflow-y: auto;

      pre {
        font-family: 'SF Mono', Consolas, Monaco, monospace;
        font-size: 12px;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-all;
        margin: 0;
      }
    }

    .old-content {
      background: #fff7f7;
    }

    .new-content {
      background: #f7fff3;
    }
  }

  .vs-divider {
    width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #fef0f0, #f0f9eb);
    color: #E6A23C;
  }
}

.opinion-box {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  background: #fafbfc;

  .opinion-meta {
    display: flex;
    gap: 10px;
    align-items: center;
    padding-bottom: 14px;
    border-bottom: 1px dashed #e4e7ed;

    .opinion-name {
      font-weight: 600;
    }

    .opinion-time {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }

  .opinion-content {
    padding-top: 14px;

    .opinion-text {
      display: flex;
      gap: 8px;
      padding: 14px;
      background: #fff;
      border-left: 3px solid #67C23A;
      border-radius: 0 6px 6px 0;
      line-height: 1.8;
    }
  }
}
</style>
