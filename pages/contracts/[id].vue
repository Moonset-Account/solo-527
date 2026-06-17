<template>
  <div v-if="loading" class="empty-state">
    <div style="font-size:48px;margin-bottom:16px">📄</div>
    <div>加载合同详情中...</div>
  </div>

  <div v-else-if="!contract" class="empty-state">
    <div style="font-size:48px;margin-bottom:16px">❌</div>
    <div>合同不存在或已被删除</div>
    <NuxtLink to="/" class="btn btn-primary mt-4">返回列表</NuxtLink>
  </div>

  <div v-else>
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <h2 class="text-2xl font-bold">{{ contract.title }}</h2>
          <span class="badge" :class="getStatusBadgeClass(contract.status)">
            {{ getStatusLabel(contract.status) }}
          </span>
          <span v-if="contract.priority === 'URGENT'" class="badge badge-error">紧急</span>
          <span v-else-if="contract.priority === 'HIGH'" class="badge badge-warning">高优</span>
        </div>
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <span>合同编号: <span class="font-semibold text-gray-700">{{ contract.contractNo }}</span></span>
          <span>创建人: {{ contract.creator?.name }}</span>
          <span>创建时间: {{ formatDate(contract.createdAt) }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="showAssignBtn"
          class="btn btn-primary"
          @click="$router.push(`/assign?contractId=${contract.id}`)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          分派
        </button>
        <button class="btn btn-secondary" @click="showEditModal = true">编辑信息</button>
        <button class="btn btn-secondary" @click="showStatusModal = true">变更状态</button>
        <button class="btn btn-secondary" @click="showUploadModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          上传新版本
        </button>
      </div>
    </div>

    <div class="grid-4 mb-4">
      <div class="card" style="padding:16px">
        <div class="text-sm text-gray-500 mb-1">合同金额</div>
        <div class="text-xl font-bold text-primary">{{ formatAmount(contract.amount, contract.currency) }}</div>
      </div>
      <div class="card" style="padding:16px">
        <div class="text-sm text-gray-500 mb-1">整改期限</div>
        <div class="text-xl font-bold"
             :class="{
               'text-danger': contract.rectifyDeadline && isDeadlineOverdue(contract.rectifyDeadline),
               'text-warning': contract.rectifyDeadline && isDeadlineNear(contract.rectifyDeadline) && !isDeadlineOverdue(contract.rectifyDeadline)
             }">
          <template v-if="contract.rectifyDeadline">
            {{ formatDate(contract.rectifyDeadline, false) }}
            <span class="text-sm font-normal ml-1">
              <span v-if="isDeadlineOverdue(contract.rectifyDeadline)">(逾期{{ -daysFromNow(contract.rectifyDeadline) }}天)</span>
              <span v-else-if="isDeadlineNear(contract.rectifyDeadline)">(剩{{ daysFromNow(contract.rectifyDeadline) }}天)</span>
              <span v-else>({{ daysFromNow(contract.rectifyDeadline) }}天后)</span>
            </span>
          </template>
          <span v-else class="text-gray-400">未设置</span>
        </div>
      </div>
      <div class="card" style="padding:16px">
        <div class="text-sm text-gray-500 mb-1">版本数量</div>
        <div class="text-xl font-bold text-info">{{ contract._count.versions }} 版</div>
      </div>
      <div class="card" style="padding:16px">
        <div class="text-sm text-gray-500 mb-1">意见 / 合规缺口</div>
        <div class="text-xl font-bold">
          <span class="text-info">{{ contract._count.opinions }}</span>
          <span class="text-gray-400 mx-1">/</span>
          <span class="text-warning">{{ contract._count.complianceGaps }}</span>
        </div>
      </div>
    </div>

    <div class="grid-3 mb-4" style="grid-template-columns:1.3fr 1fr">
      <div class="card">
        <div class="card-header">
          <div class="card-title">合同基本信息</div>
        </div>
        <div class="card-body">
          <div class="grid-2 mb-3">
            <div class="info-item">
              <span class="info-label">合同类型</span>
              <span class="info-value badge badge-info">{{ contract.contractType }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">甲 方</span>
              <span class="info-value" :title="contract.partyA">{{ contract.partyA }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">乙 方</span>
              <span class="info-value" :title="contract.partyB">{{ contract.partyB }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">签订日期</span>
              <span class="info-value">{{ formatDate(contract.signDate, false) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">生效日期</span>
              <span class="info-value">{{ formatDate(contract.effectiveDate, false) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">到期日期</span>
              <span class="info-value">{{ formatDate(contract.expiryDate, false) }}</span>
            </div>
          </div>
          <div class="info-item mb-3" v-if="contract.keywords">
            <span class="info-label">关键词</span>
            <div class="chip-list">
              <span v-for="tag in contract.keywords.split(/[,,]/).filter(Boolean)" :key="tag" class="chip">{{ tag }}</span>
            </div>
          </div>
          <div class="info-item" v-if="contract.description">
            <span class="info-label">合同描述</span>
            <div class="info-value desc-text">{{ contract.description }}</div>
          </div>

          <div class="divider"></div>

          <div class="mb-2 font-semibold">当前分派</div>
          <div v-if="currentAssignment" class="grid-2">
            <div class="assign-card">
              <div class="flex items-center gap-2 mb-1">
                <span class="badge badge-lawyer">律师</span>
                <span class="font-semibold">{{ currentAssignment.lawyer?.name }}</span>
              </div>
              <div class="text-sm text-gray-500">
                {{ currentAssignment.lawyer?.department }} · {{ currentAssignment.lawyer?.email }}
              </div>
              <div class="text-sm mt-2">
                <span class="text-gray-500">分派:</span> {{ formatDate(currentAssignment.lawyerAssignedAt) }}
              </div>
              <div v-if="currentAssignment.lawyerDeadline" class="text-sm">
                <span class="text-gray-500">截止:</span>
                <span :class="{ 'text-danger': isDeadlineOverdue(currentAssignment.lawyerDeadline), 'text-warning': isDeadlineNear(currentAssignment.lawyerDeadline) }">
                  {{ formatDate(currentAssignment.lawyerDeadline, false) }}
                </span>
              </div>
              <div v-if="currentAssignment.lawyerCompletedAt" class="text-sm text-success">
                ✓ 完成于 {{ formatDate(currentAssignment.lawyerCompletedAt) }}
              </div>
            </div>
            <div class="assign-card" v-if="currentAssignment.reviewer">
              <div class="flex items-center gap-2 mb-1">
                <span class="badge badge-reviewer">复核人</span>
                <span class="font-semibold">{{ currentAssignment.reviewer?.name }}</span>
              </div>
              <div class="text-sm text-gray-500">
                {{ currentAssignment.reviewer?.department }} · {{ currentAssignment.reviewer?.email }}
              </div>
              <div v-if="currentAssignment.reviewerAssignedAt" class="text-sm mt-2">
                <span class="text-gray-500">分派:</span> {{ formatDate(currentAssignment.reviewerAssignedAt) }}
              </div>
              <div v-if="currentAssignment.reviewerDeadline" class="text-sm">
                <span class="text-gray-500">截止:</span>
                <span :class="{ 'text-danger': isDeadlineOverdue(currentAssignment.reviewerDeadline), 'text-warning': isDeadlineNear(currentAssignment.reviewerDeadline) }">
                  {{ formatDate(currentAssignment.reviewerDeadline, false) }}
                </span>
              </div>
              <div v-if="currentAssignment.reviewerCompletedAt" class="text-sm text-success">
                ✓ 完成于 {{ formatDate(currentAssignment.reviewerCompletedAt) }}
              </div>
            </div>
          </div>
          <div v-else class="text-gray-400 text-sm p-4 bg-gray-50 rounded-lg text-center">
            暂未分派
          </div>
        </div>
      </div>

      <div class="space-y-4 flex flex-col gap-4" style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header">
            <div class="card-title flex items-center gap-2">
              版本历史
              <span class="text-sm font-normal text-gray-500">({{ contract.versions.length }})</span>
            </div>
          </div>
          <div class="card-body" style="padding:12px 16px">
            <div v-if="contract.versions.length === 0" class="text-gray-400 text-sm text-center py-6">
              暂无版本
            </div>
            <div v-for="v in contract.versions" :key="v.id" class="version-item">
              <div class="version-badge" :class="{ current: v.isCurrent }">v{{ v.versionNo }}</div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate flex items-center gap-2">
                  {{ v.fileName }}
                  <span v-if="v.isCurrent" class="badge badge-completed">当前版本</span>
                </div>
                <div class="text-sm text-gray-500">
                  {{ v.uploader?.name }} · {{ formatDate(v.createdAt) }} · {{ formatFileSize(v.fileSize) }}
                </div>
                <div v-if="v.note" class="text-sm text-gray-600 mt-1">{{ v.note }}</div>
              </div>
              <button class="btn btn-secondary btn-sm" @click="handleDownload(v)">下载</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title flex items-center gap-2">
              下载记录
              <span class="text-sm font-normal text-gray-500">(最近{{ contract.downloads.length }}条)</span>
            </div>
          </div>
          <div class="card-body" style="padding:12px 16px;max-height:260px;overflow-y:auto">
            <div v-if="contract.downloads.length === 0" class="text-gray-400 text-sm text-center py-6">
              暂无下载
            </div>
            <div v-for="d in contract.downloads" :key="d.id" class="download-item">
              <div class="download-avatar">{{ d.user?.name?.charAt(0) }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm">
                  <span class="font-semibold">{{ d.user?.name }}</span>
                  <span class="badge ml-1" :class="getRoleBadgeClass(d.user?.role)">{{ getRoleLabel(d.user?.role) }}</span>
                </div>
                <div class="text-xs text-gray-500">
                  {{ formatDate(d.createdAt) }}
                  <span v-if="d.version"> · v{{ d.version.versionNo }}</span>
                </div>
                <div v-if="d.downloadReason" class="text-xs text-gray-600 mt-1">原因: {{ d.downloadReason }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title flex items-center gap-2">
              合规缺口
              <span v-if="contract._count.complianceGaps > 0" class="badge badge-warning">{{ contract._count.complianceGaps }}</span>
            </div>
            <button class="btn btn-secondary btn-sm" @click="$router.push('/compliance')">全部</button>
          </div>
          <div class="card-body" style="padding:12px 16px">
            <div v-if="contract.complianceGaps.length === 0" class="text-gray-400 text-sm text-center py-6">
              暂无合规缺口
            </div>
            <div v-for="g in contract.complianceGaps.slice(0, 5)" :key="g.id" class="gap-item">
              <div class="flex items-center gap-2 mb-1">
                <span class="badge" :class="getGapSeverityClass(g.severity)">{{ getGapSeverityLabel(g.severity) }}</span>
                <span class="badge" :class="getGapStatusClass(g.status)">{{ getGapStatusLabel(g.status) }}</span>
                <span class="font-semibold truncate flex-1">{{ g.title }}</span>
              </div>
              <div class="text-xs text-gray-500 line-clamp-2">{{ g.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">审阅意见 · 操作日志</div>
        <button class="btn btn-primary btn-sm" @click="showOpinionModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          提交意见
        </button>
      </div>
      <div class="card-body">
        <div class="tabs">
          <div class="tab-item" :class="{ active: activeTab === 'opinions' }" @click="activeTab = 'opinions'">
            审阅意见 ({{ contract.opinions.length }})
          </div>
          <div class="tab-item" :class="{ active: activeTab === 'timeline' }" @click="activeTab = 'timeline'">
            状态流转 ({{ logs.length }})
          </div>
        </div>

        <div v-show="activeTab === 'opinions'">
          <div v-if="contract.opinions.length === 0" class="empty-state" style="padding:32px 16px">
            <div style="font-size:36px;margin-bottom:12px">💬</div>
            <div>暂无审阅意见</div>
          </div>
          <div class="comment-thread" v-else>
            <div v-for="op in contract.opinions" :key="op.id" class="comment-item">
              <div class="comment-header">
                <div class="comment-avatar">{{ op.author?.name?.charAt(0) }}</div>
                <span class="comment-author">{{ op.author?.name }}</span>
                <span class="badge" :class="getRoleBadgeClass(op.author?.role)">{{ getRoleLabel(op.author?.role) }}</span>
                <span class="badge" :class="op.opinionType === 'LAW_REVIEW' ? 'badge-lawyer' : op.opinionType === 'FINAL_REVIEW' ? 'badge-reviewer' : op.opinionType === 'RECTIFICATION' ? 'badge-warning' : 'badge-info'">
                  {{ getOpinionTypeLabel(op.opinionType) }}
                </span>
                <span v-if="op.severity" class="badge" :class="getGapSeverityClass(op.severity)">{{ getGapSeverityLabel(op.severity) }}</span>
                <span v-if="op.hasGap" class="badge badge-warning">含合规缺口</span>
                <span v-if="op.version" class="text-sm text-gray-500">版本: v{{ op.version.versionNo }}</span>
                <span class="comment-time">{{ formatDate(op.createdAt) }}</span>
              </div>
              <div v-if="op.title" class="font-semibold mb-1">{{ op.title }}</div>
              <div class="comment-body">{{ op.content }}</div>
              <div v-if="op.clauseRef" class="text-sm text-gray-500 mt-2">
                <span class="font-semibold">条款引用:</span> {{ op.clauseRef }}
              </div>
              <div v-if="op.suggestion" class="mt-2 p-3 rounded-lg bg-blue-50">
                <div class="text-sm font-semibold text-primary mb-1">修改建议</div>
                <div class="text-sm text-gray-700">{{ op.suggestion }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'timeline'">
          <div v-if="logs.length === 0" class="empty-state" style="padding:32px 16px">
            <div style="font-size:36px;margin-bottom:12px">📋</div>
            <div>暂无操作记录</div>
          </div>
          <div class="timeline" v-else>
            <div v-for="log in logs" :key="log.id" class="timeline-item">
              <div class="timeline-dot" :class="getTimelineDotClass(log.action, log.toStatus)"></div>
              <div class="timeline-content">
                <div class="timeline-title flex items-center gap-2">
                  <span class="font-semibold">{{ log.user?.name }}</span>
                  <span class="badge" :class="getRoleBadgeClass(log.user?.role)">{{ getRoleLabel(log.user?.role) }}</span>
                  <span class="badge badge-info">{{ getLogActionLabel(log.action) }}</span>
                  <span v-if="log.fromStatus && log.toStatus" class="text-sm">
                    <span class="badge" :class="getStatusBadgeClass(log.fromStatus)">{{ getStatusLabel(log.fromStatus) }}</span>
                    <span class="mx-1 text-gray-400">→</span>
                    <span class="badge" :class="getStatusBadgeClass(log.toStatus)">{{ getStatusLabel(log.toStatus) }}</span>
                  </span>
                </div>
                <div class="text-sm text-gray-600 mt-1" v-if="log.description">{{ log.description }}</div>
                <div class="timeline-time mt-2">{{ formatDate(log.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交意见弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showOpinionModal" class="modal-mask" @click.self="showOpinionModal = false">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">提交审阅意见</div>
              <button class="modal-close" @click="showOpinionModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="grid-2 mb-4">
                <div>
                  <label class="form-label">意见类型</label>
                  <select v-model="opinionForm.opinionType" class="form-select">
                    <option v-for="t in OPINION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">适用版本</label>
                  <select v-model="opinionForm.versionId" class="form-select">
                    <option value="">选择版本</option>
                    <option v-for="v in contract.versions" :key="v.id" :value="v.id">v{{ v.versionNo }} · {{ v.fileName }}</option>
                  </select>
                </div>
              </div>
              <div class="grid-2 mb-4">
                <div>
                  <label class="form-label">标题</label>
                  <input v-model="opinionForm.title" class="form-input" placeholder="意见标题（可选）" />
                </div>
                <div>
                  <label class="form-label">严重程度</label>
                  <select v-model="opinionForm.severity" class="form-select">
                    <option value="">无</option>
                    <option v-for="s in SEVERITY_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">条款引用</label>
                <input v-model="opinionForm.clauseRef" class="form-input" placeholder="如：第3条第2款（可选）" />
              </div>
              <div class="form-group">
                <label class="form-label"><span class="text-danger">*</span> 意见内容</label>
                <textarea v-model="opinionForm.content" class="form-textarea" placeholder="请详细描述您的审阅意见..." rows="4"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">修改建议</label>
                <textarea v-model="opinionForm.suggestion" class="form-textarea" placeholder="具体修改建议（可选）" rows="3"></textarea>
              </div>
              <div class="form-group flex items-center gap-2">
                <input v-model="opinionForm.hasGap" type="checkbox" id="hasGap" style="width:16px;height:16px" />
                <label for="hasGap" style="margin:0">此意见包含合规缺口（完成审阅时自动入看板）</label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showOpinionModal = false">取消</button>
              <button class="btn btn-primary" :disabled="!opinionForm.content" @click="submitOpinion">
                提交意见
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 状态变更弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showStatusModal" class="modal-mask" @click.self="showStatusModal = false">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">变更状态</div>
              <button class="modal-close" @click="showStatusModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="mb-4 p-4 bg-gray-50 rounded-lg">
                <div class="text-sm text-gray-500 mb-1">当前状态</div>
                <span class="badge badge-lg" :class="getStatusBadgeClass(contract.status)" style="font-size:14px;padding:6px 14px">
                  {{ getStatusLabel(contract.status) }}
                </span>
              </div>
              <div class="form-group">
                <label class="form-label">目标状态</label>
                <select v-model="statusForm.targetStatus" class="form-select">
                  <option value="">请选择</option>
                  <option v-for="s in availableStatuses" :key="s" :value="s">
                    {{ getStatusLabel(s) }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">备注说明</label>
                <textarea v-model="statusForm.note" class="form-textarea" placeholder="变更原因说明（可选）" rows="3"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showStatusModal = false">取消</button>
              <button class="btn btn-primary" :disabled="!statusForm.targetStatus" @click="changeStatus">
                确认变更
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 上传新版本弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showUploadModal" class="modal-mask" @click.self="showUploadModal = false">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">上传新版本</div>
              <button class="modal-close" @click="showUploadModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="mb-4 text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                将上传为第 <span class="font-bold text-primary">{{ contract.versions.length + 1 }}</span> 版合同
              </div>
              <div class="form-group">
                <label class="form-label">选择文件</label>
                <div
                  class="upload-area"
                  :class="{ dragging: versionDrag }"
                  @click="$refs.versionFileInput.click()"
                  @dragover.prevent="versionDrag = true"
                  @dragleave.prevent="versionDrag = false"
                  @drop.prevent="handleVersionDrop"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <div>点击或拖拽文件</div>
                  <input ref="versionFileInput" type="file" style="display:none" @change="handleVersionFile" />
                </div>
                <div v-if="versionFile" class="file-item">
                  <div class="file-icon">📄</div>
                  <div class="file-info">
                    <div class="file-name">{{ versionFile.name }}</div>
                    <div class="file-size">{{ formatFileSize(versionFile.size) }}</div>
                  </div>
                  <button class="btn btn-secondary btn-sm" @click.stop="versionFile = null; versionFileData = ''">移除</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">版本说明</label>
                <textarea v-model="versionForm.note" class="form-textarea" placeholder="本次更新的说明，如：修改了第3条付款条款..." rows="3"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showUploadModal = false">取消</button>
              <button class="btn btn-primary" :disabled="!versionFile" @click="uploadVersion">
                {{ uploadingVersion ? '上传中...' : '确认上传' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 编辑合同信息弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEditModal" class="modal-mask modal-lg" @click.self="showEditModal = false">
          <div class="modal">
            <div class="modal-header">
              <div class="modal-title">编辑合同信息</div>
              <button class="modal-close" @click="showEditModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="grid-2 mb-4">
                <div>
                  <label class="form-label">合同名称</label>
                  <input v-model="editForm.title" class="form-input" />
                </div>
                <div>
                  <label class="form-label">合同类型</label>
                  <select v-model="editForm.contractType" class="form-select">
                    <option v-for="t in CONTRACT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">甲方</label>
                  <input v-model="editForm.partyA" class="form-input" />
                </div>
                <div>
                  <label class="form-label">乙方</label>
                  <input v-model="editForm.partyB" class="form-input" />
                </div>
                <div>
                  <label class="form-label">金额</label>
                  <input v-model="editForm.amount" type="number" step="0.01" class="form-input" />
                </div>
                <div>
                  <label class="form-label">币种</label>
                  <select v-model="editForm.currency" class="form-select">
                    <option value="CNY">人民币</option>
                    <option value="USD">美元</option>
                    <option value="EUR">欧元</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">优先级</label>
                  <select v-model="editForm.priority" class="form-select">
                    <option v-for="p in PRIORITY_OPTIONS" :key="p.value" :value="p.value">{{ p.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">整改期限</label>
                  <input v-model="editForm.rectifyDeadline" type="date" class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">描述</label>
                <textarea v-model="editForm.description" class="form-textarea" rows="3"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showEditModal = false">取消</button>
              <button class="btn btn-primary" @click="saveEdit">保存修改</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'

const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const auth = useAuthStore()

const loading = ref(true)
const contract = ref<any>(null)
const logs = ref<any[]>([])
const activeTab = ref('opinions')

const showOpinionModal = ref(false)
const showStatusModal = ref(false)
const showUploadModal = ref(false)
const showEditModal = ref(false)

const versionDrag = ref(false)
const versionFile = ref<any>(null)
const versionFileData = ref('')
const uploadingVersion = ref(false)

const opinionForm = reactive({
  opinionType: 'LAW_REVIEW',
  versionId: '',
  title: '',
  content: '',
  clauseRef: '',
  severity: '',
  suggestion: '',
  hasGap: false
})

const statusForm = reactive({
  targetStatus: '',
  note: ''
})

const versionForm = reactive({
  note: ''
})

const editForm = reactive<any>({})

const STATUS_FLOW_MAP: Record<string, string[]> = {
  NEW: ['ASSIGNED_LAWYER', 'ERROR'],
  ASSIGNED_LAWYER: ['LAWYER_REVIEWING', 'ERROR'],
  LAWYER_REVIEWING: ['LAWYER_COMPLETED', 'PENDING_RECTIFICATION', 'ERROR'],
  LAWYER_COMPLETED: ['ASSIGNED_REVIEWER', 'COMPLETED', 'ERROR'],
  ASSIGNED_REVIEWER: ['REVIEWER_REVIEWING', 'ERROR'],
  REVIEWER_REVIEWING: ['REVIEWER_COMPLETED', 'PENDING_RECTIFICATION', 'ERROR'],
  REVIEWER_COMPLETED: ['COMPLETED', 'PENDING_RECTIFICATION', 'ERROR'],
  PENDING_RECTIFICATION: ['RECTIFYING', 'ERROR'],
  RECTIFYING: ['ASSIGNED_LAWYER', 'ASSIGNED_REVIEWER', 'COMPLETED', 'ERROR'],
  COMPLETED: [],
  ERROR: ['NEW', 'ASSIGNED_LAWYER', 'ASSIGNED_REVIEWER', 'RECTIFYING']
}

const availableStatuses = computed(() => STATUS_FLOW_MAP[contract.value?.status] || [])

const currentAssignment = computed(() => contract.value?.assignments?.[0] || null)

const showAssignBtn = computed(() =>
  ['NEW', 'LAWYER_COMPLETED', 'RECTIFYING'].includes(contract.value?.status)
)

function getTimelineDotClass(action: string, toStatus?: string) {
  if (action === 'COMPLETE' || toStatus === 'COMPLETED') return 'success'
  if (action === 'ERROR' || toStatus === 'ERROR') return 'danger'
  if (action === 'SUBMIT_OPINION' || action === 'ASSIGN_LAWYER' || action === 'ASSIGN_REVIEWER') return 'primary'
  if (toStatus === 'PENDING_RECTIFICATION') return 'warning'
  return ''
}

async function fetchContract() {
  loading.value = true
  ui.showLoading()
  try {
    const data: any = await $fetch(`/api/contracts/${route.params.id}`)
    contract.value = data
    logs.value = data.logs || []
    Object.assign(editForm, {
      title: data.title,
      contractType: data.contractType,
      partyA: data.partyA,
      partyB: data.partyB,
      amount: data.amount,
      currency: data.currency,
      priority: data.priority,
      rectifyDeadline: data.rectifyDeadline ? data.rectifyDeadline.slice(0, 10) : '',
      description: data.description
    })
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
    ui.hideLoading()
  }
}

async function submitOpinion() {
  try {
    ui.showLoading('提交中...')
    await $fetch(`/api/contracts/${contract.value.id}/opinions`, {
      method: 'POST',
      body: {
        ...opinionForm,
        versionId: opinionForm.versionId || undefined,
        severity: opinionForm.severity || undefined
      }
    })
    showOpinionModal.value = false
    opinionForm.content = ''
    opinionForm.title = ''
    opinionForm.clauseRef = ''
    opinionForm.suggestion = ''
    opinionForm.severity = ''
    opinionForm.hasGap = false
    alert('意见提交成功！')
    fetchContract()
  } catch (e: any) {
    alert(e?.data?.message || e?.message || '提交失败')
  } finally {
    ui.hideLoading()
  }
}

async function changeStatus() {
  try {
    ui.showLoading('变更中...')
    await $fetch(`/api/contracts/${contract.value.id}/status`, {
      method: 'PATCH',
      body: {
        status: statusForm.targetStatus,
        note: statusForm.note
      }
    })
    showStatusModal.value = false
    statusForm.targetStatus = ''
    statusForm.note = ''
    alert('状态变更成功！')
    fetchContract()
  } catch (e: any) {
    alert(e?.data?.message || e?.message || '变更失败')
  } finally {
    ui.hideLoading()
  }
}

async function handleDownload(version: any) {
  try {
    await $fetch(`/api/contracts/${contract.value.id}/downloads`, {
      method: 'POST',
      body: {
        versionId: version.id,
        downloadReason: '查看合同文件'
      }
    })
    alert('已记录下载。文件已就绪（演示环境）')
    fetchContract()
  } catch (e: any) {
    alert(e?.data?.message || e?.message || '操作失败')
  }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleVersionFile(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) {
    versionFile.value = f
    versionFileData.value = await readFileAsBase64(f)
  }
}

async function handleVersionDrop(e: DragEvent) {
  versionDrag.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) {
    versionFile.value = f
    versionFileData.value = await readFileAsBase64(f)
  }
}

async function uploadVersion() {
  if (!versionFile.value) return
  uploadingVersion.value = true
  ui.showLoading('上传中...')
  try {
    await $fetch(`/api/contracts/${contract.value.id}/versions`, {
      method: 'POST',
      body: {
        fileName: versionFile.value.name,
        fileData: versionFileData.value,
        mimeType: versionFile.value.type,
        note: versionForm.note
      }
    })
    showUploadModal.value = false
    versionFile.value = null
    versionFileData.value = ''
    versionForm.note = ''
    alert('版本上传成功！')
    fetchContract()
  } catch (e: any) {
    alert(e?.data?.message || e?.message || '上传失败')
  } finally {
    uploadingVersion.value = false
    ui.hideLoading()
  }
}

async function saveEdit() {
  try {
    ui.showLoading('保存中...')
    await $fetch(`/api/contracts/${contract.value.id}`, {
      method: 'PUT',
      body: {
        ...editForm,
        amount: editForm.amount === '' ? null : Number(editForm.amount)
      }
    })
    showEditModal.value = false
    alert('修改成功！')
    fetchContract()
  } catch (e: any) {
    alert(e?.data?.message || e?.message || '保存失败')
  } finally {
    ui.hideLoading()
  }
}

onMounted(() => {
  ui.setPageTitle('合同详情')
  ui.setActiveNav('contracts')
  fetchContract()
})
</script>

<style scoped>
.info-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  gap: 12px;
}

.info-label {
  width: 80px;
  color: var(--gray-500);
  font-size: 13px;
  flex-shrink: 0;
  padding-top: 2px;
}

.info-value {
  flex: 1;
  color: var(--gray-900);
  font-weight: 500;
  overflow-wrap: break-word;
}

.desc-text {
  line-height: 1.7;
  color: var(--gray-700);
  font-weight: 400;
  white-space: pre-wrap;
}

.assign-card {
  background: var(--gray-50);
  border-radius: 10px;
  padding: 14px;
}

.version-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-100);
}

.version-item:last-child {
  border-bottom: none;
}

.version-badge {
  width: 40px;
  height: 40px;
  background: var(--gray-200);
  color: var(--gray-700);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}

.version-badge.current {
  background: var(--success);
  color: white;
}

.download-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-100);
}

.download-item:last-child {
  border-bottom: none;
}

.download-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.gap-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-100);
}

.gap-item:last-child {
  border-bottom: none;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.space-y-4 > * + * {
  margin-top: 16px;
}

.modal-lg {
  max-width: 720px;
}

.badge-lg {
  font-size: 14px;
  padding: 6px 14px;
}
</style>
