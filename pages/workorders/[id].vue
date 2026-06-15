<template>
  <div v-if="workOrder">
    <div class="page-header">
      <h1 class="page-title">工单详情 - {{ workOrder.orderNo }}</h1>
      <div class="flex gap-8">
        <button class="btn" @click="navigateTo('/workorders')">返回列表</button>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <div class="card">
        <h3 class="mb-16">工单信息</h3>
        <div class="form-group">
          <label class="form-label">工单标题</label>
          <div>{{ workOrder.title }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">工单描述</label>
          <div>{{ workOrder.description }}</div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">工单类型</label>
            <div><span class="tag tag-blue">{{ getTypeLabel(workOrder.type) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">优先级</label>
            <div><span :class="['tag', getPriorityClass(workOrder.priority)]">{{ getPriorityLabel(workOrder.priority) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <div><span :class="['status-tag', getStatusClass(workOrder.status)]">{{ getStatusLabel(workOrder.status) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">位置</label>
            <div>{{ workOrder.location }}</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">联系人</label>
            <div>{{ workOrder.contactName }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">联系电话</label>
            <div>{{ workOrder.contactPhone }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">期望完成时间</label>
            <div>{{ workOrder.expectedDate ? formatTime(workOrder.expectedDate) : '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">截止时间</label>
            <div :class="{ 'text-error': isOverdue }">{{ workOrder.deadline ? formatTime(workOrder.deadline) : '-' }}</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">租户</label>
          <div>{{ workOrder.tenant?.name }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">创建人</label>
          <div>{{ workOrder.creator?.name }}</div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-16">处理进度</h3>
        <div v-if="workOrder.progressLogs?.length" class="timeline">
          <div v-for="log in workOrder.progressLogs" :key="log.id" class="timeline-item">
            <div class="timeline-time">{{ formatTime(log.createdAt) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong>{{ log.status }}</strong>
                <span class="text-secondary">{{ log.operatorName }}</span>
              </div>
              <div>{{ log.description }}</div>
              <div class="mt-8">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: log.progressPercent + '%' }"></div>
                </div>
                <div class="text-secondary text-xs mt-4">进度: {{ log.progressPercent }}%</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无进度记录</div>
      </div>
    </div>

    <div class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.badge" class="badge" style="margin-left: 8px;">{{ tab.badge }}</span>
      </div>
    </div>

    <div v-if="activeTab === 'assignment'">
      <div class="card">
        <div class="flex-between mb-16">
          <h3>派工记录</h3>
          <button
            v-if="canAssign"
            class="btn btn-primary"
            @click="showAssignModal = true"
          >
            + 派工
          </button>
        </div>
        <table v-if="workOrder.assignments?.length" class="table">
          <thead>
            <tr>
              <th>处理人</th>
              <th>状态</th>
              <th>派工时间</th>
              <th>接受时间</th>
              <th>完成时间</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in workOrder.assignments" :key="item.id">
              <td>{{ item.assignee?.name }}</td>
              <td><span class="tag tag-blue">{{ getAssignmentStatus(item.status) }}</span></td>
              <td>{{ formatTime(item.assignedAt) }}</td>
              <td>{{ item.acceptedAt ? formatTime(item.acceptedAt) : '-' }}</td>
              <td>{{ item.completedAt ? formatTime(item.completedAt) : '-' }}</td>
              <td>{{ item.remark || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无派工记录</div>
      </div>
    </div>

    <div v-if="activeTab === 'material'">
      <div class="card">
        <div class="flex-between mb-16">
          <h3>材料登记</h3>
          <button
            v-if="canUpdateMaterial"
            class="btn btn-primary"
            @click="showMaterialModal = true"
          >
            + 登记材料
          </button>
        </div>
        <table v-if="workOrder.materials?.length" class="table">
          <thead>
            <tr>
              <th>材料名称</th>
              <th>规格</th>
              <th>数量</th>
              <th>单位</th>
              <th>单价</th>
              <th>总价</th>
              <th>登记时间</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in workOrder.materials" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.specification }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unit }}</td>
              <td>¥{{ item.unitPrice }}</td>
              <td>¥{{ item.totalPrice }}</td>
              <td>{{ formatTime(item.createdAt) }}</td>
              <td>{{ item.remark || '-' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="text-right"><strong>合计</strong></td>
              <td colspan="3"><strong>¥{{ totalMaterialCost }}</strong></td>
            </tr>
          </tfoot>
        </table>
        <div v-else class="empty">暂无材料记录</div>
      </div>
    </div>

    <div v-if="activeTab === 'progress'">
      <div class="card">
        <div class="flex-between mb-16">
          <h3>进度更新</h3>
          <button
            v-if="canUpdateProgress"
            class="btn btn-primary"
            @click="showProgressModal = true"
          >
            + 更新进度
          </button>
        </div>
        <div v-if="workOrder.progressLogs?.length" class="timeline">
          <div v-for="log in workOrder.progressLogs" :key="log.id" class="timeline-item">
            <div class="timeline-time">{{ formatTime(log.createdAt) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong>{{ log.status }}</strong>
                <span class="text-secondary">{{ log.operatorName }}</span>
              </div>
              <div>{{ log.description }}</div>
              <div class="mt-8">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: log.progressPercent + '%' }"></div>
                </div>
                <div class="text-secondary text-xs mt-4">进度: {{ log.progressPercent }}%</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无进度记录</div>
      </div>
    </div>

    <div v-if="activeTab === 'review'">
      <div class="card">
        <div class="flex-between mb-16">
          <h3>回访评价</h3>
          <button
            v-if="canReview && !workOrder.review"
            class="btn btn-primary"
            @click="showReviewModal = true"
          >
            + 回访登记
          </button>
        </div>
        <div v-if="workOrder.review">
          <div class="form-group">
            <label class="form-label">回访结果</label>
            <div><span class="tag tag-green">{{ workOrder.review.result }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">回访内容</label>
            <div>{{ workOrder.review.content }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">改进建议</label>
            <div>{{ workOrder.review.suggestion || '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">回访人</label>
            <div>{{ workOrder.review.reviewerId }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">回访时间</label>
            <div>{{ formatTime(workOrder.review.reviewDate) }}</div>
          </div>
        </div>
        <div v-else class="empty">暂无回访记录</div>

        <div v-if="workOrder.satisfactionSurvey" class="mt-16">
          <h4 class="mb-16">租户满意度评价</h4>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">总体评分</label>
              <div class="rating">
                <span
                  v-for="i in 5"
                  :key="i"
                  :class="['rating-star', { active: i <= workOrder.satisfactionSurvey.overallScore }]"
                >★</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">响应速度</label>
              <div class="rating">
                <span
                  v-for="i in 5"
                  :key="i"
                  :class="['rating-star', { active: i <= workOrder.satisfactionSurvey.responseSpeed }]"
                >★</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">服务态度</label>
              <div class="rating">
                <span
                  v-for="i in 5"
                  :key="i"
                  :class="['rating-star', { active: i <= workOrder.satisfactionSurvey.serviceAttitude }]"
                >★</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">维修质量</label>
              <div class="rating">
                <span
                  v-for="i in 5"
                  :key="i"
                  :class="['rating-star', { active: i <= workOrder.satisfactionSurvey.repairQuality }]"
                >★</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">费用合理性</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= workOrder.satisfactionSurvey.costReasonable }]"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">评价内容</label>
            <div>{{ workOrder.satisfactionSurvey.comment || '-' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'cost'">
      <div class="card">
        <div class="flex-between mb-16">
          <h3>费用归集</h3>
          <button
            v-if="canManageCost && !workOrder.cost"
            class="btn btn-primary"
            @click="showCostModal = true"
          >
            + 费用登记
          </button>
        </div>
        <div v-if="workOrder.cost">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">材料费用</label>
              <div>¥{{ workOrder.cost.materialCost }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">人工费用</label>
              <div>¥{{ workOrder.cost.laborCost }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">其他费用</label>
              <div>¥{{ workOrder.cost.otherCost }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">总费用</label>
              <div style="font-size: 20px; font-weight: 600; color: #f5222d;">¥{{ workOrder.cost.totalCost }}</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">费用明细</label>
            <div>{{ workOrder.cost.costDetails || '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">确认时间</label>
            <div>{{ workOrder.cost.confirmedAt ? formatTime(workOrder.cost.confirmedAt) : '-' }}</div>
          </div>
        </div>
        <div v-else class="empty">暂无费用记录</div>
      </div>
    </div>

    <div v-if="activeTab === 'satisfaction'">
      <div class="card">
        <div class="flex-between mb-16">
          <h3>满意度评价</h3>
          <button
            v-if="canSubmitSatisfaction && !workOrder.satisfactionSurvey"
            class="btn btn-primary"
            @click="showSatisfactionModal = true"
          >
            + 提交评价
          </button>
        </div>
        <div v-if="workOrder.satisfactionSurvey">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">总体评分</label>
              <div class="rating">
                <span v-for="i in 5" :key="i" :class="['rating-star', { active: i <= workOrder.satisfactionSurvey.overallScore }]">★</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">响应速度</label>
              <div class="rating">
                <span v-for="i in 5" :key="i" :class="['rating-star', { active: i <= workOrder.satisfactionSurvey.responseSpeed }]">★</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">服务态度</label>
              <div class="rating">
                <span v-for="i in 5" :key="i" :class="['rating-star', { active: i <= workOrder.satisfactionSurvey.serviceAttitude }]">★</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">维修质量</label>
              <div class="rating">
                <span v-for="i in 5" :key="i" :class="['rating-star', { active: i <= workOrder.satisfactionSurvey.repairQuality }]">★</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">费用合理性</label>
            <div class="rating">
              <span v-for="i in 5" :key="i" :class="['rating-star', { active: i <= workOrder.satisfactionSurvey.costReasonable }]">★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">评价内容</label>
            <div>{{ workOrder.satisfactionSurvey.comment || '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">改进建议</label>
            <div>{{ workOrder.satisfactionSurvey.improvement || '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">评价时间</label>
            <div>{{ formatTime(workOrder.satisfactionSurvey.surveyDate) }}</div>
          </div>
        </div>
        <div v-else class="empty">暂无评价记录</div>
      </div>
    </div>

    <div v-if="canClose && workOrder.status !== 'CLOSED'" class="card">
      <div class="flex-between">
        <div>
          <h3>结案处理</h3>
          <p class="text-secondary">确认所有流程完成后，可结案归档</p>
        </div>
        <button class="btn btn-success" @click="handleClose">结案</button>
      </div>
    </div>

    <div v-if="showAssignModal" class="modal-mask" @click.self="showAssignModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">派工</span>
          <button class="btn" @click="showAssignModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">选择工程师</label>
            <select v-model="assignForm.assigneeId" class="form-select">
              <option value="">请选择</option>
              <option v-for="e in engineers" :key="e.id" :value="e.id">{{ e.name }} ({{ e.phone }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="assignForm.remark" class="form-textarea" placeholder="请输入派工备注"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showAssignModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAssign" :disabled="!assignForm.assigneeId">确认派工</button>
        </div>
      </div>
    </div>

    <div v-if="showMaterialModal" class="modal-mask" @click.self="showMaterialModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">登记材料</span>
          <button class="btn" @click="showMaterialModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">材料名称</label>
            <input v-model="materialForm.name" class="form-input" placeholder="请输入材料名称" />
          </div>
          <div class="form-group">
            <label class="form-label">规格</label>
            <input v-model="materialForm.specification" class="form-input" placeholder="请输入规格" />
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">数量</label>
              <input v-model.number="materialForm.quantity" type="number" class="form-input" placeholder="数量" />
            </div>
            <div class="form-group">
              <label class="form-label">单位</label>
              <input v-model="materialForm.unit" class="form-input" placeholder="如：个、件、米" />
            </div>
            <div class="form-group">
              <label class="form-label">单价</label>
              <input v-model.number="materialForm.unitPrice" type="number" class="form-input" placeholder="单价" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="materialForm.remark" class="form-textarea" placeholder="备注"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showMaterialModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAddMaterial">确认登记</button>
        </div>
      </div>
    </div>

    <div v-if="showProgressModal" class="modal-mask" @click.self="showProgressModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">更新进度</span>
          <button class="btn" @click="showProgressModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">状态</label>
            <input v-model="progressForm.status" class="form-input" placeholder="如：现场检查、维修中、已完成" />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea v-model="progressForm.description" class="form-textarea" placeholder="请详细描述当前进度"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">完成进度 (%)</label>
            <input v-model.number="progressForm.progressPercent" type="range" min="0" max="100" class="form-input" />
            <div class="text-center">{{ progressForm.progressPercent }}%</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showProgressModal = false">取消</button>
          <button class="btn btn-primary" @click="handleUpdateProgress">确认更新</button>
        </div>
      </div>
    </div>

    <div v-if="showReviewModal" class="modal-mask" @click.self="showReviewModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">回访登记</span>
          <button class="btn" @click="showReviewModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">回访结果</label>
            <select v-model="reviewForm.result" class="form-select">
              <option value="合格">合格</option>
              <option value="基本合格">基本合格</option>
              <option value="不合格">不合格</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">回访内容</label>
            <textarea v-model="reviewForm.content" class="form-textarea" placeholder="请详细描述回访情况"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">改进建议</label>
            <textarea v-model="reviewForm.suggestion" class="form-textarea" placeholder="改进建议"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showReviewModal = false">取消</button>
          <button class="btn btn-primary" @click="handleReview">确认提交</button>
        </div>
      </div>
    </div>

    <div v-if="showCostModal" class="modal-mask" @click.self="showCostModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">费用登记</span>
          <button class="btn" @click="showCostModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">材料费用</label>
              <input v-model.number="costForm.materialCost" type="number" class="form-input" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">人工费用</label>
              <input v-model.number="costForm.laborCost" type="number" class="form-input" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">其他费用</label>
              <input v-model.number="costForm.otherCost" type="number" class="form-input" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">总费用</label>
              <input :value="totalCost" class="form-input" disabled />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">费用明细</label>
            <textarea v-model="costForm.costDetails" class="form-textarea" placeholder="请详细描述费用构成"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showCostModal = false">取消</button>
          <button class="btn btn-primary" @click="handleCost">确认提交</button>
        </div>
      </div>
    </div>

    <div v-if="showSatisfactionModal" class="modal-mask" @click.self="showSatisfactionModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">满意度评价</span>
          <button class="btn" @click="showSatisfactionModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">总体评分</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.overallScore }]"
                @click="satisfactionForm.overallScore = i"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">响应速度</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.responseSpeed }]"
                @click="satisfactionForm.responseSpeed = i"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">服务态度</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.serviceAttitude }]"
                @click="satisfactionForm.serviceAttitude = i"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">维修质量</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.repairQuality }]"
                @click="satisfactionForm.repairQuality = i"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">费用合理性</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.costReasonable }]"
                @click="satisfactionForm.costReasonable = i"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">评价内容</label>
            <textarea v-model="satisfactionForm.comment" class="form-textarea" placeholder="请输入您的评价"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">改进建议</label>
            <textarea v-model="satisfactionForm.improvement" class="form-textarea" placeholder="请输入改进建议"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showSatisfactionModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSatisfaction">提交评价</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty">加载中...</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'

const route = useRoute()
const { user, initAuth, isLoggedIn } = useAuth()

const workOrder = ref<any>(null)
const engineers = ref<any[]>([])
const activeTab = ref('assignment')

const showAssignModal = ref(false)
const showMaterialModal = ref(false)
const showProgressModal = ref(false)
const showReviewModal = ref(false)
const showCostModal = ref(false)
const showSatisfactionModal = ref(false)

const assignForm = reactive({
  assigneeId: '',
  remark: ''
})

const materialForm = reactive({
  name: '',
  specification: '',
  quantity: 1,
  unit: '',
  unitPrice: 0,
  remark: ''
})

const progressForm = reactive({
  status: '',
  description: '',
  progressPercent: 0
})

const reviewForm = reactive({
  result: '合格',
  content: '',
  suggestion: ''
})

const costForm = reactive({
  materialCost: 0,
  laborCost: 0,
  otherCost: 0,
  costDetails: ''
})

const satisfactionForm = reactive({
  overallScore: 5,
  responseSpeed: 5,
  serviceAttitude: 5,
  repairQuality: 5,
  costReasonable: 5,
  comment: '',
  improvement: ''
})

const id = computed(() => parseInt(route.params.id as string))

const tabs = computed(() => {
  const baseTabs = [
    { key: 'assignment', label: '派工记录', badge: workOrder.value?.assignments?.length || 0 },
    { key: 'material', label: '材料登记', badge: workOrder.value?.materials?.length || 0 },
    { key: 'progress', label: '进度更新', badge: workOrder.value?.progressLogs?.length || 0 },
    { key: 'review', label: '回访评价' },
    { key: 'cost', label: '费用归集' },
    { key: 'satisfaction', label: '满意度' }
  ]
  return baseTabs
})

const canAssign = computed(() => {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role) &&
    !['COMPLETED', 'REVIEWED', 'CLOSED'].includes(workOrder.value?.status)
})

const canUpdateMaterial = computed(() => {
  return user.value && ['ENGINEER', 'OPERATOR', 'ADMIN'].includes(user.value.role) &&
    !['CLOSED'].includes(workOrder.value?.status)
})

const canUpdateProgress = computed(() => {
  return user.value && !['CLOSED'].includes(workOrder.value?.status)
})

const canReview = computed(() => {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role)
})

const canManageCost = computed(() => {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role)
})

const canSubmitSatisfaction = computed(() => {
  return user.value?.role === 'TENANT' &&
    ['COMPLETED', 'REVIEWED'].includes(workOrder.value?.status) &&
    user.value.tenantId === workOrder.value?.tenantId
})

const canClose = computed(() => {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role) &&
    ['COMPLETED', 'REVIEWED'].includes(workOrder.value?.status)
})

const totalMaterialCost = computed(() => {
  if (!workOrder.value?.materials) return 0
  return workOrder.value.materials.reduce((sum: number, m: any) => sum + parseFloat(m.totalPrice), 0)
})

const totalCost = computed(() => {
  return (costForm.materialCost || 0) + (costForm.laborCost || 0) + (costForm.otherCost || 0)
})

const isOverdue = computed(() => {
  if (!workOrder.value?.deadline) return false
  return new Date() > new Date(workOrder.value.deadline)
})

onMounted(async () => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  await Promise.all([
    loadDetail(),
    loadEngineers()
  ])
})

async function loadDetail() {
  try {
    const res: any = await useApiFetch(`/workorders/${id.value}`)
    if (res.code === 200) {
      workOrder.value = res.data
    }
  } catch (e) {
    // ignore
  }
}

async function loadEngineers() {
  try {
    const res: any = await useApiFetch('/users/engineers')
    if (res.code === 200) {
      engineers.value = res.data
    }
  } catch (e) {
    // ignore
  }
}

async function handleAssign() {
  if (!assignForm.assigneeId) return
  try {
    const res: any = await useApiFetch(`/workorders/${id.value}/assign`, {
      method: 'POST',
      body: assignForm
    })
    if (res.code === 200) {
      showAssignModal.value = false
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleAddMaterial() {
  try {
    const res: any = await useApiFetch(`/workorders/${id.value}/material`, {
      method: 'POST',
      body: materialForm
    })
    if (res.code === 200) {
      showMaterialModal.value = false
      Object.assign(materialForm, {
        name: '',
        specification: '',
        quantity: 1,
        unit: '',
        unitPrice: 0,
        remark: ''
      })
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleUpdateProgress() {
  try {
    const res: any = await useApiFetch(`/workorders/${id.value}/progress`, {
      method: 'POST',
      body: progressForm
    })
    if (res.code === 200) {
      showProgressModal.value = false
      Object.assign(progressForm, {
        status: '',
        description: '',
        progressPercent: 0
      })
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleReview() {
  try {
    const res: any = await useApiFetch(`/workorders/${id.value}/review`, {
      method: 'POST',
      body: reviewForm
    })
    if (res.code === 200) {
      showReviewModal.value = false
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleCost() {
  try {
    const res: any = await useApiFetch(`/workorders/${id.value}/cost`, {
      method: 'POST',
      body: costForm
    })
    if (res.code === 200) {
      showCostModal.value = false
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleSatisfaction() {
  try {
    const res: any = await useApiFetch('/satisfaction', {
      method: 'POST',
      body: {
        ...satisfactionForm,
        workOrderId: id.value,
        tenantId: workOrder.value.tenantId,
        sourceType: 'WORK_ORDER',
        sourceId: id.value
      }
    })
    if (res.code === 200) {
      showSatisfactionModal.value = false
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleClose() {
  if (!confirm('确定要结案此工单吗？结案后将无法修改。')) return
  try {
    const res: any = await useApiFetch(`/workorders/${id.value}/close`, {
      method: 'POST'
    })
    if (res.code === 200) {
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

function getStatusLabel(status: string) {
  const map: any = {
    PENDING: '待处理',
    ASSIGNED: '已派工',
    IN_PROGRESS: '处理中',
    MATERIAL_NEEDED: '待材料',
    COMPLETED: '已完成',
    REVIEWED: '已回访',
    CLOSED: '已结案',
    OVERDUE: '已超期'
  }
  return map[status] || status
}

function getStatusClass(status: string) {
  const map: any = {
    PENDING: 'status-pending',
    ASSIGNED: 'status-pending',
    IN_PROGRESS: 'status-processing',
    MATERIAL_NEEDED: 'status-pending',
    COMPLETED: 'status-completed',
    REVIEWED: 'status-completed',
    CLOSED: 'status-closed',
    OVERDUE: 'status-overdue'
  }
  return map[status] || ''
}

function getTypeLabel(type: string) {
  const map: any = {
    REPAIR: '维修',
    MAINTENANCE: '维护',
    INSTALLATION: '安装',
    CONSULTING: '咨询',
    OTHER: '其他'
  }
  return map[type] || type
}

function getPriorityLabel(priority: string) {
  const map: any = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    URGENT: '紧急'
  }
  return map[priority] || priority
}

function getPriorityClass(priority: string) {
  const map: any = {
    LOW: 'tag-blue',
    MEDIUM: 'tag-orange',
    HIGH: 'tag-red',
    URGENT: 'tag-red'
  }
  return map[priority] || ''
}

function getAssignmentStatus(status: string) {
  const map: any = {
    PENDING: '待接受',
    ACCEPTED: '已接受',
    REJECTED: '已拒绝',
    COMPLETED: '已完成'
  }
  return map[status] || status
}

function formatTime(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.text-right {
  text-align: right;
}
</style>
