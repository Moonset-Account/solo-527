<script setup>
import { ref, computed } from 'vue';
import { useForm, usePage } from '@inertiajs/vue3';
import StatusBadge from '@/Components/StatusBadge.vue';

const page = usePage();

const form = useForm({
    project_id: '',
    statement_file: null,
});

const isDragOver = ref(false);
const uploadedFile = ref(null);
const previewData = ref([]);
const uploadStatus = ref('idle');

const projects = computed(() => page.props.projects || []);

const handleDragOver = (e) => {
    e.preventDefault();
    isDragOver.value = true;
};

const handleDragLeave = () => {
    isDragOver.value = false;
};

const handleDrop = (e) => {
    e.preventDefault();
    isDragOver.value = false;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
};

const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
};

const handleFileSelect = (file) => {
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
    ];

    if (!allowedTypes.includes(file.type)) {
        alert('请上传 Excel 或 CSV 格式的文件');
        return;
    }

    uploadedFile.value = file;
    form.statement_file = file;
    uploadStatus.value = 'uploading';

    simulatePreview();
};

const simulatePreview = () => {
    setTimeout(() => {
        previewData.value = [
            {
                id: 1,
                project_name: '智慧城市一期项目',
                planned_amount: 500000,
                actual_amount: 500000,
                payment_date: '2026-06-15',
                status: 'matched',
                remark: '金额一致',
            },
            {
                id: 2,
                project_name: '数据分析平台',
                planned_amount: 300000,
                actual_amount: 280000,
                payment_date: '2026-06-10',
                status: 'amount_mismatch',
                remark: '金额差异: -20,000',
            },
            {
                id: 3,
                project_name: 'ERP系统升级',
                planned_amount: 800000,
                actual_amount: null,
                payment_date: '2026-06-05',
                status: 'missing_record',
                remark: '缺失银行记录',
            },
            {
                id: 4,
                project_name: '移动端应用开发',
                planned_amount: 250000,
                actual_amount: 250000,
                payment_date: '2026-06-18',
                status: 'date_mismatch',
                remark: '到账日期延迟3天',
            },
        ];
        uploadStatus.value = 'preview';
    }, 1500);
};

const stats = computed(() => {
    if (previewData.value.length === 0) {
        return { total: 0, matched: 0, mismatched: 0, missing: 0 };
    }

    return {
        total: previewData.value.length,
        matched: previewData.value.filter((d) => d.status === 'matched').length,
        mismatched: previewData.value.filter((d) => d.status === 'amount_mismatch' || d.status === 'date_mismatch').length,
        missing: previewData.value.filter((d) => d.status === 'missing_record').length,
    };
});

const handleSubmit = () => {
    uploadStatus.value = 'submitting';

    form.post(route('statement.upload'), {
        preserveScroll: true,
        onSuccess: () => {
            uploadStatus.value = 'success';
        },
        onError: () => {
            uploadStatus.value = 'error';
        },
    });
};

const handleReset = () => {
    uploadedFile.value = null;
    previewData.value = [];
    uploadStatus.value = 'idle';
    form.reset();
};

const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
    }).format(value);
};
</script>

<template>
    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-gray-900">上传对账单</h1>
                <p class="mt-1 text-sm text-gray-600">上传银行对账单，系统将自动识别并与系统记录进行对账</p>
            </div>

            <div class="space-y-6">
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">选择项目</h2>
                        <div class="max-w-md">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                对账项目
                            </label>
                            <select
                                v-model="form.project_id"
                                class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="">请选择对账项目</option>
                                <option v-for="project in projects" :key="project.id" :value="project.id">
                                    {{ project.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                <div
                    class="bg-white overflow-hidden shadow-sm sm:rounded-lg"
                    :class="{ 'ring-2 ring-primary-500': isDragOver }"
                >
                    <div class="p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">上传文件</h2>

                        <div
                            v-if="uploadStatus === 'idle' || !uploadedFile"
                            @dragover="handleDragOver"
                            @dragleave="handleDragLeave"
                            @drop="handleDrop"
                            :class="[
                                'border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
                                isDragOver
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50',
                            ]"
                        >
                            <input
                                type="file"
                                @change="handleFileInput"
                                accept=".xlsx,.xls,.csv"
                                class="hidden"
                                id="file-upload"
                            />
                            <label for="file-upload" class="cursor-pointer">
                                <svg
                                    :class="[
                                        'mx-auto h-12 w-12 transition-colors',
                                        isDragOver ? 'text-primary-500' : 'text-gray-400',
                                    ]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="1.5"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <p class="mt-4 text-sm font-medium text-gray-900">
                                    {{ isDragOver ? '释放以上传文件' : '拖拽文件到此处，或点击选择文件' }}
                                </p>
                                <p class="mt-2 text-xs text-gray-500">支持 Excel (.xlsx, .xls) 和 CSV 格式</p>
                            </label>
                        </div>

                        <div v-else-if="uploadStatus === 'uploading'" class="text-center py-12">
                            <svg class="animate-spin h-12 w-12 text-primary-600 mx-auto" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p class="mt-4 text-sm font-medium text-gray-900">正在解析文件...</p>
                        </div>

                        <div v-else class="border border-gray-200 rounded-lg p-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="flex-shrink-0">
                                        <svg class="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium text-gray-900">{{ uploadedFile?.name }}</p>
                                        <p class="text-xs text-gray-500">
                                            {{ (uploadedFile?.size / 1024 / 1024).toFixed(2) }} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    @click="handleReset"
                                    class="text-sm text-red-600 hover:text-red-500 font-medium"
                                >
                                    移除文件
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="previewData.length > 0" class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-lg font-semibold text-gray-900">对账预览</h2>
                            <div class="flex gap-4">
                                <div class="text-center">
                                    <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
                                    <p class="text-xs text-gray-500">总记录数</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-2xl font-bold text-green-600">{{ stats.matched }}</p>
                                    <p class="text-xs text-gray-500">已匹配</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-2xl font-bold text-yellow-600">{{ stats.mismatched }}</p>
                                    <p class="text-xs text-gray-500">有差异</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-2xl font-bold text-red-600">{{ stats.missing }}</p>
                                    <p class="text-xs text-gray-500">缺失记录</p>
                                </div>
                            </div>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目名称</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">应收金额</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实收金额</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">到账日期</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr
                                        v-for="row in previewData"
                                        :key="row.id"
                                        :class="{
                                            'bg-yellow-50': row.status === 'amount_mismatch' || row.status === 'date_mismatch',
                                            'bg-red-50': row.status === 'missing_record',
                                        }"
                                    >
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {{ row.project_name }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatCurrency(row.planned_amount) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatCurrency(row.actual_amount) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {{ row.payment_date }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge v-if="row.status === 'matched'" status="confirmed" size="sm" />
                                            <StatusBadge v-else :status="row.status" size="sm" />
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {{ row.remark }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                @click="handleReset"
                                class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                            >
                                重新上传
                            </button>
                            <button
                                type="button"
                                @click="handleSubmit"
                                :disabled="uploadStatus === 'submitting'"
                                class="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                            >
                                <svg v-if="uploadStatus === 'submitting'" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                确认提交
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
