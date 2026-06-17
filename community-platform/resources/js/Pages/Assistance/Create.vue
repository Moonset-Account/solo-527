<template>
  <MainLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <Link href="/assistance" class="text-gray-500 hover:text-gray-700">&larr; 返回列表</Link>
        <h1 class="text-2xl font-bold text-gray-900">提交帮扶需求</h1>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标题</label>
            <input v-model="form.title" type="text" class="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea v-model="form.description" rows="4" class="w-full border rounded-md px-3 py-2 text-sm"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
            <input v-model="form.deadline" type="date" class="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div class="flex justify-end">
            <button type="submit" class="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 text-sm" :disabled="form.processing">提交</button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link, useForm } from '@inertiajs/vue3'

const form = useForm({
  title: '',
  description: '',
  deadline: '',
})

const submit = () => {
  form.post('/assistance')
}
</script>
