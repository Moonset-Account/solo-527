@extends('admin.layouts.app')

@section('title', '车位收益')

@section('content')
    <div class="bg-white rounded-xl shadow-sm">
        <div class="p-6 border-b border-gray-200">
            <form method="GET" class="flex flex-wrap gap-4 items-end">
                <div>
                    <label class="block text-sm text-gray-600 mb-1">业主</label>
                    <select name="owner_id" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">全部业主</option>
                        @foreach($owners as $owner)
                            <option value="{{ $owner->id }}" {{ request('owner_id') == $owner->id ? 'selected' : '' }}>
                                {{ $owner->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
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
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <i class="ri-search-line mr-1"></i> 查询
                </button>
                <a href="{{ route('admin.property.spot-revenue') }}" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    重置
                </a>
            </form>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">车位编号</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">位置</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">业主</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">订单数</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">总营收</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">业主收益</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">状态</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @foreach($spots as $spot)
                        <tr class="hover:bg-gray-50">
                            <td class="py-4 px-6 text-sm font-medium text-gray-800">{{ $spot->spot_number }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ Str::limit($spot->location, 30) }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ $spot->owner?->name ?? '-' }}</td>
                            <td class="py-4 px-6 text-sm text-gray-800">{{ $spot->bookings_count }} 单</td>
                            <td class="py-4 px-6 text-sm font-medium text-gray-800">
                                ¥{{ number_format($spot->bookings_sum_total_amount ?? 0, 2) }}
                            </td>
                            <td class="py-4 px-6 text-sm font-medium text-green-600">
                                ¥{{ number_format($spot->bookings_sum_owner_earning ?? 0, 2) }}
                            </td>
                            <td class="py-4 px-6">
                                <span class="px-2 py-1 text-xs rounded-full
                                    @if($spot->status == 'active') bg-green-100 text-green-700
                                    @elseif($spot->status == 'maintenance') bg-yellow-100 text-yellow-700
                                    @else bg-gray-100 text-gray-700 @endif">
                                    @if($spot->status == 'active') 运营中
                                    @elseif($spot->status == 'maintenance') 维护中
                                    @else 已停用 @endif
                                </span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="p-6 border-t border-gray-200">
            {{ $spots->links() }}
        </div>
    </div>
@endsection
