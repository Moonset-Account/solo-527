<script setup>
import { useForm } from '@inertiajs/vue3'
import { computed } from 'vue'
import Modal from '../../../Components/Modal.vue'
import Input from '../../../Components/Input.vue'
import Button from '../../../Components/Button.vue'

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    filterData: {
        type: Object,
        default: () => ({}),
    },
    module: {
        type: String,
        default: '',
    },
})

const emit = defineEmits(['close', 'saved'])

const form = useForm({
    name: '',
    is_public: false,
    module: props.module,
    filters: {},
})

const submit = () => {
    form.filters = JSON.parse(JSON.stringify(props.filterData))
    form.post(route('saved-filters.store'), {
        onSuccess: () => {
            form.reset()
            emit('saved')
            emit('close')
        },
    })
}

const handleClose = () => {
    form.reset()
    emit('close')
}
</script>

<template>
    <Modal
        :show="show"
        title="保存筛选条件"
        size="md"
        @close="handleClose"
    >
        <form @submit.prevent="submit" class="space-y-5">
            <Input
                v-model="form.name"
                label="筛选名称"
                placeholder="请输入筛选名称，方便以后使用"
                :error="form.errors.name"
                required
            />

            <div class="flex items-center">
                <input
                    id="is_public"
                    v-model="form.is_public"
                    type="checkbox"
                    class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label for="is_public" class="ml-2 text-sm text-gray-700">
                    对同角色用户公开（其他同角色用户可以使用此筛选）
                </label>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="secondary" type="button" @click="handleClose">
                    取消
                </Button>
                <Button type="submit" :loading="form.processing">
                    保存
                </Button>
            </div>
        </form>
    </Modal>
</template>
