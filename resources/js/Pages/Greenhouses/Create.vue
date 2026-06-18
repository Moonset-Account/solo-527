<script setup>
import { useForm, usePage, router } from '@inertiajs/vue3'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import Input from '../../Components/Input.vue'
import Select from '../../Components/Select.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const users = page.props.users || []

const form = useForm({
    name: '',
    code: '',
    location: '',
    area: '',
    crop_type: '',
    status: 'active',
    manager_id: '',
})

const cropTypeOptions = [
    { value: 'tomato', label: '番茄' },
    { value: 'cucumber', label: '黄瓜' },
    { value: 'pepper', label: '辣椒' },
    { value: 'lettuce', label: '生菜' },
    { value: 'strawberry', label: '草莓' },
]

const statusOptions = [
    { value: 'active', label: '运行中' },
    { value: 'maintenance', label: '维护中' },
    { value: 'inactive', label: '停用' },
]

const userOptions = users.map((u) => ({ value: u.id, label: u.name }))

const submit = () => {
    form.post(route('greenhouses.store'), {
        onSuccess: () => router.visit('/greenhouses'),
    })
}
</script>

<template>
    <AppLayout title="新增大棚">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit('/greenhouses')" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回列表
            </Button>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-6">大棚信息</h2>
                <form @submit.prevent="submit" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            v-model="form.name"
                            label="大棚名称"
                            placeholder="请输入大棚名称"
                            :error="form.errors.name"
                            required
                        />
                        <Input
                            v-model="form.code"
                            label="大棚编号"
                            placeholder="请输入大棚编号"
                            :error="form.errors.code"
                            required
                        />
                        <Input
                            v-model="form.location"
                            label="位置"
                            placeholder="请输入位置"
                            :error="form.errors.location"
                            required
                        />
                        <Input
                            v-model="form.area"
                            type="number"
                            label="面积(㎡)"
                            placeholder="请输入面积"
                            :error="form.errors.area"
                            required
                        />
                        <Select
                            v-model="form.crop_type"
                            label="作物类型"
                            :options="cropTypeOptions"
                            :error="form.errors.crop_type"
                            required
                        />
                        <Select
                            v-model="form.status"
                            label="状态"
                            :options="statusOptions"
                            :error="form.errors.status"
                            required
                        />
                        <Select
                            v-model="form.manager_id"
                            label="管理员"
                            :options="userOptions"
                            :error="form.errors.manager_id"
                            required
                        />
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button variant="secondary" type="button" @click="router.visit('/greenhouses')">
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
