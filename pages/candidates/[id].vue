<template>
  <div v-if="candidate">
    <div class="card mb-6">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-6">
          <div class="w-20 h-20 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-3xl font-bold">
            {{ candidate.name.charAt(0) }}
          </div>
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-bold text-gray-800">{{ candidate.name }}</h2>
              <BadgeTag :text="stageLabels[candidate.currentStage]" :color-class="stageColors[candidate.currentStage]" />
              <BadgeTag :text="candidateStatusLabels[candidate.status]" />
            </div>
            <p class="text-gray-500 mt-1">{{ candidate.position }} · {{ candidate.department }}</p>
            <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>📧 {{ candidate.email }}</span>
              <span v-if="candidate.phone">📱 {{ candidate.phone }}</span>
              <span v-if="candidate.source">📋 来源: {{ candidate.source }}</span>
              <span v-if="candidate.referredBy">🤝 推荐人: {{ candidate.referredBy }}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-3">
          <NuxtLink to="/candidates" class="btn-secondary">返回列表</NuxtLink>
          <button class="btn-secondary" @click="showStageModal = true">变更阶段</button>
          <button class="btn-primary" @click="showInterviewModal = true">安排面试</button>
          <button class="btn-primary" @click="showAssessmentModal = true">开始测评</button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 space-y-6">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>📈</span> 候选人阶段历程
          </h3>
          <div class="relative">
            <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div class="space-y-4">
              <div v-for="(h, idx) in candidate.stageHistory" :key="h.id" class="relative flex gap-4 pl-10">
                <div
                  :class="['absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold',
                    idx === 0 ? 'bg-primary-600' : 'bg-gray-400']"
                >{{ candidate.stageHistory.length - idx }}</div>
                <div class="flex-1 bg-gray-50 rounded-lg p-4">
                  <div class="flex items-center gap-2">
                    <span v-if="h.fromStage" class="text-sm text-gray-500">{{ stageLabels[h.fromStage] }}</span>
                    <span v-if="h.fromStage" class="text-gray-400">→</span>
                    <span class="font-semibold text-gray-800">{{ stageLabels[h.toStage] }}</span>
                  </div>
                  <p v-if="h.reason" class="text-sm text-gray-600 mt-1">原因: {{ h.reason }}</p>
                  <p v-if="h.changedBy" class="text-xs text-gray-400 mt-1">操作人: {{ h.changedBy }} · {{ formatDate(h.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>📝</span> 测评记录 (含前后变化)
          </h3>
          <div v-if="candidate.assessments.length === 0" class="text-center py-8 text-gray-400">暂无测评记录</div>
          <div v-else class="space-y-4">
            <div v-for="a in candidate.assessments" :key="a.id" class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <span class="font-semibold text-gray-800">{{ a.title }}</span>
                  <BadgeTag :text="assessmentTypeLabels[a.type]" />
                  <BadgeTag :text="assessmentStatusLabels[a.status]" />
                </div>
                <span class="text-sm text-gray-500">{{ formatDate(a.createdAt) }}</span>
              </div>

              <div v-if="a.status === 'COMPLETED'" class="grid grid-cols-2 gap-4 mb-3">
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-xs text-gray-500 mb-1">测评前</p>
                  <p class="text-2xl font-bold text-gray-700">{{ a.scoreBefore ?? '-' }} 分</p>
                  <p v-if="a.questionsBefore" class="text-xs text-gray-500 mt-1">
                    题目数: {{ Object.keys(a.questionsBefore).length }}
                  </p>
                </div>
                <div class="bg-primary-50 rounded-lg p-3">
                  <p class="text-xs text-primary-600 mb-1">测评后</p>
                  <p class="text-2xl font-bold text-primary-700">{{ a.scoreAfter ?? '-' }} 分</p>
                  <p v-if="a.questionsAfter" class="text-xs text-primary-600 mt-1">
                    题目数: {{ Object.keys(a.questionsAfter).length }}
                  </p>
                </div>
              </div>

              <div v-if="a.scoreBefore !== null && a.scoreAfter !== null" class="mb-3">
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-gray-500">分数变化:</span>
                  <span :class="['font-semibold', (a.scoreAfter - a.scoreBefore) >= 0 ? 'text-green-600' : 'text-red-600']">
                    {{ (a.scoreAfter - a.scoreBefore) >= 0 ? '+' : '' }}{{ a.scoreAfter - a.scoreBefore }} 分
                  </span>
                </div>
              </div>

              <div v-if="a.questionsBefore || a.questionsAfter" class="mt-3 border-t border-gray-100 pt-3">
                <details>
                  <summary class="cursor-pointer text-sm text-primary-600 hover:text-primary-700">查看题目变化详情</summary>
                  <div class="mt-3 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p class="font-medium text-gray-600 mb-2">测评前题目</p>
                      <pre class="bg-gray-50 rounded p-2 overflow-auto max-h-40 text-gray-700">{{ JSON.stringify(a.questionsBefore, null, 2) }}</pre>
                    </div>
                    <div>
                      <p class="font-medium text-gray-600 mb-2">测评后题目</p>
                      <pre class="bg-gray-50 rounded p-2 overflow-auto max-h-40 text-gray-700">{{ JSON.stringify(a.questionsAfter, null, 2) }}</pre>
                    </div>
                  </div>
                </details>
              </div>

              <p v-if="a.note" class="text-sm text-gray-600 mt-3">💡 {{ a.note }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>🎯</span> 面试记录 (含质量明细)
          </h3>
          <div v-if="candidate.interviews.length === 0" class="text-center py-8 text-gray-400">暂无面试记录</div>
          <div v-else class="space-y-4">
            <div v-for="interview in candidate.interviews" :key="interview.id" class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <span class="font-semibold text-gray-800">{{ interview.title }}</span>
                  <BadgeTag :text="interviewTypeLabels[interview.type]" />
                  <BadgeTag :text="interviewStatusLabels[interview.status]" :color-class="interviewStatusColors[interview.status]" />
                </div>
                <button v-if="interview.status === 'COMPLETED' && !interview.qualityScore" class="btn-secondary text-sm" @click="openQualityModal(interview)">
                  填写质量评估
                </button>
              </div>

              <div class="grid grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <p class="text-gray-500">面试官</p>
                  <p class="font-medium text-gray-700">{{ interview.interviewer?.name }} ({{ interview.interviewer?.department }})</p>
                </div>
                <div>
                  <p class="text-gray-500">时间</p>
                  <p class="font-medium text-gray-700">{{ formatDate(interview.scheduledAt) }}</p>
                </div>
                <div>
                  <p class="text-gray-500">时长</p>
                  <p class="font-medium text-gray-700">{{ interview.durationMin }} 分钟</p>
                </div>
              </div>

              <div v-if="interview.meetingUrl" class="text-sm mb-3">
                <span class="text-gray-500">会议链接: </span>
                <a :href="interview.meetingUrl" target="_blank" class="text-primary-600 hover:underline">{{ interview.meetingUrl }}</a>
              </div>

              <div v-if="interview.qualityScore !== null" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-semibold text-yellow-800">面试质量评估</h4>
                  <div class="flex items-center gap-1">
                    <span v-for="i in 5" :key="i" class="text-xl" :class="i <= interview.qualityScore ? 'text-yellow-500' : 'text-gray-300'">★</span>
                    <span class="ml-2 font-bold text-yellow-800">{{ interview.qualityScore }}/5</span>
                  </div>
                </div>

                <div v-if="interview.qualityDetail" class="grid grid-cols-2 gap-3 mb-3">
                  <div v-for="(score, key) in interview.qualityDetail" :key="key" class="text-sm">
                    <p class="text-yellow-700">{{ qualityDetailLabels[key as string] || key }}: <span class="font-semibold">{{ score }}/5</span></p>
                  </div>
                </div>

                <p v-if="interview.feedback" class="text-sm text-yellow-800">
                  <span class="font-medium">面试官反馈:</span> {{ interview.feedback }}
                </p>
                <p v-if="interview.notes" class="text-sm text-yellow-700 mt-2">
                  <span class="font-medium">备注:</span> {{ interview.notes }}
                </p>
              </div>

              <div v-if="interview.retryLogs && interview.retryLogs.length > 0" class="mt-3 border-t border-gray-100 pt-3">
                <details>
                  <summary class="cursor-pointer text-sm text-red-600 hover:text-red-700">
                    接口重试记录 ({{ interview.retryLogs.length }})
                  </summary>
                  <div class="mt-2 space-y-2">
                    <div v-for="log in interview.retryLogs" :key="log.id" class="text-xs bg-red-50 rounded p-2 border border-red-100">
                      <div class="flex justify-between">
                        <span>{{ log.endpoint }} ({{ log.method }})</span>
                        <span :class="log.isSuccess ? 'text-green-600' : 'text-red-600'">{{ log.isSuccess ? '重试成功' : `重试 ${log.retryCount}/${log.maxRetries}` }}</span>
                      </div>
                      <p class="text-gray-600 mt-1">错误: {{ log.errorMessage || '无' }}</p>
                      <p class="text-gray-400">最后尝试: {{ formatDate(log.lastAttemptAt) }}</p>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>✅</span> 签到记录
          </h3>

          <div v-if="upcomingInterviews.length > 0" class="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p class="text-sm text-blue-700 font-medium mb-3">待签到面试：</p>
            <div class="space-y-3">
              <div v-for="interview in upcomingInterviews" :key="interview.id" class="bg-white rounded-lg p-3 border border-blue-200">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-800">{{ interview.title }}</span>
                  <span class="text-xs text-gray-500">{{ formatDate(interview.scheduledAt) }}</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="type in checkInTypes"
                    :key="`${interview.id}-${type.value}`"
                    class="btn-secondary text-xs"
                    :class="getCheckInBtnClass(type.value)"
                    @click="openCheckInModal(interview, type.value)"
                  >
                    {{ type.icon }} {{ type.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="candidate.checkIns.length === 0" class="text-center py-6 text-gray-400 text-sm">暂无签到记录</div>
          <div v-else class="space-y-3">
            <div v-for="ci in candidate.checkIns" :key="ci.id" class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">
                {{ ci.checkInType === 'CANDIDATE_ARRIVED' ? '🧑' : ci.checkInType === 'INTERVIEWER_READY' ? '👨‍💼' : ci.checkInType === 'COMPLETED' ? '✅' : '❌' }}
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-800">{{ checkInTypeLabels[ci.checkInType] }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ formatDate(ci.checkedAt || ci.createdAt) }}</p>
                <p v-if="ci.location" class="text-xs text-gray-400">📍 {{ ci.location }}</p>
                <p v-if="ci.ipAddress" class="text-xs text-gray-400">IP: {{ ci.ipAddress }}</p>
                <p v-if="ci.note" class="text-xs text-gray-600 mt-1">💬 {{ ci.note }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>⚠️</span> 爽约记录
          </h3>
          <div v-if="candidate.noShows.length === 0" class="text-center py-6 text-gray-400 text-sm">暂无爽约记录</div>
          <div v-else class="space-y-3">
            <div v-for="ns in candidate.noShows" :key="ns.id" class="p-3 bg-red-50 rounded-lg border border-red-100">
              <div class="flex items-center justify-between">
                <BadgeTag :text="ns.isFirstTime ? '首次爽约' : '多次爽约'" :color-class="ns.isFirstTime ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'" />
                <span class="text-xs text-gray-500">{{ formatDate(ns.createdAt) }}</span>
              </div>
              <p v-if="ns.reason" class="text-sm text-gray-700 mt-2">原因: {{ ns.reason }}</p>
              <p v-if="ns.blockingAction" class="text-sm text-red-700 mt-1">
                处置动作: <span class="font-medium">{{ appliedActionLabels[ns.blockingAction] }}</span>
              </p>
              <p v-if="ns.handledBy" class="text-xs text-gray-500 mt-1">处理人: {{ ns.handledBy }}</p>
              <p v-if="ns.note" class="text-xs text-gray-600 mt-1">备注: {{ ns.note }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>🔔</span> 提醒记录
          </h3>
          <div v-if="candidate.reminders.length === 0" class="text-center py-6 text-gray-400 text-sm">暂无提醒</div>
          <div v-else class="space-y-3">
            <div
              v-for="r in candidate.reminders"
              :key="r.id"
              class="p-3 rounded-lg border"
              :class="reminderSeverityColors[r.severity]"
            >
              <div class="flex items-center justify-between">
                <p class="font-medium text-sm">{{ r.title }}</p>
                <BadgeTag :text="reminderSeverityLabels[r.severity]" />
              </div>
              <p class="text-xs mt-1 opacity-80">{{ r.message }}</p>
              <p class="text-xs mt-1 opacity-60">{{ formatDate(r.sendAt) }} · {{ reminderTypeLabels[r.type] }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showStageModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showStageModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">变更候选人阶段</h3>
        <div class="space-y-4">
          <div>
            <label class="label">当前阶段</label>
            <p class="text-gray-700 font-medium">{{ stageLabels[candidate.currentStage] }}</p>
          </div>
          <div>
            <label class="label">目标阶段</label>
            <select v-model="stageForm.toStage" class="input">
              <option v-for="(label, key) in stageLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="label">变更原因</label>
            <textarea v-model="stageForm.reason" class="input" rows="3"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="showStageModal = false">取消</button>
          <button class="btn-primary" @click="handleChangeStage">确认变更</button>
        </div>
      </div>
    </div>

    <div v-if="showInterviewModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showInterviewModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">安排面试</h3>
        <div class="space-y-4">
          <div>
            <label class="label">面试标题</label>
            <input v-model="interviewForm.title" type="text" class="input" />
          </div>
          <div>
            <label class="label">面试类型</label>
            <select v-model="interviewForm.type" class="input">
              <option v-for="(label, key) in interviewTypeLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="label">面试官</label>
            <select v-model="interviewForm.interviewerId" class="input">
              <option value="">请选择</option>
              <option v-for="i in interviewers" :key="i.id" :value="i.id">{{ i.name }} ({{ i.department }})</option>
            </select>
            <button v-if="!interviewers.length" class="text-xs text-primary-600 mt-1" @click="addInterviewer">+ 新增面试官</button>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">面试时间</label>
              <input v-model="interviewForm.scheduledAt" type="datetime-local" class="input" />
            </div>
            <div>
              <label class="label">时长(分钟)</label>
              <input v-model.number="interviewForm.durationMin" type="number" class="input" min="15" step="15" />
            </div>
          </div>
          <div>
            <label class="label">地点 / 会议室</label>
            <input v-model="interviewForm.location" type="text" class="input" />
          </div>
          <div>
            <label class="label">会议链接</label>
            <input v-model="interviewForm.meetingUrl" type="text" class="input" />
          </div>
          <div>
            <label class="label">备注</label>
            <textarea v-model="interviewForm.notes" class="input" rows="2"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="showInterviewModal = false">取消</button>
          <button class="btn-primary" @click="handleCreateInterview">确认安排</button>
        </div>
      </div>
    </div>

    <div v-if="showAssessmentModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showAssessmentModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg">
        <h3 class="text-lg font-semibold mb-4">开始测评</h3>
        <div class="space-y-4">
          <div>
            <label class="label">测评标题</label>
            <input v-model="assessmentForm.title" type="text" class="input" />
          </div>
          <div>
            <label class="label">测评类型</label>
            <select v-model="assessmentForm.type" class="input">
              <option v-for="(label, key) in assessmentTypeLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="label">初始评分(可选)</label>
            <input v-model.number="assessmentForm.scoreBefore" type="number" class="input" min="0" max="100" step="0.5" />
          </div>
          <div>
            <label class="label">题目(前) JSON</label>
            <textarea v-model="assessmentForm.questionsBeforeText" class="input font-mono text-xs" rows="4" placeholder='{"q1": "题目内容"}'></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="showAssessmentModal = false">取消</button>
          <button class="btn-primary" @click="handleCreateAssessment">开始测评</button>
        </div>
      </div>
    </div>

    <div v-if="qualityModalVisible" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="qualityModalVisible = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">面试质量评估 - {{ currentQualityInterview?.title }}</h3>
        <div class="space-y-4">
          <div>
            <label class="label">综合评分 (1-5)</label>
            <input v-model.number="qualityForm.qualityScore" type="number" class="input" min="1" max="5" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="(label, key) in qualityDetailLabels" :key="key">
              <label class="label">{{ label }}</label>
              <input v-model.number="qualityForm.qualityDetail[key]" type="number" class="input" min="1" max="5" />
            </div>
          </div>
          <div>
            <label class="label">面试反馈</label>
            <textarea v-model="qualityForm.feedback" class="input" rows="3"></textarea>
          </div>
          <div>
            <label class="label">备注</label>
            <textarea v-model="qualityForm.notes" class="input" rows="2"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="qualityModalVisible = false">取消</button>
          <button class="btn-primary" @click="handleSaveQuality">保存评估</button>
        </div>
      </div>
    </div>

    <div v-if="showCheckInModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showCheckInModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-2">
          {{ currentCheckInType === 'CANDIDATE_ARRIVED' ? '🧑 候选人签到' :
             currentCheckInType === 'INTERVIEWER_READY' ? '👨‍💼 面试官就绪' :
             currentCheckInType === 'COMPLETED' ? '✅ 完成签到' : '❌ 确认爽约' }}
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          面试：{{ currentCheckInInterview?.title }} · {{ formatDate(currentCheckInInterview?.scheduledAt) }}
        </p>
        <div class="space-y-4">
          <div>
            <label class="label">签到地点</label>
            <input v-model="checkInForm.location" type="text" class="input" placeholder="如：A座3楼会议室301" />
          </div>
          <div>
            <label class="label">IP 地址 (可选)</label>
            <input v-model="checkInForm.ipAddress" type="text" class="input" placeholder="自动获取或手动输入" />
          </div>
          <div>
            <label class="label">备注</label>
            <textarea v-model="checkInForm.note" class="input" rows="2" placeholder="特殊情况说明"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="showCheckInModal = false">取消</button>
          <button class="btn-primary" @click="handleCheckIn">确认签到</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  stageLabels, stageColors, candidateStatusLabels,
  interviewTypeLabels, interviewStatusLabels, interviewStatusColors,
  assessmentTypeLabels, assessmentStatusLabels,
  checkInTypeLabels, reminderTypeLabels, reminderSeverityLabels, reminderSeverityColors,
  appliedActionLabels, formatDate
} from '~/composables/useConstants'
import { useCandidateStore } from '~/stores/candidate'
import { useInterviewStore } from '~/stores/interview'

const route = useRoute()
const candidateStore = useCandidateStore()
const interviewStore = useInterviewStore()

const candidate = computed(() => candidateStore.currentCandidate as any)
const interviewers = computed(() => interviewStore.interviewers)

const showStageModal = ref(false)
const showInterviewModal = ref(false)
const showAssessmentModal = ref(false)
const qualityModalVisible = ref(false)
const currentQualityInterview = ref<any>(null)

const qualityDetailLabels: Record<string, string> = {
  technicalSkill: '技术能力',
  problemSolving: '问题解决',
  communication: '沟通表达',
  cultureFit: '文化匹配'
}

const stageForm = reactive({ toStage: '', reason: '', changedBy: 'admin' })
const interviewForm = reactive({
  title: '', type: 'TECHNICAL', interviewerId: null as number | null,
  scheduledAt: '', durationMin: 60, location: '', meetingUrl: '', notes: ''
})
const assessmentForm = reactive({
  title: '', type: 'CODING', scoreBefore: null as number | null,
  questionsBeforeText: ''
})
const qualityForm = reactive({
  qualityScore: 3,
  qualityDetail: { technicalSkill: 3, problemSolving: 3, communication: 3, cultureFit: 3 } as Record<string, number>,
  feedback: '', notes: ''
})

const checkInTypes = [
  { value: 'CANDIDATE_ARRIVED', label: '候选人到场', icon: '🧑' },
  { value: 'INTERVIEWER_READY', label: '面试官就绪', icon: '👨‍💼' },
  { value: 'COMPLETED', label: '签到完成', icon: '✅' },
  { value: 'NO_SHOW_CONFIRMED', label: '确认爽约', icon: '❌' }
]

const showCheckInModal = ref(false)
const currentCheckInInterview = ref<any>(null)
const currentCheckInType = ref('')
const checkInForm = reactive({
  location: '',
  ipAddress: '',
  note: ''
})

const upcomingInterviews = computed(() => {
  if (!candidate.value?.interviews) return []
  return candidate.value.interviews.filter((i: any) =>
    i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS'
  ).sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
})

function getCheckInBtnClass(type: string) {
  if (type === 'CANDIDATE_ARRIVED') return 'bg-green-100 text-green-700 hover:bg-green-200'
  if (type === 'INTERVIEWER_READY') return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
  if (type === 'COMPLETED') return 'bg-purple-100 text-purple-700 hover:bg-purple-200'
  if (type === 'NO_SHOW_CONFIRMED') return 'bg-red-100 text-red-700 hover:bg-red-200'
  return ''
}

function openCheckInModal(interview: any, type: string) {
  currentCheckInInterview.value = interview
  currentCheckInType.value = type
  checkInForm.location = ''
  checkInForm.ipAddress = ''
  checkInForm.note = ''
  showCheckInModal.value = true
}

async function handleCheckIn() {
  if (!currentCheckInInterview.value || !currentCheckInType.value) return
  try {
    await $fetch('/api/check-ins', {
      method: 'POST',
      body: {
        candidateId: Number(route.params.id),
        interviewId: currentCheckInInterview.value.id,
        checkInType: currentCheckInType.value,
        location: checkInForm.location || '办公室',
        ipAddress: checkInForm.ipAddress || '127.0.0.1',
        note: checkInForm.note
      }
    })
    showCheckInModal.value = false
    candidateStore.fetchCandidate(Number(route.params.id))
  } catch (e: any) {
    alert(e?.statusMessage || '签到失败')
  }
}

function openQualityModal(interview: any) {
  currentQualityInterview.value = interview
  qualityForm.qualityScore = interview.qualityScore || 3
  qualityForm.qualityDetail = interview.qualityDetail || { technicalSkill: 3, problemSolving: 3, communication: 3, cultureFit: 3 }
  qualityForm.feedback = interview.feedback || ''
  qualityForm.notes = interview.notes || ''
  qualityModalVisible.value = true
}

async function handleSaveQuality() {
  if (!currentQualityInterview.value) return
  try {
    await interviewStore.updateInterview(currentQualityInterview.value.id, {
      qualityScore: qualityForm.qualityScore,
      qualityDetail: qualityForm.qualityDetail,
      feedback: qualityForm.feedback,
      notes: qualityForm.notes,
      status: 'COMPLETED'
    })
    qualityModalVisible.value = false
    candidateStore.fetchCandidate(Number(route.params.id))
  } catch (e: any) {
    alert(e?.statusMessage || '保存失败')
  }
}

async function handleChangeStage() {
  try {
    await candidateStore.changeStage(Number(route.params.id), { ...stageForm })
    showStageModal.value = false
    candidateStore.fetchCandidate(Number(route.params.id))
  } catch (e: any) {
    alert(e?.statusMessage || '变更失败')
  }
}

async function handleCreateInterview() {
  if (!interviewForm.title || !interviewForm.interviewerId || !interviewForm.scheduledAt) {
    alert('请填写面试标题、面试官和时间')
    return
  }
  try {
    await interviewStore.createInterview({
      candidateId: Number(route.params.id),
      ...interviewForm,
      interviewerId: Number(interviewForm.interviewerId)
    })
    showInterviewModal.value = false
    candidateStore.fetchCandidate(Number(route.params.id))
  } catch (e: any) {
    alert(e?.statusMessage || '安排失败')
  }
}

async function handleCreateAssessment() {
  if (!assessmentForm.title) {
    alert('请填写测评标题')
    return
  }
  let questionsBefore = null
  if (assessmentForm.questionsBeforeText) {
    try {
      questionsBefore = JSON.parse(assessmentForm.questionsBeforeText)
    } catch {
      alert('题目JSON格式不正确')
      return
    }
  }
  try {
    await $fetch('/api/assessments', {
      method: 'POST',
      body: {
        candidateId: Number(route.params.id),
        title: assessmentForm.title,
        type: assessmentForm.type,
        scoreBefore: assessmentForm.scoreBefore,
        questionsBefore
      }
    })
    showAssessmentModal.value = false
    candidateStore.fetchCandidate(Number(route.params.id))
  } catch (e: any) {
    alert(e?.statusMessage || '创建测评失败')
  }
}

async function addInterviewer() {
  const name = prompt('面试官姓名:')
  const email = prompt('面试官邮箱:')
  const department = prompt('部门:')
  const title = prompt('职位(可选):')
  if (!name || !email || !department) return
  try {
    await interviewStore.createInterviewer({ name, email, department, title })
    interviewStore.fetchInterviewers()
  } catch (e: any) {
    alert(e?.statusMessage || '创建面试官失败')
  }
}

onMounted(async () => {
  await Promise.all([
    candidateStore.fetchCandidate(Number(route.params.id)),
    interviewStore.fetchInterviewers()
  ])
})
</script>
