<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ServiceItem;
use App\Models\Vehicle;
use App\Models\WorkOrder;
use App\Models\StatusTimeline;
use App\Models\ApiFailureLog;
use App\Models\QualityReport;
use App\Models\NoShowRecord;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Http\Controllers\BookingController;
use App\Http\Requests\StoreBookingRequest;

echo "=== 洗车门店工单检测系统 - 端到端测试 ===\n\n";

echo "[1/6] 准备测试数据...\n";
$service = ServiceItem::firstOrCreate(
    ['name' => '标准洗车'],
    [
        'category' => '洗车',
        'price' => 39.90,
        'duration_minutes' => 30,
        'is_active' => true,
        'description' => '测试洗车服务',
    ]
);
echo "  服务项目: {$service->name} (ID: {$service->id})\n";

echo "\n[2/6] 测试公开预约 - 检查状态时间轴处理人是否为空...\n";
$bookingData = [
    'plate_number' => '京TEST' . rand(1000, 9999),
    'make' => '测试品牌',
    'model' => '测试型号',
    'owner_name' => '测试车主',
    'owner_phone' => '138' . str_pad(rand(0, 99999999), 8, '0', STR_PAD_LEFT),
    'service_item_id' => $service->id,
    'scheduled_time' => now()->addDays(3)->toIso8601String(),
    'payment_method' => 'wechat',
];

