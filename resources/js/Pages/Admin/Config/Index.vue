<script setup>
import { Link, useForm, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'

const props = defineProps({
    events: Array,
    selectedEvent: Object,
    filters: Object,
    records: Object,
    log_names: Array,
    causers: Array,
    stats: Object,
})

const selectedEventId = ref(props.selectedEvent?.id || props.events?.[0]?.id)
const switchEvent = (eid) => {
    selectedEventId.value = eid
    router.get(route('admin.config.index'), { event_id: eid }, { preserveState: true })
}

const activeTab = ref('toggles')
const tabs = [
    { key: 'toggles', label: '功能开关', icon: 'fa-toggle-on' },
    { key: 'sessions', label: '场次管理', icon: 'fa-calendar-day' },
    { key: 'seats', label: '座位配置', icon: 'fa-chair' },
]

const toggleForm = useForm({
    event_id: selectedEventId.value,
    config_key: '',
    config_value: false,
    title: '',
})

const saveToggle = (key, label) => {
    toggleForm.config_key = key
    toggleForm.title = label
    toggleForm.event_id = selectedEventId.value
    toggleForm.post(route('admin.config.feature-toggle'))
}

const sessionForm = useForm({
    event_id: selectedEventId.value,
    name: '',
    venue: '',
    start_time: '',
    end_time: '',
    speaker: '',
    agenda: '',
    capacity: 0,
    seat_count: 0,
    sort_order: 0,
    is_active: true,
})

const addSession = () => {
    sessionForm.event_id = selectedEventId.value
    sessionForm.post(route('admin.config.sessions.store'))
}

const seatForm = useForm({
    event_id: selectedEventId.value,
    session_id: null,
    zone: 'A',
    row: '1',
    seat_no: '1',
    price: 0,
    level: 'normal',
    status: 'available',
    remark: '',
    batch_count: 10,
    batch_start_no: 1,
})

const batchAddSeats = () => {
    seatForm.event_id = selectedEventId.value
    seatForm.post(route('admin.config.seats.store'))
}

const fmt = (n) => Number(n || 0).toLocaleString()
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">配置管理</h1>
                <p class="text-sm text-gray-500 mt-1">功能开关、场次座位、退款、反馈、操作日志</p>
            </div>
            <div class="flex items-center gap-3">
                <select :value="selectedEventId" @change="switchEvent($event.target.value)" class="select-field w-72">
                    <option value="">全局</option>
                    <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
                </select>
                <Link :href="route('admin.config.refunds.index', selectedEventId ? { event_id: selectedEventId } : {})" class="btn-secondary">
                    <i class="fas fa-money-bill-transfer mr-2"></i>退款申请
                </Link>
                <Link :href="route('admin.config.feedbacks.index', selectedEventId ? { event_id: selectedEventId } : {})" class="btn-secondary">
                    <i class="fas fa-comments mr-2"></i>到场反馈
                </Link>
                <Link :href="route('admin.config.logs.index')" class="btn-secondary">
                    <i class="fas fa-file-lines mr-2"></i>操作日志
                </Link>
            </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="border-b border-gray-200 px-2">
                <nav class="flex gap-1 -mb-px">
                    <button
                        v-for="tab in tabs"
                        :key="tab.key"
                        @click="activeTab = tab.key"
                        :class="[
                            'px-5 py-4 text-sm font-medium border-b-2 transition inline-flex items-center gap-2',
                            activeTab === tab.key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        ]"
                    >
                        <i :class="['fas', tab.icon]"></i>{{ tab.label }}
                    </button>
                </nav>
            </div>

            <div v-show="activeTab === 'toggles'" class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <template v-for="[key, label, description, current] in [
                        ['enable_online_registration', '开启线上报名', '允许外部用户自主提交报名资料', props.feature_toggles?.enable_online_registration],
                        ['enable_payment', '开启在线支付', '允许报名费在线支付（需配置支付参数）', props.feature_toggles?.enable_payment],
                        ['enable_auto_check_in', '开启自动签到', '到场时根据手机号等信息自动完成签到', props.feature_toggles?.enable_auto_check_in],
                        ['enable_auto_score', '开启自动质量评分', '报名提交后自动计算质量分数和等级', props.feature_toggles?.enable_auto_score],
                        ['enable_duplicate_detection', '开启重复检测', '自动检测重复占座/人员并生成待办', props.feature_toggles?.enable_duplicate_detection],
                        ['enable_notification', '开启消息通知', '处理人指派/退款审核等事件推送通知', props.feature_toggles?.enable_notification],
                        ['show_attendance_stats', '显示到场统计', '看板和报表中展示到场率相关指标', props.feature_toggles?.show_attendance_stats],
                        ['allow_self_feedback', '允许自助提交反馈', '参会人员扫码提交到场反馈', props.feature_toggles?.allow_self_feedback],
                    ]" :key="key">
                        <div class="border border-gray-200 rounded-xl p-4 hover:border-indigo-100 transition">
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium text-gray-900">{{ label }}</span>
                                        <span :class="['badge !px-1.5 !text-[10px]', current ? 'badge-success' : 'badge-gray']">
                                            {{ current ? '已启用' : '已关闭' }}
                                        </span>
                                    </div>
                                    <div class="text-xs text-gray-500 mt-1">{{ description }}</div>
                                    <div v-if="props.toggle_configs?.[key]" class="text-[11px] text-gray-400 mt-2">
                                        <i class="fas fa-clock mr-1"></i>{{ props.toggle_configs[key].updated_at?.slice(5, 16) }}
                                        <span v-if="props.toggle_configs[key].updated_by" class="ml-2"><i class="fas fa-user mr-1"></i>{{ props.toggle_configs[key].updated_by }}</span>
                                    </div>
                                </div>
                                <button
                                    @click="saveToggle(key, label)"
                                    :class="[
                                        'relative w-12 h-7 rounded-full transition flex-shrink-0',
                                        current ? 'bg-indigo-500' : 'bg-gray-200'
                                    ]"
                                >
                                    <span
                                        :class="[
                                            'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform',
                                            current ? 'translate-x-5' : 'translate-x-0.5'
                                        ]"
                                    ></span>
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <div v-show="activeTab === 'sessions'" class="p-6 space-y-6">
                <div class="card border-0 !bg-gray-50">
                    <div class="card-body !p-5">
                        <h3 class="text-sm font-semibold text-gray-900 mb-4"><i class="fas fa-plus mr-2 text-indigo-500"></i>新增场次</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div><label class="block text-xs font-medium text-gray-500 mb-1.5">场次名称 *</label><input v-model="sessionForm.name" class="input-field" placeholder="主论坛/分论坛A" /></div>
                            <div><label class="block text-xs font-medium text-gray-500 mb-1.5">分会场</label><input v-model="sessionForm.venue" class="input-field" placeholder="一楼宴会厅" /></div>
                            <div><label class="block text-xs font-medium text-gray-500 mb-1.5">开始时间</label><input v-model="sessionForm.start_time" type="datetime-local" class="input-field" /></div>
                            <div><label class="block text-xs font-medium text-gray-500 mb-1.5">结束时间</label><input v-model="sessionForm.end_time" type="datetime-local" class="input-field" /></div>
                            <div><label class="block text-xs font-medium text-gray-500 mb-1.5">主讲嘉宾</label><input v-model="sessionForm.speaker" class="input-field" /></div>
                            <div class="md:col-span-2"><label class="block text-xs font-medium text-gray-500 mb-1.5">议程</label><input v-model="sessionForm.agenda" class="input-field" /></div>
                            <div class="flex items-end gap-2">
                                <div class="flex-1"><label class="block text-xs font-medium text-gray-500 mb-1.5">容量</label><input v-model.number="sessionForm.capacity" type="number" class="input-field" /></div>
                                <div class="flex-1"><label class="block text-xs font-medium text-gray-500 mb-1.5">座位数</label><input v-model.number="sessionForm.seat_count" type="number" class="input-field" /></div>
                                <button @click="addSession" :disabled="sessionForm.processing" class="btn-primary !whitespace-nowrap">
                                    <i v-if="sessionForm.processing" class="fas fa-spinner fa-spin mr-2"></i>
                                    <i v-else class="fas fa-plus mr-1"></i>添加
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="text-sm font-semibold text-gray-900 mb-3">已有场次（{{ props.sessions?.length || 0 }}）</h3>
                    <div v-if="!props.sessions?.length" class="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
                        <i class="fas fa-calendar-day text-4xl mb-2 opacity-30"></i><div>暂无场次</div>
                    </div>
                    <div v-else class="space-y-3">
                        <div v-for="s in props.sessions" :key="s.id" class="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <div class="flex items-center gap-2">
                                    <span :class="['badge', s.is_active ? 'badge-success' : 'badge-gray']">{{ s.is_active ? '启用' : '停用' }}</span>
                                    <span class="font-semibold text-gray-900">{{ s.name }}</span>
                                </div>
                                <div class="text-xs text-gray-500 mt-1">{{ s.venue || '未指定' }} · {{ s.start_time?.slice(5, 16) }} - {{ s.end_time?.slice(11, 16) }}</div>
                                <div class="text-xs text-gray-500 mt-1">座位：{{ s.seats_count }}/{{ s.seat_count }} · 容量 {{ s.capacity }} · 排序 {{ s.sort_order }}</div>
                                <div v-if="s.updated_by" class="text-[11px] text-gray-400 mt-1">最近修改：{{ s.updated_by }} @ {{ s.updated_at?.slice(5, 16) }}</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button class="btn-secondary !py-1 !px-3 text-xs"><i class="fas fa-edit mr-1"></i>编辑</button>
                                <button class="btn-secondary !py-1 !px-3 text-xs text-rose-600 hover:!bg-rose-50"><i class="fas fa-trash mr-1"></i>删除</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-show="activeTab === 'seats'" class="p-6 space-y-6">
                <div class="card border-0 !bg-gray-50">
                    <div class="card-body !p-5">
                        <h3 class="text-sm font-semibold text-gray-900 mb-4"><i class="fas fa-chair mr-2 text-emerald-500"></i>批量生成座位</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-gray-500 mb-1.5">所属场次</label>
                                <select v-model="seatForm.session_id" class="select-field">
                                    <option :value="null">无场次</option>
                                    <option v-for="s in props.sessions" :key="s.id" :value="s.id">{{ s.name }}</option>
                                </select>
                            </div>
                            <div><label class="block text-xs font-medium text-gray-500 mb-1.5">区域</label><input v-model="seatForm.zone" class="input-field" placeholder="A/B/C/VIP" /></div>
                            <div><label class="block text-xs font-medium text-gray-500 mb-1.5">排号</label><input v-model="seatForm.row" class="input-field" /></div>
                            <div>
                                <label class="block text-xs font-medium text-gray-500 mb-1.5">座位等级</label>
                                <select v-model="seatForm.level" class="select-field">
                                    <option value="normal">普通</option>
                                    <option value="vip">VIP</option>
                                    <option value="vvip">VVIP</option>
                                    <option value="guest">嘉宾</option>
                                </select>
                            </div>
                            <div><label class="block text-xs font-medium text-gray-500 mb-1.5">起始座位号</label><input v-model.number="seatForm.batch_start_no" type="number" class="input-field" /></div>
                            <div><label class="block text-xs font-medium text-gray-500 mb-1.5">生成数量</label><input v-model.number="seatForm.batch_count" type="number" min="1" max="500" class="input-field" /></div>
                            <div><label class="block text-xs font-medium text-gray-500 mb-1.5">单价（元）</label><input v-model.number="seatForm.price" type="number" class="input-field" /></div>
                            <div class="flex items-end gap-2">
                                <select v-model="seatForm.status" class="select-field flex-1">
                                    <option value="available">可用</option>
                                    <option value="locked">锁定</option>
                                    <option value="reserved">预留</option>
                                </select>
                                <button @click="batchAddSeats" :disabled="seatForm.processing" class="btn-primary">
                                    <i v-if="seatForm.processing" class="fas fa-spinner fa-spin mr-2"></i>
                                    <i v-else class="fas fa-plus mr-1"></i>批量生成
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-sm font-semibold text-gray-900">座位列表（展示前200条）</h3>
                        <span class="text-xs text-gray-500">{{ props.seats?.length || 0 }} 条记录</span>
                    </div>
                    <div v-if="!props.seats?.length" class="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
                        <i class="fas fa-chair text-4xl mb-2 opacity-30"></i><div>暂无座位，请使用上方批量生成</div>
                    </div>
                    <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                        <div
                            v-for="seat in props.seats"
                            :key="seat.id"
                            class="border rounded-lg p-2 text-xs text-center transition hover:shadow-sm"
                            :class="[
                                seat.status === 'available' ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50' :
                                seat.status === 'sold' || seat.status === 'reserved' ? 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50' :
                                seat.status === 'locked' ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50' :
                                'border-gray-200 bg-gray-50/30 hover:bg-gray-50'
                            ]"
                        >
                            <div class="flex items-center justify-center gap-1">
                                <span
                                    :class="[
                                        'w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white',
                                        seat.level === 'vvip' ? 'bg-rose-500' :
                                        seat.level === 'vip' ? 'bg-amber-500' :
                                        seat.level === 'guest' ? 'bg-violet-500' : 'bg-sky-500'
                                    ]"
                                >{{ seat.zone }}{{ seat.row }}</span>
                                <span class="font-bold">{{ seat.seat_no }}</span>
                            </div>
                            <div class="text-[10px] text-gray-500 mt-1 truncate" :title="seat.session_name">{{ seat.session_name || '通用' }}</div>
                            <div class="text-[10px] font-semibold mt-1" :class="[
                                seat.status === 'available' ? 'text-emerald-600' :
                                seat.status === 'sold' ? 'text-indigo-600' :
                                seat.status === 'locked' ? 'text-amber-600' :
                                seat.status === 'disabled' ? 'text-gray-400' : 'text-violet-600'
                            ]">{{ seat.price > 0 ? '¥' + seat.price : seat.status.toUpperCase() }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
