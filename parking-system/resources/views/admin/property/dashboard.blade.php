@extends('admin.layouts.app')

@section('title', '仪表盘')

@section('content')
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm">今日预约</p>
                    <p class="text-3xl font-bold text-gray-800 mt-1">{{ $stats['today_bookings'] }}</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="ri-calendar-check-line text-2xl text-blue-600"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm">今日入场</p>
                    <p class="text-3xl font-bold text-gray-800 mt-1">{{ $stats['today_entries'] }}</p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <i class="ri-camera-line text-2xl text-green-600"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm">待处理违停</p>
                    <p class="text-3xl font-bold text-gray-800 mt-1">{{ $stats['pending_violations'] }}</p>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <i class="ri-alarm-warning-line text-2xl text-orange-600"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm">待审核申诉</p>
                    <p class="text-3xl font-bold text-gray-800 mt-1">{{ $stats['pending_appeals'] }}</p>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <i class="ri-file-list-3-line text-2xl text-purple-600"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm">本月营收</p>
                    <p class="text-3xl font-bold text-gray-800 mt-1">¥{{ number_format($stats['month_revenue'], 2) }}</p>
                </div>
                <div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <i class="ri-money-dollar-circle-line text-2xl text-emerald-600"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm">本月人工介入</p>
                    <p class="text-3xl font-bold text-gray-800 mt-1">{{ $stats['manual_interventions'] }} 次</p>
                </div>
                <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <i class="ri-user-settings-line text-2xl text-amber-600"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm">活跃车位</p>
                    <p class="text-3xl font-bold text-gray-800 mt-1">{{ $stats['active_spots'] }}</p>
                </div>
                <div class="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                    <i class="ri-map-pin-line text-2xl text-cyan-600"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm">注册用户</p>
                    <p class="text-3xl font-bold text-gray-800 mt-1">{{ $stats['total_users'] }}</p>
                </div>
                <div class="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <i class="ri-user-line text-2xl text-pink-600"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">最近预约订单</h3>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">订单号</th>
                            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">车位</th>
                            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">车牌</th>
                            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">金额</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($recentBookings as $booking)
                            <tr class="border-b border-gray-100">
                                <td class="py-3 px-4 text-sm text-gray-800 font-mono">{{ $booking->booking_no }}</td>
                                <td class="py-3 px-4 text-sm text-gray-600">{{ $booking->spot?->spot_number }}</td>
                                <td class="py-3 px-4 text-sm text-gray-600">{{ $booking->license_plate }}</td>
                                <td class="py-3 px-4">
                                    <span class="px-2 py-1 text-xs rounded-full
                                        @if($booking->status == 'paid' || $booking->status == 'completed') bg-green-100 text-green-700
                                        @elseif($booking->status == 'pending') bg-yellow-100 text-yellow-700
                                        @elseif($booking->status == 'in_progress') bg-blue-100 text-blue-700
                                        @else bg-gray-100 text-gray-700 @endif">
                                        {{ $booking->status }}
                                    </span>
                                </td>
                                <td class="py-3 px-4 text-sm font-medium text-gray-800">¥{{ $booking->total_amount }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">最近入场记录</h3>
            <div class="space-y-3">
                @foreach($recentEntries as $entry)
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full
                                @if($entry->type == 'entry') bg-green-100 @else bg-red-100 @endif
                                flex items-center justify-center">
                                <i class="text-xl
                                    @if($entry->type == 'entry') ri-arrow-down-line text-green-600
                                    @else ri-arrow-up-line text-red-600 @endif"></i>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">{{ $entry->license_plate }}</p>
                                <p class="text-xs text-gray-500">
                                    {{ $entry->spot?->spot_number ?? '未匹配车位' }}
                                    @if($entry->is_manual || $entry->is_manual_release)
                                        <span class="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">人工</span>
                                    @endif
                                </p>
                            </div>
                        </div>
                        <p class="text-sm text-gray-500">{{ $entry->occurred_at->format('H:i:s') }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
@endsection
