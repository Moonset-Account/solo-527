@extends('admin.layouts.app')

@section('title', '结算管理')

@section('content')
    <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div class="flex items-center gap-3">
            <i class="ri-information-line text-amber-600 text-xl"></i>
            <div>
                <p class="text-amber-800 font-medium">累计人工介入次数：<span class="font-bold">{{ $totalManualInterventions }} 次</span></p>
                <p class="text-amber-600 text-sm">人工介入包括：保安补录车牌、修正识别、人工放行等操作</p>
            </div>
        </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm">
        <div class="p-6 border-b border-gray-200 flex justify-between items-center">
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
                    <label class="block text-sm text-gray-600 mb-1">状态</label>
                    <select name="status" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">全部</option>
                        <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>待结算</option>
                        <option value="processing" {{ request('status') == 'processing' ? 'selected' : '' }}>处理中</option>
                        <option value="completed" {{ request('status') == 'completed' ? 'selected' : '' }}>已完成</option>
                        <option value="failed" {{ request('status') == 'failed' ? 'selected' : '' }}>失败</option>
                    </select>
                </div>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <i class="ri-search-line mr-1"></i> 筛选
                </button>
                <a href="{{ route('admin.property.settlements') }}" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    重置
                </a>
            </form>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">结算单号</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">业主</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">结算周期</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">订单数</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">总营收</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">业主收益</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">平台服务费</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">退款</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500 text-amber-600">人工介入</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">实付金额</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">状态</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @foreach($settlements as $settlement)
                        <tr class="hover:bg-gray-50">
                            <td class="py-4 px-6 text-sm font-mono text-gray-800">{{ $settlement->settlement_no }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ $settlement->owner?->name ?? '-' }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">
                                {{ $settlement->period_start->format('Y-m-d') }} ~ {{ $settlement->period_end->format('Y-m-d') }}
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-800">{{ $settlement->total_bookings }} 单</td>
                            <td class="py-4 px-6 text-sm text-gray-800">¥{{ number_format($settlement->total_booking_amount, 2) }}</td>
                            <td class="py-4 px-6 text-sm text-green-600 font-medium">¥{{ number_format($settlement->total_owner_earning, 2) }}</td>
                            <td class="py-4 px-6 text-sm text-blue-600">¥{{ number_format($settlement->total_platform_fee, 2) }}</td>
                            <td class="py-4 px-6 text-sm text-red-600">¥{{ number_format($settlement->total_refund, 2) }}</td>
                            <td class="py-4 px-6 text-sm font-bold text-amber-600 bg-amber-50">
                                {{ $settlement->manual_intervention_count }} 次
                            </td>
                            <td class="py-4 px-6 text-sm font-bold text-gray-800">¥{{ number_format($settlement->net_settlement, 2) }}</td>
                            <td class="py-4 px-6">
                                <span class="px-2 py-1 text-xs rounded-full
                                    @if($settlement->status == 'completed') bg-green-100 text-green-700
                                    @elseif($settlement->status == 'pending') bg-yellow-100 text-yellow-700
                                    @elseif($settlement->status == 'processing') bg-blue-100 text-blue-700
                                    @else bg-red-100 text-red-700 @endif">
                                    @if($settlement->status == 'pending') 待结算
                                    @elseif($settlement->status == 'processing') 处理中
                                    @elseif($settlement->status == 'completed') 已完成
                                    @else 失败 @endif
                                </span>
                            </td>
                            <td class="py-4 px-6">
                                <a href="{{ route('admin.property.settlement-detail', $settlement->id) }}" class="text-blue-600 hover:text-blue-800 text-sm">
                                    详情
                                </a>
                                @if($settlement->status == 'pending')
                                    <form method="POST" action="{{ route('admin.property.settlements.complete', $settlement->id) }}" class="inline ml-2">
                                        @csrf
                                        <button type="submit" class="text-green-600 hover:text-green-800 text-sm">结算</button>
                                    </form>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="p-6 border-t border-gray-200">
            {{ $settlements->links() }}
        </div>
    </div>
@endsection
