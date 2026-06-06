@extends('admin.layouts.app')

@section('title', '支付流水')

@section('content')
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
            <p class="text-gray-500 text-sm">总交易金额</p>
            <p class="text-2xl font-bold text-gray-800 mt-1">¥{{ number_format($summary['total'], 2) }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
            <p class="text-gray-500 text-sm">成功支付</p>
            <p class="text-2xl font-bold text-green-600 mt-1">¥{{ number_format($summary['success'], 2) }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
            <p class="text-gray-500 text-sm">退款金额</p>
            <p class="text-2xl font-bold text-red-600 mt-1">¥{{ number_format(abs($summary['refunded']), 2) }}</p>
        </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm">
        <div class="p-6 border-b border-gray-200">
            <form method="GET" class="flex flex-wrap gap-4 items-end">
                <div>
                    <label class="block text-sm text-gray-600 mb-1">支付状态</label>
                    <select name="status" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">全部</option>
                        <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>待支付</option>
                        <option value="success" {{ request('status') == 'success' ? 'selected' : '' }}>支付成功</option>
                        <option value="failed" {{ request('status') == 'failed' ? 'selected' : '' }}>支付失败</option>
                        <option value="refunded" {{ request('status') == 'refunded' ? 'selected' : '' }}>已退款</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1">交易类型</label>
                    <select name="type" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">全部</option>
                        <option value="booking" {{ request('type') == 'booking' ? 'selected' : '' }}>预约支付</option>
                        <option value="fine" {{ request('type') == 'fine' ? 'selected' : '' }}>违停罚款</option>
                        <option value="refund" {{ request('type') == 'refund' ? 'selected' : '' }}>退款</option>
                    </select>
                </div>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <i class="ri-search-line mr-1"></i> 筛选
                </button>
                <a href="{{ route('admin.property.payments') }}" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    重置
                </a>
            </form>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">交易流水号</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">关联订单</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">用户</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">类型</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">金额</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">方式</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">状态</th>
                        <th class="text-left py-3 px-6 text-sm font-medium text-gray-500">时间</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @foreach($payments as $payment)
                        <tr class="hover:bg-gray-50">
                            <td class="py-4 px-6 text-sm font-mono text-gray-800">{{ $payment->transaction_no }}</td>
                            <td class="py-4 px-6 text-sm text-gray-600">
                                {{ $payment->booking?->booking_no ?? '-' }}
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-600">{{ $payment->user?->name ?? '-' }}</td>
                            <td class="py-4 px-6">
                                <span class="px-2 py-1 text-xs rounded-full
                                    @if($payment->type == 'booking') bg-blue-100 text-blue-700
                                    @elseif($payment->type == 'fine') bg-orange-100 text-orange-700
                                    @else bg-red-100 text-red-700 @endif">
                                    @if($payment->type == 'booking') 预约支付
                                    @elseif($payment->type == 'fine') 违停罚款
                                    @else 退款 @endif
                                </span>
                            </td>
                            <td class="py-4 px-6 text-sm font-medium {{ $payment->amount < 0 ? 'text-red-600' : 'text-gray-800' }}">
                                ¥{{ number_format($payment->amount, 2) }}
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-600">
                                @if($payment->method == 'wechat') 微信支付
                                @elseif($payment->method == 'alipay') 支付宝
                                @elseif($payment->method == 'cash') 现金
                                @elseif($payment->method == 'card') 银行卡
                                @else 余额支付 @endif
                            </td>
                            <td class="py-4 px-6">
                                <span class="px-2 py-1 text-xs rounded-full
                                    @if($payment->status == 'success') bg-green-100 text-green-700
                                    @elseif($payment->status == 'pending') bg-yellow-100 text-yellow-700
                                    @elseif($payment->status == 'failed') bg-red-100 text-red-700
                                    @else bg-gray-100 text-gray-700 @endif">
                                    @if($payment->status == 'success') 成功
                                    @elseif($payment->status == 'pending') 待支付
                                    @elseif($payment->status == 'failed') 失败
                                    @elseif($payment->status == 'refunded') 已退款
                                    @else 部分退款 @endif
                                </span>
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-500">
                                {{ $payment->paid_at?->format('Y-m-d H:i') ?? $payment->created_at->format('Y-m-d H:i') }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="p-6 border-t border-gray-200">
            {{ $payments->links() }}
        </div>
    </div>
@endsection
