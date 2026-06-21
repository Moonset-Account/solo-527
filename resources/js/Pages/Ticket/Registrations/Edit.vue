<script setup>
import { Link, useForm, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'

const props = defineProps({
    registration: Object,
    events: Array,
    ticket_types: Array,
    sessions: Array,
    selected_session_ids: Array,
})

const form = useForm({
    event_id: props.registration.event_id,
    ticket_type_id: props.registration.ticket_type_id || '',
    name: props.registration.name,
    gender: props.registration.gender || '',
    phone: props.registration.phone,
    email: props.registration.email || '',
    company: props.registration.company || '',
    industry: props.registration.industry || '',
    department: props.registration.department || '',
    position: props.registration.position || '',
    wechat: props.registration.wechat || '',
    id_card: props.registration.id_card || '',
    employee_no: props.registration.employee_no || '',
    source_channel: props.registration.source_channel || '',
    source_detail: props.registration.source_detail || '',
    dietary_requirement: props.registration.dietary_requirement || '',
    remark: props.registration.remark || '',
    session_ids: props.selected_session_ids || [],
})

const save = () => {
    form.put(route('ticket.registrations.update', props.registration.id), {
        onSuccess: () => window.location.href = route('ticket.registrations.show', props.registration.id),
    })
}

const commonIndustries = ['互联网/IT', '金融', '制造', '医疗健康', '教育培训', '零售/消费', '能源/化工', '政府/公共服务', '文化传媒', '房地产', '汽车', '其他']
const commonSources = ['官网报名', '邮件邀请', '合作渠道', '行业社群', '朋友推荐', '线下推广', '社交媒体', '媒体报道', '员工推荐', 'VIP邀请']
</script>

<template>
    <div class="max-w-5xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">编辑报名资料</h1>
                <p class="text-sm text-gray-500 mt-1">{{ registration.registration_no }} · {{ registration.name }}</p>
            </div>
            <div class="flex items-center gap-3">
                <Link :href="route('ticket.registrations.show', registration.id)" class="btn-secondary">取消</Link>
                <button @click="save" :disabled="form.processing" class="btn-primary">
                    <i v-if="form.processing" class="fas fa-spinner fa-spin mr-2"></i>
                    <i v-else class="fas fa-check mr-2"></i>保存修改
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><span>基础信息</span></div>
            <div class="card-body grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">活动</label>
                    <select v-model="form.event_id" class="select-field">
                        <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">票种</label>
                    <select v-model="form.ticket_type_id" class="select-field">
                        <option value="">不指定</option>
                        <option v-for="t in ticket_types" :key="t.id" :value="t.id">{{ t.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">场次（多选）</label>
                    <div class="border border-gray-200 rounded-md p-2 max-h-[100px] overflow-y-auto space-y-1 text-xs">
                        <label v-for="s in sessions" :key="s.id" class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                            <input type="checkbox" :value="s.id" v-model="form.session_ids" class="rounded border-gray-300 text-indigo-600 text-xs">
                            <span class="truncate">{{ s.name }}</span>
                        </label>
                    </div>
                </div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">姓名</label><input v-model="form.name" class="input-field" /></div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">性别</label>
                    <select v-model="form.gender" class="select-field">
                        <option value="">请选择</option><option value="男">男</option><option value="女">女</option>
                    </select>
                </div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">手机号</label><input v-model="form.phone" class="input-field" /></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">邮箱</label><input v-model="form.email" class="input-field" /></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">微信</label><input v-model="form.wechat" class="input-field" /></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">身份证</label><input v-model="form.id_card" class="input-field" /></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">公司</label><input v-model="form.company" class="input-field" /></div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">行业</label>
                    <select v-model="form.industry" class="select-field">
                        <option value="">请选择</option><option v-for="i in commonIndustries" :key="i" :value="i">{{ i }}</option>
                    </select>
                </div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">工号</label><input v-model="form.employee_no" class="input-field" /></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">部门</label><input v-model="form.department" class="input-field" /></div>
                <div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-2">职位</label><input v-model="form.position" class="input-field" /></div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">来源</label>
                    <select v-model="form.source_channel" class="select-field">
                        <option value="">请选择</option><option v-for="s in commonSources" :key="s" :value="s">{{ s }}</option>
                    </select>
                </div>
                <div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-2">来源详情</label><input v-model="form.source_detail" class="input-field" /></div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">饮食</label>
                    <select v-model="form.dietary_requirement" class="select-field">
                        <option value="">无</option><option value="素食">素食</option><option value="清真">清真</option><option value="无辣">无辣</option><option value="过敏">过敏</option>
                    </select>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
                    <textarea v-model="form.remark" rows="2" class="input-field resize-none"></textarea>
                </div>
            </div>
        </div>
    </div>
</template>