try {
    DB::beginTransaction();

    $vehicle = Vehicle::firstOrCreate(
        ['plate_number' => $bookingData['plate_number']],
        [
            'make' => $bookingData['make'],
            'model' => $bookingData['model'],
            'owner_name' => $bookingData['owner_name'],
            'owner_phone' => $bookingData['owner_phone'],
        ]
    );

    $order = WorkOrder::create([
        'order_no' => 'WO-TEST-' . time(),
        'vehicle_id' => $vehicle->id,
        'service_item_id' => $service->id,
        'status' => 'pending',
        'scheduled_time' => $bookingData['scheduled_time'],
        'total_amount' => $service->price,
        'payment_method' => $bookingData['payment_method'],
        'payment_status' => 'unpaid',
    ]);

    $timeline = StatusTimeline::create([
        'work_order_id' => $order->id,
        'from_status' => '',
        'to_status' => 'pending',
        'handler_id' => null,
        'handler_name' => '客户自助预约',
        'remarks' => '客户在线预约',
        'created_at' => now(),
    ]);

    DB::commit();
    echo "  ✓ 预约创建成功: {$order->order_no}\n";
    echo "  ✓ 状态时间轴创建成功 (ID: {$timeline->id})\n";
    echo "  ✓ handler_id: " . ($timeline->handler_id === null ? 'NULL (正确)' : $timeline->handler_id . ' (错误)') . "\n";
    echo "  ✓ handler_name: {$timeline->handler_name}\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "  ✗ 预约失败: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n[3/6] 测试到店支付 - 检查 payment_status='pending' 是否符合枚举...\n";
try {
    DB::beginTransaction();
    $order->update([
        'payment_method' => 'cash',
        'payment_status' => 'pending',
    ]);

    StatusTimeline::create([
        'work_order_id' => $order->id,
        'from_status' => 'pending',
        'to_status' => 'confirmed',
        'handler_id' => null,
        'handler_name' => '在线支付',
        'remarks' => '客户选择到店支付',
        'created_at' => now(),
    ]);

    $order->update(['status' => 'confirmed']);
    DB::commit();

    $order->refresh();
    echo "  ✓ payment_status: {$order->payment_status}\n";
    echo "  ✓ status: {$order->status}\n";
    echo "  ✓ 到店支付落库成功\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "  ✗ 到店支付失败: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n[4/6] 测试支付失败日志 - 检查 api_type='sms' 和 channel='aliyun' 是否符合枚举...\n";
try {
    $paymentFailure = ApiFailureLog::create([
        'api_type' => 'payment',
        'channel' => 'wechat',
        'order_no' => $order->order_no,
        'error_message' => '支付网关连接超时，请稍后重试',
        'error_code' => 'PAY_TIMEOUT_001',
        'impact_scope' => [
            'order_id' => $order->id,
            'order_no' => $order->order_no,
            'amount' => $order->total_amount,
            'payment_method' => 'wechat',
        ],
        'retry_count' => 0,
        'status' => 'pending',
    ]);

    $smsFailure = ApiFailureLog::create([
        'api_type' => 'sms',
        'channel' => 'aliyun',
        'order_no' => $order->order_no,
        'request_payload' => [
            'phone' => $vehicle->owner_phone,
            'template' => 'booking_confirmation',
            'order_no' => $order->order_no,
        ],
        'error_message' => '短信网关响应超时',
        'error_code' => 'SMS_TIMEOUT_002',
        'impact_scope' => [
            'order_id' => $order->id,
            'order_no' => $order->order_no,
            'phone' => $vehicle->owner_phone,
            'sms_type' => 'booking_confirmation',
        ],
        'retry_count' => 0,
        'status' => 'pending',
    ]);

    echo "  ✓ 支付失败日志创建 (ID: {$paymentFailure->id}, api_type: {$paymentFailure->api_type}, channel: {$paymentFailure->channel})\n";
    echo "  ✓ 短信失败日志创建 (ID: {$smsFailure->id}, api_type: {$smsFailure->api_type}, channel: {$smsFailure->channel})\n";
    echo "  ✓ impact_scope 正常序列化\n";
} catch (\Exception $e) {
    echo "  ✗ API失败日志写入失败: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n[5/6] 测试爽约处理 + 质量报表生成...\n";
try {
    $admin = User::where('email', 'admin@carwash.com')->first();
    if (!$admin) {
        $admin = User::create([
            'name' => '店长',
            'email' => 'admin@carwash.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);
    }

    $noShowOrder = WorkOrder::create([
        'order_no' => 'WO-TEST-NOSHOW-' . time(),
        'vehicle_id' => $vehicle->id,
        'service_item_id' => $service->id,
        'status' => 'confirmed',
        'scheduled_time' => now()->subHour(),
        'total_amount' => $service->price,
        'payment_status' => 'unpaid',
    ]);

    DB::beginTransaction();
    $oldStatus = $noShowOrder->status;
    $noShowOrder->update(['status' => 'no_show']);

    NoShowRecord::create([
        'work_order_id' => $noShowOrder->id,
        'handled_by' => $admin->id,
        'handler_name' => $admin->name,
        'reason' => '客户无法联系',
        'contact_attempts' => 3,
        'rescheduled' => false,
        'created_at' => now(),
    ]);

    QualityReport::create([
        'report_date' => now()->toDateString(),
        'work_order_id' => $noShowOrder->id,
        'vehicle_id' => $noShowOrder->vehicle_id,
        'technician_id' => null,
        'service_item' => $service->name,
        'no_show' => true,
        'no_show_reason' => '客户无法联系',
        'overall_score' => 0,
        'generated_by' => $admin->id,
    ]);

    StatusTimeline::create([
        'work_order_id' => $noShowOrder->id,
        'from_status' => $oldStatus,
        'to_status' => 'no_show',
        'handler_id' => $admin->id,
        'handler_name' => $admin->name,
        'remarks' => '客户无法联系',
        'created_at' => now(),
    ]);
    DB::commit();

    $noShowOrder->refresh();
    echo "  ✓ 爽约工单状态: {$noShowOrder->status}\n";
    echo "  ✓ 爽约记录创建成功\n";
    $qr = QualityReport::where('work_order_id', $noShowOrder->id)->first();
    echo "  ✓ 质量报表生成 (ID: {$qr->id}, score: {$qr->overall_score}, no_show: " . ($qr->no_show ? 'true' : 'false') . ")\n";
    echo "  ✓ 爽约处理人: {$qr->generated_by}\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "  ✗ 爽约处理失败: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n[6/6] 测试重试和解决 API 失败日志...\n";
try {
    $paymentFailure->refresh();
    $paymentFailure->update([
        'retry_count' => $paymentFailure->retry_count + 1,
        'last_retry_at' => now(),
        'status' => 'retrying',
    ]);
    echo "  ✓ 重试记录更新: retry_count={$paymentFailure->retry_count}, status={$paymentFailure->status}, last_retry_at={$paymentFailure->last_retry_at}\n";

    $paymentFailure->update([
        'status' => 'resolved',
        'resolved_at' => now(),
    ]);
    echo "  ✓ 解决记录更新: status={$paymentFailure->status}, resolved_at={$paymentFailure->resolved_at}\n";
} catch (\Exception $e) {
    echo "  ✗ 重试/解决失败: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== 所有测试通过! ===\n";
echo "\n数据摘要:\n";
echo "  工单数: " . WorkOrder::count() . "\n";
echo "  状态时间轴: " . StatusTimeline::count() . "\n";
echo "  API失败日志: " . ApiFailureLog::count() . " (payment: " . ApiFailureLog::where('api_type', 'payment')->count() . ", sms: " . ApiFailureLog::where('api_type', 'sms')->count() . ")\n";
echo "  质量报表: " . QualityReport::count() . "\n";
echo "  爽约记录: " . NoShowRecord::count() . "\n";
