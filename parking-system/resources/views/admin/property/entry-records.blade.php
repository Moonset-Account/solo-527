@extends('admin.layouts.app')

@section('title', '入场记录')

@section('content')
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
            <p class="text-gray-500 text-sm">累计人工处理</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ $manualStats['total'] }} 次</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
            <p class="text-gray-500 text-sm">今日人工处理</p>
            <p class="text-2xl font-bold text-orange-600 mt-1">{{ $manualStats['today'] }} 次</p>
        </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm">
        <div class="p-6 border-b border-gray-200">
            <form method="GET" class="flex flex-wrap gap-4 items-end">
                <div>
                    <label class="block text-sm text-gray-600 mb-1">开始日期</label>
                    <input type="date" name="start_date" value="{{ request('start_date') }}"
                           class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">结束日期</label>
                    <input type="date" name="end_date" value="{{ request('end_date') }}"
                           class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">类型</label>
                    <select name="type" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">全部</option>
                        <option value="entry" {{ request('type') == 'entry' ? 'selected' : '' }}>入场</option>
                        <option value="exit" {{ request('type') == 'exit' ? 'selected' : '' }}>出场</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">车牌</label>
                    <input type="text" name="license_plate" value="{{ request('license_plate') }}" placeholder="输入车牌"
                           class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="flex items-center gap-2">
                    <input type="checkbox" name="is_manual" id="is_manual" value="1" {{ request('is_manual') ? 'checked' : '' }}
                           class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                    <label for="is_manual" class="text-sm text-gray-600">仅显示人工记录</label>
                </div>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <i class="ri-search-line mr-1"></i> 筛选
                </button>
                <a href="{{ route('admin.property.entry-records') }}" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    重置
                </a>
            </form>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">车牌</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">类型</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">车位</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">关联订单</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">识别方式</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">操作员</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">人工放行</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">时间</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @foreach($records as $record)
                        <tr class="hover:bg-gray-50">
                            <td class="py-4 px-6 text-sm font-medium text-gray-800">{{ $record->license_plate }}</td>
                            <td class="py-4 px-6">
                                <span class="px-2 py-1 text-xs rounded-full
                                    @if($record->type == 'entry') bg-green-100 text-green-700
                                    @else bg-red-100 text-red-700 @endif">
                                    {{ $record->type == 'entry' ? '入场' : '出场' }}
                                </span>
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ $record->spot?->spot_number ?? '-' }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600 font-mono">{{ $record->booking?->booking_no ?? '-' }}</td>
                            <td class="py-4 px-6">
                                <span class="px-2 py-1 text-xs rounded-full
                                    @if($record->recognition_method == 'auto') bg-green-100 text-green-700
                                    @else bg-amber-100 text-amber-700 @endif">
                                    @if($record->recognition_method == 'auto') 自动识别
                                    @elseif($record->recognition_method == 'manual') 人工录入
                                    @else 人工修正 @endif
                                </span>
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ $record->operator?->name ?? '-' }}</td>
                            <td class="py-4 px-6">
                                @if($record->is_manual_release)
                                    <span class="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                                        是
                                        @if($record->release_reason)
                                            <span class="text-xs text-gray-500 ml-1">（{{ $record->release_reason }}）</span>
                                        @endif
                                    </span>
                                @else
                                    <span class="text-gray-400 text-sm">否</span>
                                @endif
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-500">
                                {{ $record->occurred_at->format('Y-m-d H:i:s') }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="p-6 border-t border-gray-200">
            {{ $records->links() }}
        </div>
    </div>
@endsection
