@extends('admin.layouts.app')

@section('title', '违停记录')

@section('content')
    <div class="bg-white rounded-xl shadow-sm">
        <div class="p-6 border-b border-gray-200 flex justify-between items-center">
            <form method="GET" class="flex flex-wrap gap-4 items-end">
                <div>
                    <label class="block text-sm text-gray-600 mb-1">状态</label>
                    <select name="status" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">全部</option>
                        <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>待确认</option>
                        <option value="confirmed" {{ request('status') == 'confirmed' ? 'selected' : '' }}>已确认</option>
                        <option value="appealed" {{ request('status') == 'appealed' ? 'selected' : '' }}>申诉中</option>
                        <option value="paid" {{ request('status') == 'paid' ? 'selected' : '' }}>已缴费</option>
                        <option value="cancelled" {{ request('status') == 'cancelled' ? 'selected' : '' }}>已取消</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">车牌</label>
                    <input type="text" name="license_plate" value="{{ request('license_plate') }}" placeholder="输入车牌"
                           class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="flex items-center gap-2">
                    <input type="checkbox" name="has_appeal" id="has_appeal" value="1" {{ request('has_appeal') ? 'checked' : '' }}
                           class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                    <label for="has_appeal" class="text-sm text-gray-600">有申诉</label>
                </div>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <i class="ri-search-line mr-1"></i> 筛选
                </button>
                <a href="{{ route('admin.property.violations') }}" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    重置
                </a>
            </form>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">违停编号</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">车牌</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">车位</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">违停类型</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">罚款金额</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">申诉状态</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">状态</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">时间</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @foreach($violations as $violation)
                        <tr class="hover:bg-gray-50">
                            <td class="py-4 px-6 text-sm font-mono text-gray-800">{{ $violation->violation_no }}</td>
                            <td class="py-4 px-6 text-sm font-medium text-gray-800">{{ $violation->license_plate }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ $violation->spot?->spot_number ?? '-' }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">
                                @if($violation->type == 'no_booking') 无预约停车
                                @elseif($violation->type == 'overtime') 超时停车
                                @elseif($violation->type == 'wrong_spot') 车位错误
                                @else 未授权车辆 @endif
                            </td>
                            <td class="py-4 px-6 text-sm font-medium text-red-600">¥{{ number_format($violation->fine_amount, 2) }}</td>
                            <td class="py-4 px-6">
                                @if($violation->has_appeal)
                                    <span class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                                        申诉中
                                        @if($violation->isUnderAppealLock())
                                            <span class="text-xs">(锁定中)</span>
                                        @endif
                                    </span>
                                @else
                                    <span class="text-gray-400 text-sm">无</span>
                                @endif
                            </td>
                            <td class="py-4 px-6">
                                <span class="px-2 py-1 text-xs rounded-full
                                    @if($violation->status == 'pending') bg-yellow-100 text-yellow-700
                                    @elseif($violation->status == 'confirmed') bg-blue-100 text-blue-700
                                    @elseif($violation->status == 'appealed') bg-purple-100 text-purple-700
                                    @elseif($violation->status == 'paid') bg-green-100 text-green-700
                                    @else bg-gray-100 text-gray-700 @endif">
                                    @if($violation->status == 'pending') 待确认
                                    @elseif($violation->status == 'confirmed') 已确认
                                    @elseif($violation->status == 'appealed') 申诉中
                                    @elseif($violation->status == 'paid') 已缴费
                                    @else 已取消 @endif
                                </span>
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-500">
                                {{ $violation->violation_time->format('Y-m-d H:i') }}
                            </td>
                            <td class="py-4 px-6">
                                @if($violation->status == 'pending')
                                    <form method="POST" action="{{ route('admin.property.violations.confirm', $violation->id) }}" class="inline">
                                        @csrf
                                        <button type="submit" class="text-blue-600 hover:text-blue-800 text-sm">确认</button>
                                    </form>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="p-6 border-t border-gray-200">
            {{ $violations->links() }}
        </div>
    </div>
@endsection
