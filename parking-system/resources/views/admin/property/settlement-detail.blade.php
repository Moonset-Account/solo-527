@extends('admin.layouts.app')

@section('title', '结算详情')

@section('content')
    <div class="mb-4">
        <a href="{{ route('admin.property.settlements') }}" class="text-blue-600 hover:text-blue-800 text-sm">
            <i class="ri-arrow-left-line mr-1"></i> 返回结算列表
        </a>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="lg:col-span-2">
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">结算单 {{ $settlement->settlement_no }}</h3>
                        <p class="text-gray-500 mt-1">
                            结算周期：{{ $settlement->period_start->format('Y-m-d') }} ~ {{ $settlement->period_end->format('Y-m-d') }}
                        </p>
                    </div>
                    <span class="px-3 py-1 text-sm rounded-full
                        @if($settlement->status == 'completed') bg-green-100 text-green-700
                        @elseif($settlement->status == 'pending') bg-yellow-100 text-yellow-700
                        @else bg-red-100 text-red-700 @endif">
                        @if($settlement->status == 'pending') 待结算
                        @elseif($settlement->status == 'processing') 处理中
                        @elseif($settlement->status == 'completed') 已完成
                        @else 失败 @endif
                    </span>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <p class="text-gray-500 text-sm">业主</p>
                        <p class="font-medium text-gray-800 mt-1">{{ $settlement->owner?->name ?? '-' }}</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <p class="text-gray-500 text-sm">订单总数</p>
                        <p class="font-medium text-gray-800 mt-1">{{ $settlement->total_bookings }} 单</p>
                    </div>
                    <div class="p-4 bg-amber-50 rounded-lg">
                        <p class="text-amber-600 text-sm">人工介入次数</p>
                        <p class="font-bold text-amber-700 mt-1">{{ $settlement->manual_intervention_count }} 次</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <p class="text-gray-500 text-sm">结算时间</p>
                        <p class="font-medium text-gray-800 mt-1">
                            {{ $settlement->settled_at?->format('Y-m-d H:i') ?? '-' }}
                        </p>
                    </div>
                </div>

                <h4 class="font-semibold text-gray-800 mb-4">结算明细</h4>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
                                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">关联订单/违停</th>
                                <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">金额</th>
                                <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">业主分成</th>
                                <th class="text-right py-3 px-4 text-sm font-medium text-gray-500">平台分成</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            @foreach($settlement->items as $item)
                                <tr>
                                    <td class="py-3 px-4">
                                        <span class="px-2 py-1 text-xs rounded-full
                                            @if($item->type == 'booking_income') bg-green-100 text-green-700
                                            @elseif($item->type == 'fine') bg-orange-100 text-orange-700
                                            @elseif($item->type == 'refund') bg-red-100 text-red-700
                                            @else bg-blue-100 text-blue-700 @endif">
                                            @if($item->type == 'booking_income') 订单收入
                                            @elseif($item->type == 'fine') 违停罚款
                                            @elseif($item->type == 'refund') 退款
                                            @elseif($item->type == 'platform_fee') 平台服务费
                                            @else 调整 @endif
                                        </span>
                                    </td>
                                    <td class="py-3 px-4 text-sm text-gray-600 font-mono">
                                        {{ $item->booking?->booking_no ?? $item->violation?->violation_no ?? '-' }}
                                    </td>
                                    <td class="py-3 px-4 text-sm text-right font-medium {{ $item->amount < 0 ? 'text-red-600' : 'text-gray-800' }}">
                                        ¥{{ number_format($item->amount, 2) }}
                                    </td>
                                    <td class="py-3 px-4 text-sm text-right text-green-600">
                                        ¥{{ number_format($item->owner_share, 2) }}
                                    </td>
                                    <td class="py-3 px-4 text-sm text-right text-blue-600">
                                        ¥{{ number_format($item->platform_share, 2) }}
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div>
            <div class="bg-white rounded-xl shadow-sm p-6 sticky top-6">
                <h4 class="font-semibold text-gray-800 mb-4">金额汇总</h4>
                <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-gray-100">
                        <span class="text-gray-600">订单总金额</span>
                        <span class="font-medium">¥{{ number_format($settlement->total_booking_amount, 2) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-100">
                        <span class="text-gray-600">业主总收益</span>
                        <span class="font-medium text-green-600">¥{{ number_format($settlement->total_owner_earning, 2) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-100">
                        <span class="text-gray-600">平台服务费</span>
                        <span class="font-medium text-blue-600">¥{{ number_format($settlement->total_platform_fee, 2) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-100">
                        <span class="text-gray-600">退款金额</span>
                        <span class="font-medium text-red-600">-¥{{ number_format($settlement->total_refund, 2) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-100">
                        <span class="text-gray-600">违停罚款分成</span>
                        <span class="font-medium text-orange-600">+¥{{ number_format($settlement->total_fine_income, 2) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 mt-2">
                        <span class="font-semibold text-gray-800">实际结算金额</span>
                        <span class="text-xl font-bold text-green-600">¥{{ number_format($settlement->net_settlement, 2) }}</span>
                    </div>
                </div>

                @if($settlement->remark)
                    <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p class="text-sm text-gray-500">备注</p>
                        <p class="text-sm text-gray-700 mt-1">{{ $settlement->remark }}</p>
                    </div>
                @endif
            </div>
        </div>
    </div>
@endsection
