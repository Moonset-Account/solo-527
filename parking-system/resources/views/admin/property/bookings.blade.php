@extends('admin.layouts.app')

@section('title', '订单管理')

@section('content')
    <div class="bg-white rounded-xl shadow-sm">
        <div class="p-6 border-b border-gray-200">
            <form method="GET" class="flex flex-wrap gap-4 items-end">
                <div>
                    <label class="block text-sm text-gray-600 mb-1">状态</label>
                    <select name="status" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">全部</option>
                        <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>待确认</option>
                        <option value="confirmed" {{ request('status') == 'confirmed' ? 'selected' : '' }}>已确认</option>
                        <option value="paid" {{ request('status') == 'paid' ? 'selected' : '' }}>已支付</option>
                        <option value="in_progress" {{ request('status') == 'in_progress' ? 'selected' : '' }}>进行中</option>
                        <option value="completed" {{ request('status') == 'completed' ? 'selected' : '' }}>已完成</option>
                        <option value="cancelled" {{ request('status') == 'cancelled' ? 'selected' : '' }}>已取消</option>
                        <option value="refunded" {{ request('status') == 'refunded' ? 'selected' : '' }}>已退款</option>
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
                <div>
                    <label class="block text-sm text-gray-600 mb-1">车牌</label>
                    <input type="text" name="license_plate" value="{{ request('license_plate') }}" placeholder="输入车牌"
                           class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <i class="ri-search-line mr-1"></i> 筛选
                </button>
                <a href="{{ route('admin.property.bookings') }}" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    重置
                </a>
            </form>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">订单号</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">车位</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">访客</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">车牌</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">时间</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">金额</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">跨午夜</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500 text-amber-600">人工介入</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">支付状态</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">状态</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @foreach($bookings as $booking)
                        <tr class="hover:bg-gray-50">
                            <td class="py-4 px-6 text-sm font-mono text-gray-800">{{ $booking->booking_no }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ $booking->spot?->spot_number ?? '-' }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ $booking->visitor?->name ?? '-' }}</td>
                            <td class="py-4 px-6 text-sm font-medium text-gray-800">{{ $booking->license_plate }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">
                                {{ $booking->start_time->format('m-d H:i') }}
                                <br>
                                <span class="text-gray-400 text-xs">至 {{ $booking->end_time->format('m-d H:i') }}</span>
                            </td>
                            <td class="py-4 px-6 text-sm font-medium text-gray-800">¥{{ number_format($booking->total_amount, 2) }}</td>
                            <td class="py-4 px-6">
                                @if($booking->cross_midnight)
                                    <span class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">是</span>
                                @else
                                    <span class="text-gray-400 text-sm">否</span>
                                @endif
                            </td>
                            <td class="py-4 px-6 text-sm font-bold
                                @if($booking->manual_intervention_count > 0) text-amber-600 bg-amber-50 rounded
                                @else text-gray-400 @endif">
                                {{ $booking->manual_intervention_count }} 次
                            </td>
                            <td class="py-4 px-6">
                                @if($booking->payments->where('status', 'success')->count() > 0)
                                    <span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">已支付</span>
                                @else
                                    <span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">未支付</span>
                                @endif
                            </td>
                            <td class="py-4 px-6">
                                <span class="px-2 py-1 text-xs rounded-full
                                    @if($booking->status == 'paid' || $booking->status == 'completed') bg-green-100 text-green-700
                                    @elseif($booking->status == 'pending' || $booking->status == 'confirmed') bg-yellow-100 text-yellow-700
                                    @elseif($booking->status == 'in_progress') bg-blue-100 text-blue-700
                                    @elseif($booking->status == 'cancelled' || $booking->status == 'refunded') bg-gray-100 text-gray-700
                                    @else bg-red-100 text-red-700 @endif">
                                    @if($booking->status == 'pending') 待确认
                                    @elseif($booking->status == 'confirmed') 已确认
                                    @elseif($booking->status == 'paid') 已支付
                                    @elseif($booking->status == 'in_progress') 进行中
                                    @elseif($booking->status == 'completed') 已完成
                                    @elseif($booking->status == 'cancelled') 已取消
                                    @elseif($booking->status == 'refunded') 已退款
                                    @else 争议中 @endif
                                </span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="p-6 border-t border-gray-200">
            {{ $bookings->links() }}
        </div>
    </div>
@endsection
