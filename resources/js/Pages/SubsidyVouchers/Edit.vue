<script setup>
import { useForm, usePage, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import { ArrowLeftIcon, PlusIcon, DocumentIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import Input from '../../Components/Input.vue'
import Select from '../../Components/Select.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const voucher = computed(() => page.props.voucher)
const greenhouses = computed(() => page.props.greenhouses || [])
const applicants = computed(() => page.props.applicants || [])
const proofFiles = computed(() => page.props.proofFiles || [])

const fileInputRef = ref(null)

const form = useForm({
    greenhouse_id: voucher.value?.greenhouse_id || '',
    subsidy_type: voucher.value?.subsidy_type || voucher.value?.type || '',
    amount: voucher.value?.amount || '',
    apply_date: voucher.value?.apply_date || '',
    status: voucher.value?.status || 'pending',
    remark: voucher.value?.remark || voucher.value?.description || '',
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

const handleFileUpload = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
        const formData = new FormData()
        Array.from(files).forEach((file) => formData.append('files[]', file))
        router.post(route('subsidy-vouchers.upload', voucher.value.id), formData, {
            forceFormData: true,
            onSuccess: () => {
                if (fileInputRef.value) fileInputRef.value.value = ''
            },
        })
    }
}

const submit = () => {
    form.put(route('subsidy-vouchers.update', voucher.value.id), {
        onSuccess: () => router.visit(route('subsidy-vouchers.show', voucher.value.id)),
    })
}
</script>

<template>
    <AppLayout title="编辑补贴凭证">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit(route('subsidy-vouchers.show', voucher.id))" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回详情
            </Button>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-2">编辑补贴凭证</h2>
                <p class="text-sm text-gray-500 mb-6">凭证号：{{ voucher.voucher_no }}</p>
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

                    <div class="pt-4 border-t border-gray-200">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-sm font-medium text-gray-700">证明文件</h3>
                            <label class="cursor-pointer">
                                <input
                                    ref="fileInputRef"
                                    type="file"
                                    multiple
                                    class="hidden"
                                    @change="handleFileUpload"
                                />
                                <Button variant="outline" size="sm">
                                    <PlusIcon class="w-4 h-4 mr-2" />
                                    上传文件
                                </Button>
                            </label>
                        </div>
                        <div v-if="proofFiles.length === 0" class="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
                            暂无证明文件
                        </div>
                        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div
                                v-for="file in proofFiles"
                                :key="file.id"
                                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <div class="p-2 rounded-lg bg-blue-50">
                                    <DocumentIcon class="w-5 h-5 text-blue-600" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
                                    <p class="text-xs text-gray-500">{{ file.size }}</p>
                                </div>
                                <a :href="file.url" target="_blank" class="text-sm text-blue-600 flex-shrink-0">
                                    查看
                                </a>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button variant="secondary" type="button" @click="router.visit(route('subsidy-vouchers.show', voucher.id))">
                            取消
                        </Button>
                        <Button type="submit" :loading="form.processing">
                            保存
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    </AppLayout>
</template>
