<script setup>
import { useForm, usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import Input from '../../Components/Input.vue'
import Select from '../../Components/Select.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const greenhouses = computed(() => page.props.greenhouses || [])
const applicants = computed(() => page.props.applicants || [])

const form = useForm({
    greenhouse_id: '',
    subsidy_type: '',
    amount: '',
    apply_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    remark: '',
})

const greenhouseOptions = computed(() =>
    greenhouses.value.map((g) => ({ value: g.id, label: g.name }))
)

const typeOptions = [
    { value: 'fertilizer', label: '肥料补贴' },
    { value: 'seed', label: '种子补贴' },
    { value: 'equipment', label: '农机补贴' },
    { value: 'irrigation', label: '灌溉补贴' },
    { value: 'other', label: '其他补贴' },
]

const statusOptions = [
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
    { value: 'paid', label: '已付款' },
]

const submit = () => {
    form.post(route('subsidy-vouchers.store'), {
        onSuccess: () => router.visit(route('subsidy-vouchers.index')),
    })
}
</script>

<template>
    <AppLayout title="新建补贴凭证">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit(route('subsidy-vouchers.index'))" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回列表
            </Button>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-6">申请信息</h2>
                <form @submit.prevent="submit" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select
                            v-model="form.greenhouse_id"
                            label="来源大棚"
                            :options="greenhouseOptions"
                            :error="form.errors.greenhouse_id"
                            required
                        />
                        <Select
                            v-model="form.subsidy_type"
                            label="补贴类型"
                            :options="typeOptions"
                            :error="form.errors.subsidy_type"
                            required
                        />
                        <Input
                            v-model="form.amount"
                            type="number"
                            step="0.01"
                            label="申请金额(元)"
                            placeholder="请输入金额"
                            :error="form.errors.amount"
                            required
                        />
                        <Input
                            v-model="form.apply_date"
                            type="date"
                            label="申请日期"
                            :error="form.errors.apply_date"
                            required
                        />
                        <Select
                            v-model="form.status"
                            label="状态"
                            :options="statusOptions"
                            :error="form.errors.status"
                            required
                        />
                    </div>

                    <div class="pt-4 border-t border-gray-200">
                        <Input
                            v-model="form.remark"
                            label="备注说明"
                            placeholder="请输入补贴说明等备注信息"
                        />
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button variant="secondary" type="button" @click="router.visit(route('subsidy-vouchers.index'))">
                            取消
                        </Button>
                        <Button type="submit" :loading="form.processing">
                            提交申请
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    </AppLayout>
</template>
