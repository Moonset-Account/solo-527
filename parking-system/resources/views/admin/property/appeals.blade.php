@extends('admin.layouts.app')

@section('title', '违停申诉')

@section('content')
    <div class="bg-white rounded-xl shadow-sm">
        <div class="p-6 border-b border-gray-200">
            <form method="GET" class="flex flex-wrap gap-4 items-end">
                <div>
                    <label class="block text-sm text-gray-600 mb-1">状态</label>
                    <select name="status" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">全部</option>
                        <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>待审核</option>
                        <option value="reviewing" {{ request('status') == 'reviewing' ? 'selected' : '' }}>审核中</option>
                        <option value="approved" {{ request('status') == 'approved' ? 'selected' : '' }}>申诉通过</option>
                        <option value="rejected" {{ request('status') == 'rejected' ? 'selected' : '' }}>申诉驳回</option>
                    </select>
                </div>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <i class="ri-search-line mr-1"></i> 筛选
                </button>
                <a href="{{ route('admin.property.appeals') }}" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    重置
                </a>
            </form>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">申诉编号</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">关联违停</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">申诉人</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">申诉理由</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">证据附件</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">审核人</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">状态</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">提交时间</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @foreach($appeals as $appeal)
                        <tr class="hover:bg-gray-50">
                            <td class="py-4 px-6 text-sm font-mono text-gray-800">{{ $appeal->appeal_no }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">
                                {{ $appeal->violation?->violation_no ?? '-' }}
                                <br>
                                <span class="text-xs text-gray-400">{{ $appeal->violation?->license_plate ?? '' }}</span>
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ $appeal->appellant?->name ?? '-' }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600 max-w-xs truncate" title="{{ $appeal->reason }}">
                                {{ Str::limit($appeal->reason, 50) }}
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-600">
                                @if($appeal->evidence_attachments && count($appeal->evidence_attachments) > 0)
                                    <span class="text-blue-600">{{ count($appeal->evidence_attachments) }} 个附件</span>
                                @else
                                    <span class="text-gray-400">无</span>
                                @endif
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ $appeal->reviewer?->name ?? '-' }}</td>
                            <td class="py-4 px-6">
                                <span class="px-2 py-1 text-xs rounded-full
                                    @if($appeal->status == 'pending' || $appeal->status == 'reviewing') bg-yellow-100 text-yellow-700
                                    @elseif($appeal->status == 'approved') bg-green-100 text-green-700
                                    @elseif($appeal->status == 'rejected') bg-red-100 text-red-700
                                    @else bg-gray-100 text-gray-700 @endif">
                                    @if($appeal->status == 'pending') 待审核
                                    @elseif($appeal->status == 'reviewing') 审核中
                                    @elseif($appeal->status == 'approved') 申诉通过
                                    @elseif($appeal->status == 'rejected') 申诉驳回
                                    @else 已取消 @endif
                                </span>
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-500">
                                {{ $appeal->created_at->format('Y-m-d H:i') }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="p-6 border-t border-gray-200">
            {{ $appeals->links() }}
        </div>
    </div>
@endsection
