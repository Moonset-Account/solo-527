<script setup>
import { useForm, router } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'

const props = defineProps({
    events: Array,
    ticket_types: Array,
    sessions: Array,
    default_event_id: [String, Number],
})

const form = useForm({
    event_id: props.default_event_id || '',
    ticket_type_id: '',
    name: '',
    gender: '',
    phone: '',
    email: '',
    company: '',
    industry: '',
    department: '',
    position: '',
    wechat: '',
    id_card: '',
    employee_no: '',
    source_channel: '',
    source_detail: '',
    dietary_requirement: '',
    remark: '',
    conversion_stage: 'registered',
    registration_status: 'pending',
    paid_amount: 0,
    paid_at: '',
    owner_id: '',
    session_ids: [],
    custom_fields: {},
})

const selectedEvent = computed(() => props.events?.find(e => String(e.id) === String(form.event_id)))

watch(() => form.event_id, (newVal) => {
    if (newVal) {
        router.get(route('ticket.registrations.create'), { event_id: newVal }, { preserveState: true })
    }
})

const canSubmit = computed(() => !form.processing && form.name && form.phone && form.event_id)

const submit = () => {
    form.post(route('ticket.registrations.store'), {
        onSuccess: () => {},
    })
}

const commonIndustries = ['互联网/IT', '金融', '制造', '医疗健康', '教育培训', '零售/消费', '能源/化工', '政府/公共服务', '文化传媒', '房地产', '汽车', '其他']
const commonSources = ['官网报名', '邮件邀请', '合作渠道', '行业社群', '朋友推荐', '线下推广', '社交媒体', '媒体报道', '员工推荐', 'VIP邀请']
</script>

<template>
    <div class="max-w-5xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">提交报名资料</h1>
                <p class="text-sm text-gray-500 mt-1">请完整填写报名信息，系统将自动进行质量评分和重复检测</p>
            </div>
            <button @click="window.history.back()" class="btn-secondary">
                <i class="fas fa-arrow-left mr-2"></i>返回
            </button>
        </div>

        <form @submit.prevent="submit" class="space-y-6">
            <div class="card">
                <div class="card-header">
                    <span><i class="fas fa-calendar-day mr-2 text-indigo-500"></i>活动与票种</span>
                </div>
                <div class="card-body grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">选择活动 <span class="text-red-500">*</span></label>
                        <select v-model="form.event_id" required class="select-field">
                            <option value="">请选择活动</option>
                            <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">票种</label>
                        <select v-model="form.ticket_type_id" class="select-field">
                            <option value="">不指定票种</option>
                            <option v-for="t in ticket_types" :key="t.id" :value="t.id">{{ t.name }} · ¥{{ t.price }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">参加场次（多选）</label>
                        <div class="border border-gray-200 rounded-md p-3 max-h-[120px] overflow-y-auto space-y-2 text-sm">
                            <label v-for="s in sessions" :key="s.id" class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 rounded">
                                <input type="checkbox" :value="s.id" v-model="form.session_ids" class="rounded border-gray-300 text-indigo-600">
                                <span class="flex-1 truncate">{{ s.name }}</span>
                            </label>
                            <div v-if="!sessions.length" class="text-xs text-gray-400">请先选择活动</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span><i class="fas fa-user mr-2 text-emerald-500"></i>个人信息</span>
                    <span class="text-xs text-gray-500">姓名和手机号为必填</span>
                </div>
                <div class="card-body grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">姓名 <span class="text-red-500">*</span></label>
                        <input v-model="form.name" required placeholder="请输入真实姓名" class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">性别</label>
                        <select v-model="form.gender" class="select-field">
                            <option value="">请选择</option>
                            <option value="男">男</option>
                            <option value="女">女</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">手机号 <span class="text-red-500">*</span></label>
                        <input v-model="form.phone" required placeholder="用于发送通知" class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                        <input v-model="form.email" type="email" placeholder="example@company.com" class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">微信号</label>
                        <input v-model="form.wechat" placeholder="用于会后联系" class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">身份证号</label>
                        <input v-model="form.id_card" placeholder="用于实名签到" class="input-field" />
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span><i class="fas fa-building mr-2 text-sky-500"></i>公司与职位</span>
                    <span class="text-xs text-amber-600"><i class="fas fa-lightbulb mr-1"></i>完整信息有助于提高质量评分</span>
                </div>
                <div class="card-body grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">公司名称</label>
                        <input v-model="form.company" placeholder="请填写完整公司名" class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">所属行业</label>
                        <select v-model="form.industry" class="select-field">
                            <option value="">请选择行业</option>
                            <option v-for="i in commonIndustries" :key="i" :value="i">{{ i }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">工号（企业用户）</label>
                        <input v-model="form.employee_no" class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">所在部门</label>
                        <input v-model="form.department" placeholder="如：市场部/技术部" class="input-field" />
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">职位</label>
                        <input v-model="form.position" placeholder="如：市场总监/高级工程师/CEO（职位影响质量评分）" class="input-field" />
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span><i class="fas fa-tag mr-2 text-violet-500"></i>来源与转化</span>
                </div>
                <div class="card-body grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">来源渠道</label>
                        <select v-model="form.source_channel" class="select-field">
                            <option value="">请选择</option>
                            <option v-for="s in commonSources" :key="s" :value="s">{{ s }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">来源详情</label>
                        <input v-model="form.source_detail" placeholder="如：XX合作伙伴/XX微信群" class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">归属跟进人</label>
                        <input v-model.number="form.owner_id" type="number" placeholder="用户ID" class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">转化阶段</label>
                        <select v-model="form.conversion_stage" class="select-field">
                            <option value="registered">已报名</option>
                            <option value="confirmed">已确认</option>
                            <option value="paid">已支付</option>
                            <option value="inquiry">仅咨询</option>
                            <option value="ticket_sent">已发券</option>
                            <option value="lost">已流失</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">审核状态</label>
                        <select v-model="form.registration_status" class="select-field">
                            <option value="pending">待审核</option>
                            <option value="approved">审核通过</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">实付金额（元）</label>
                        <input v-model.number="form.paid_amount" type="number" min="0" step="0.01" class="input-field" />
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span><i class="fas fa-clipboard mr-2 text-amber-500"></i>其他信息</span>
                </div>
                <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">饮食要求</label>
                        <select v-model="form.dietary_requirement" class="select-field">
                            <option value="">无特殊要求</option>
                            <option value="素食">素食</option>
                            <option value="清真">清真</option>
                            <option value="无辣">无辣</option>
                            <option value="过敏">过敏（请在备注说明）</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">支付时间</label>
                        <input v-model="form.paid_at" type="datetime-local" class="input-field" />
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
                        <textarea v-model="form.remark" rows="3" placeholder="其他需要说明的情况" class="input-field resize-none"></textarea>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-6 sticky bottom-6 shadow-lg">
                <div class="text-xs text-gray-500">
                    <i class="fas fa-circle-info mr-1"></i>
                    提交后系统将自动：<span class="text-indigo-600">生成报名编号</span>、
                    <span class="text-emerald-600">质量评分</span>、
                    <span class="text-amber-600">重复检测</span>
                </div>
                <div class="flex items-center gap-3">
                    <button type="button" @click="window.history.back()" class="btn-secondary">取消</button>
                    <button type="submit" :disabled="!canSubmit" class="btn-primary">
                        <i v-if="form.processing" class="fas fa-spinner fa-spin mr-2"></i>
                        <i v-else class="fas fa-paper-plane mr-2"></i>
                        提交报名资料
                    </button>
                </div>
            </div>
        </form>
    </div>
</template>
