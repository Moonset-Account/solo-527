<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Project;
use App\Models\ReconciliationStatement;
use App\Models\ReconciliationItem;
use App\Models\ReconciliationDifference;
use App\Models\WriteOff;
use App\Models\CashFlow;
use App\Models\Invoice;
use App\Models\CollectionRecord;
use App\Models\Notification;
use App\Models\PaymentCallback;
use App\Models\AuditLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->createUsers();
        $this->createProjects();
        $this->createReconciliations();
        $this->createDifferences();
        $this->createWriteOffs();
        $this->createCashFlows();
        $this->createInvoices();
        $this->createCollectionRecords();
        $this->createNotifications();
        $this->createPaymentCallbacks();
        $this->createAuditLogs();
    }

    private function createUsers(): void
    {
        $adminUsers = [
            ['name' => '系统管理员', 'email' => 'admin1@example.com'],
            ['name' => '财务主管', 'email' => 'admin2@example.com'],
        ];

        foreach ($adminUsers as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('password123'),
                ]
            );
            $user->assignRole('admin');
        }

        $projectManagerUsers = [
            ['name' => '张三', 'email' => 'pm1@example.com'],
            ['name' => '李四', 'email' => 'pm2@example.com'],
            ['name' => '王五', 'email' => 'pm3@example.com'],
        ];

        foreach ($projectManagerUsers as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('password123'),
                ]
            );
            $user->assignRole('project_manager');
        }
    }

    private function createProjects(): void
    {
        $projectData = [
            ['name' => '智慧城市一期工程', 'customer' => '市政府信息化办公室', 'amount' => 5000000.00, 'project_manager' => '张三'],
            ['name' => '企业ERP系统实施', 'customer' => '恒远科技有限公司', 'amount' => 2800000.00, 'project_manager' => '李四'],
            ['name' => '电商平台升级改造', 'customer' => '盛世商贸集团', 'amount' => 1500000.00, 'project_manager' => '王五'],
            ['name' => '医院信息管理系统', 'customer' => '市中心医院', 'amount' => 3200000.00, 'project_manager' => '张三'],
            ['name' => '教育云平台建设', 'customer' => '市教育局', 'amount' => 4500000.00, 'project_manager' => '李四'],
            ['name' => '金融风控系统开发', 'customer' => '诚信银行', 'amount' => 6800000.00, 'project_manager' => '王五'],
            ['name' => '物流跟踪系统', 'customer' => '快捷物流有限公司', 'amount' => 1200000.00, 'project_manager' => '张三'],
            ['name' => '政府OA系统升级', 'customer' => '市政府办公厅', 'amount' => 2100000.00, 'project_manager' => '李四'],
            ['name' => '智能停车场管理', 'customer' => '城市建设投资集团', 'amount' => 980000.00, 'project_manager' => '王五'],
            ['name' => '大数据分析平台', 'customer' => '数据科技研究院', 'amount' => 3800000.00, 'project_manager' => '张三'],
        ];

        $statuses = [Project::STATUS_ACTIVE, Project::STATUS_COMPLETED, Project::STATUS_SUSPENDED];

        foreach ($projectData as $index => $data) {
            Project::firstOrCreate(
                ['name' => $data['name']],
                array_merge($data, [
                    'description' => $data['name'] . '项目，为客户提供定制化解决方案',
                    'start_date' => now()->subMonths(rand(3, 12)),
                    'end_date' => now()->addMonths(rand(1, 6)),
                    'status' => $statuses[$index % 3],
                ])
            );
        }
    }

    private function createReconciliations(): void
    {
        $adminUser = User::where('email', 'admin1@example.com')->first();
        $pmUser = User::where('email', 'pm1@example.com')->first();
        $projects = Project::all();

        $periods = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'];
        $statuses = [
            ReconciliationStatement::STATUS_COMPLETED,
            ReconciliationStatement::STATUS_COMPLETED,
            ReconciliationStatement::STATUS_PROCESSING,
            ReconciliationStatement::STATUS_COMPLETED,
            ReconciliationStatement::STATUS_PENDING,
        ];

        foreach ($periods as $index => $period) {
            $statement = ReconciliationStatement::create([
                'period' => $period,
                'upload_date' => now()->subMonths(5 - $index),
                'status' => $statuses[$index],
                'uploaded_by' => $index % 2 === 0 ? $adminUser->name : $pmUser->name,
                'file_path' => "/reconciliations/{$period}/statement.xlsx",
                'remarks' => $period . '月份对账单',
            ]);

            $itemCount = rand(3, 6);
            for ($i = 0; $i < $itemCount; $i++) {
                $project = $projects->random();
                $receivable = rand(50000, 500000);
                $received = $receivable - rand(0, 50000);
                $difference = $receivable - $received;

                ReconciliationItem::create([
                    'project_id' => $project->id,
                    'reconciliation_statement_id' => $statement->id,
                    'receivable_amount' => $receivable,
                    'received_amount' => $received,
                    'difference_amount' => $difference,
                    'remarks' => $project->name . ' - ' . $period . '对账明细',
                ]);
            }
        }
    }

    private function createDifferences(): void
    {
        $items = ReconciliationItem::where('difference_amount', '!=', 0)->get();
        $users = User::all();
        $statuses = [
            ReconciliationDifference::STATUS_PENDING,
            ReconciliationDifference::STATUS_PROCESSING,
            ReconciliationDifference::STATUS_RESOLVED,
            ReconciliationDifference::STATUS_WRITE_OFF,
        ];
        $types = [
            ReconciliationDifference::TYPE_PRICE_DIFFERENCE,
            ReconciliationDifference::TYPE_QUANTITY_DIFFERENCE,
            ReconciliationDifference::TYPE_PAYMENT_DELAY,
            ReconciliationDifference::TYPE_OTHER,
        ];

        for ($i = 0; $i < 20; $i++) {
            $item = $items->random();
            $status = $statuses[$i % 4];
            $responsibleUser = $users->random();

            $difference = ReconciliationDifference::create([
                'reconciliation_item_id' => $item->id,
                'difference_type' => $types[$i % 4],
                'amount' => rand(1000, 50000),
                'status' => $status,
                'responsible_person' => $responsibleUser->name,
                'processing_deadline' => now()->addDays(rand(5, 30)),
                'description' => $this->getDifferenceDescription($types[$i % 4]),
                'resolution' => in_array($status, [ReconciliationDifference::STATUS_RESOLVED, ReconciliationDifference::STATUS_WRITE_OFF])
                    ? $this->getResolutionText($status)
                    : null,
                'resolved_at' => in_array($status, [ReconciliationDifference::STATUS_RESOLVED, ReconciliationDifference::STATUS_WRITE_OFF])
                    ? now()->subDays(rand(1, 10))
                    : null,
            ]);
        }
    }

    private function getDifferenceDescription($type): string
    {
        $descriptions = [
            ReconciliationDifference::TYPE_PRICE_DIFFERENCE => '合同价格与实际执行价格存在差异，需要重新核算',
            ReconciliationDifference::TYPE_QUANTITY_DIFFERENCE => '交付数量与合同约定数量不符，需核实',
            ReconciliationDifference::TYPE_PAYMENT_DELAY => '客户付款延迟，正在催收中',
            ReconciliationDifference::TYPE_OTHER => '其他原因导致的差异，待进一步核实',
        ];
        return $descriptions[$type] ?? '差异原因待查';
    }

    private function getResolutionText($status): string
    {
        if ($status === ReconciliationDifference::STATUS_RESOLVED) {
            return '已与客户沟通确认，差异已补付或调整账务';
        }
        if ($status === ReconciliationDifference::STATUS_WRITE_OFF) {
            return '经审批确认无法收回，做坏账冲销处理';
        }
        return '';
    }

    private function createWriteOffs(): void
    {
        $differences = ReconciliationDifference::where('status', ReconciliationDifference::STATUS_WRITE_OFF)->get();
        $adminUsers = User::role('admin')->get();
        $approvalStatuses = [
            WriteOff::APPROVAL_STATUS_APPROVED,
            WriteOff::APPROVAL_STATUS_APPROVED,
            WriteOff::APPROVAL_STATUS_PENDING,
            WriteOff::APPROVAL_STATUS_REJECTED,
        ];

        $reasons = [
            '客户已破产清算，无法收回款项',
            '差异金额较小，追讨成本高于收益',
            '双方协商一致，做豁免处理',
            '账务处理错误，经核实调整',
            '超过诉讼时效，无法通过法律途径追讨',
            '客户经营困难，协议减免部分款项',
            '历史遗留问题，经集体研究决定核销',
            '其他特殊情况，经审批同意冲销',
        ];

        for ($i = 0; $i < 8; $i++) {
            $difference = $differences->isNotEmpty() ? $differences->random() : ReconciliationDifference::inRandomOrder()->first();
            $approver = $adminUsers->random();
            $approvalStatus = $approvalStatuses[$i % 4];

            WriteOff::create([
                'reconciliation_difference_id' => $difference->id,
                'amount' => $difference->amount,
                'reason' => $reasons[$i],
                'approval_status' => $approvalStatus,
                'approved_by' => in_array($approvalStatus, [WriteOff::APPROVAL_STATUS_APPROVED, WriteOff::APPROVAL_STATUS_REJECTED]) ? $approver->name : null,
                'approved_at' => in_array($approvalStatus, [WriteOff::APPROVAL_STATUS_APPROVED, WriteOff::APPROVAL_STATUS_REJECTED]) ? now()->subDays(rand(1, 5)) : null,
                'approval_remarks' => $approvalStatus === WriteOff::APPROVAL_STATUS_APPROVED
                    ? '经审核，符合冲销条件，同意核销'
                    : ($approvalStatus === WriteOff::APPROVAL_STATUS_REJECTED
                        ? '材料不完整，请补充相关证明后重新申请'
                        : null),
            ]);
        }
    }

    private function createCashFlows(): void
    {
        $projects = Project::all();
        $types = [CashFlow::TYPE_INCOME, CashFlow::TYPE_EXPENSE];
        $methods = [
            CashFlow::METHOD_BANK_TRANSFER,
            CashFlow::METHOD_CASH,
            CashFlow::METHOD_CHECK,
            CashFlow::METHOD_ALIPAY,
            CashFlow::METHOD_WECHAT,
            CashFlow::METHOD_OTHER,
        ];

        $incomeRemarks = [
            '项目进度款',
            '项目首付款',
            '项目尾款',
            '合同质保金',
            '技术服务费',
            '维护费收入',
        ];

        $expenseRemarks = [
            '采购设备款',
            '外包服务费',
            '员工差旅费',
            '办公耗材费',
            '技术咨询费',
            '场地租赁费',
        ];

        for ($i = 0; $i < 50; $i++) {
            $project = $projects->random();
            $type = $i < 35 ? CashFlow::TYPE_INCOME : CashFlow::TYPE_EXPENSE;
            $amount = $type === CashFlow::TYPE_INCOME ? rand(10000, 200000) : rand(1000, 50000);
            $remarks = $type === CashFlow::TYPE_INCOME ? $incomeRemarks[array_rand($incomeRemarks)] : $expenseRemarks[array_rand($expenseRemarks)];

            CashFlow::create([
                'project_id' => $project->id,
                'type' => $type,
                'amount' => $amount,
                'transaction_date' => now()->subDays(rand(1, 180)),
                'payment_method' => $methods[array_rand($methods)],
                'transaction_no' => 'TXN' . date('Ymd') . str_pad($i + 1, 6, '0', STR_PAD_LEFT),
                'remarks' => $project->name . ' - ' . $remarks,
            ]);
        }
    }

    private function createInvoices(): void
    {
        $projects = Project::all();
        $statuses = [
            Invoice::STATUS_ISSUED,
            Invoice::STATUS_ISSUED,
            Invoice::STATUS_PENDING,
            Invoice::STATUS_FAILED,
            Invoice::STATUS_VOIDED,
        ];

        $errorMessages = [
            '税号验证失败，请检查客户税号是否正确',
            '发票金额超过单张限额，需拆分开具',
            '客户信息不完整，缺少地址电话',
            '税收分类编码选择错误',
            '发票开具网络异常，请重试',
        ];

        for ($i = 0; $i < 30; $i++) {
            $project = $projects->random();
            $status = $statuses[$i % 5];
            $amount = rand(50000, 500000);
            $taxRate = 0.06;
            $taxAmount = round($amount * $taxRate, 2);

            Invoice::create([
                'project_id' => $project->id,
                'invoice_no' => 'INV' . date('Y') . str_pad($i + 1001, 6, '0', STR_PAD_LEFT),
                'amount' => $amount,
                'issue_date' => now()->subDays(rand(1, 120)),
                'status' => $status,
                'error_message' => $status === Invoice::STATUS_FAILED ? $errorMessages[array_rand($errorMessages)] : null,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'remarks' => $project->name . ' - 技术服务费发票',
            ]);
        }
    }

    private function createCollectionRecords(): void
    {
        $projects = Project::all();
        $users = User::all();
        $methods = [
            CollectionRecord::METHOD_PHONE,
            CollectionRecord::METHOD_EMAIL,
            CollectionRecord::METHOD_VISIT,
            CollectionRecord::METHOD_LETTER,
            CollectionRecord::METHOD_OTHER,
        ];

        $results = [
            '客户承诺本周内付款',
            '客户资金紧张，申请延期一个月',
            '已发送催款函，等待回复',
            '客户提出异议，正在协商解决方案',
            '客户表示已安排付款，预计3个工作日到账',
            '客户拒接电话，需更换联系方式',
            '上门拜访，客户负责人不在',
            '已达成还款协议，分期付款',
        ];

        $contactPersons = ['王经理', '李总', '张财务', '刘主管', '陈主任', '赵总监', '孙经理', '周总'];
        $contactPhones = ['13800138001', '13900139002', '13700137003', '13600136004', '13500135005'];

        for ($i = 0; $i < 40; $i++) {
            $project = $projects->random();
            $collector = $users->random();
            $hasFollowUp = rand(0, 1) === 1;

            CollectionRecord::create([
                'project_id' => $project->id,
                'collection_time' => now()->subDays(rand(1, 90))->setTime(rand(9, 18), rand(0, 59)),
                'method' => $methods[array_rand($methods)],
                'contact_person' => $contactPersons[array_rand($contactPersons)],
                'contact_phone' => $contactPhones[array_rand($contactPhones)],
                'result' => $results[array_rand($results)],
                'next_follow_up' => $hasFollowUp ? now()->addDays(rand(3, 15)) : null,
                'collected_by' => $collector->name,
                'remarks' => $project->customer . ' - 应收账款催收记录',
            ]);
        }
    }

    private function createNotifications(): void
    {
        $users = User::all();
        $types = [
            Notification::TYPE_EMAIL,
            Notification::TYPE_SMS,
            Notification::TYPE_SYSTEM,
            Notification::TYPE_WECHAT,
            Notification::TYPE_APP,
        ];
        $channels = [
            Notification::CHANNEL_SMTP,
            Notification::CHANNEL_ALIYUN,
            Notification::CHANNEL_TENCENT,
            Notification::CHANNEL_WECHAT,
            Notification::CHANNEL_INTERNAL,
        ];
        $statuses = [
            Notification::STATUS_SENT,
            Notification::STATUS_SENT,
            Notification::STATUS_FAILED,
            Notification::STATUS_PENDING,
            Notification::STATUS_RETRYING,
        ];

        $failureReasons = [
            '收件人邮箱地址无效',
            '短信发送频率超限',
            '微信模板消息接口调用失败',
            '连接超时，请检查网络配置',
            'APP推送证书已过期',
        ];

        $contents = [
            '您有一笔新的差异记录待处理',
            '对账单上传成功，正在解析中',
            '冲销申请已通过审批',
            '本月报表已生成，请及时查看',
            '差异处理即将到期，请尽快处理',
            '有新的支付回调需要处理',
            '发票开具失败，请检查并重试',
            '客户付款已到账，请确认',
        ];

        for ($i = 0; $i < 15; $i++) {
            $recipient = $users->random();
            $status = $statuses[$i % 5];
            $retryCount = in_array($status, [Notification::STATUS_FAILED, Notification::STATUS_RETRYING]) ? rand(1, 3) : 0;
            $type = $types[$i % 5];

            Notification::create([
                'type' => $type,
                'content' => $contents[array_rand($contents)],
                'status' => $status,
                'failure_reason' => in_array($status, [Notification::STATUS_FAILED, Notification::STATUS_RETRYING]) ? $failureReasons[array_rand($failureReasons)] : null,
                'retry_count' => $retryCount,
                'recipient' => $type === Notification::TYPE_EMAIL ? $recipient->email : '13800' . str_pad($i, 6, '0', STR_PAD_LEFT),
                'channel' => $channels[$i % 5],
                'sent_at' => $status === Notification::STATUS_SENT ? now()->subDays(rand(1, 30)) : null,
                'metadata' => [
                    'user_id' => $recipient->id,
                    'user_name' => $recipient->name,
                    'notification_id' => 'NOTIFY-' . str_pad($i + 1, 5, '0', STR_PAD_LEFT),
                ],
            ]);
        }
    }

    private function createPaymentCallbacks(): void
    {
        $statuses = [
            PaymentCallback::STATUS_SUCCESS,
            PaymentCallback::STATUS_SUCCESS,
            PaymentCallback::STATUS_SUCCESS,
            PaymentCallback::STATUS_FAILED,
            PaymentCallback::STATUS_PROCESSING,
        ];
        $methods = [
            PaymentCallback::METHOD_BANK_TRANSFER,
            PaymentCallback::METHOD_ALIPAY,
            PaymentCallback::METHOD_WECHAT,
            PaymentCallback::METHOD_UNIONPAY,
            PaymentCallback::METHOD_CASH,
        ];

        $failureReasons = [
            '签名验证失败，请检查密钥配置',
            '订单号不存在，无法匹配',
            '金额与订单不符',
            '回调处理超时',
            '支付状态异常，需人工核实',
        ];

        for ($i = 0; $i < 10; $i++) {
            $status = $statuses[$i % 5];
            $retryCount = $status === PaymentCallback::STATUS_FAILED ? rand(1, 3) : 0;

            PaymentCallback::create([
                'payment_no' => 'PAY' . date('Ymd') . str_pad($i + 1, 8, '0', STR_PAD_LEFT),
                'status' => $status,
                'failure_reason' => $status === PaymentCallback::STATUS_FAILED ? $failureReasons[array_rand($failureReasons)] : null,
                'retry_count' => $retryCount,
                'affected_documents' => [
                    'invoice_no' => 'INV' . date('Y') . str_pad($i + 1001, 6, '0', STR_PAD_LEFT),
                    'project_id' => rand(1, 10),
                ],
                'amount' => rand(50000, 500000),
                'payment_method' => $methods[$i % 5],
                'callback_time' => in_array($status, [PaymentCallback::STATUS_SUCCESS, PaymentCallback::STATUS_FAILED])
                    ? now()->subDays(rand(1, 60))->setTime(rand(9, 18), rand(0, 59))
                    : null,
                'callback_data' => [
                    'trade_no' => 'TRADE' . str_pad($i + 100000, 12, '0', STR_PAD_LEFT),
                    'buyer_account' => 'buyer' . ($i + 1) . '@example.com',
                    'seller_account' => 'seller@company.com',
                ],
                'remarks' => $status === PaymentCallback::STATUS_SUCCESS ? '支付成功，已自动对账' : '需人工处理',
            ]);
        }
    }

    private function createAuditLogs(): void
    {
        $users = User::all();
        $operations = [
            AuditLog::OPERATION_CREATE,
            AuditLog::OPERATION_UPDATE,
            AuditLog::OPERATION_DELETE,
            AuditLog::OPERATION_VIEW,
            AuditLog::OPERATION_EXPORT,
            AuditLog::OPERATION_IMPORT,
            AuditLog::OPERATION_APPROVE,
            AuditLog::OPERATION_REJECT,
            AuditLog::OPERATION_OTHER,
        ];
        $resourceTypes = [
            'Project',
            'ReconciliationStatement',
            'ReconciliationDifference',
            'WriteOff',
            'Invoice',
            'User',
            'CashFlow',
            'CollectionRecord',
        ];

        $changeContents = [
            '{"name":"智慧城市二期","amount":"8000000.00"}',
            '{"status":"completed","end_date":"2026-06-30"}',
            '{"approval_status":"approved","approved_by":"系统管理员"}',
            '{"difference_type":"price_difference","amount":"25000.00"}',
            '{"email":"newuser@example.com","role":"project_manager"}',
        ];

        $ipAddresses = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.25', '127.0.0.1'];
        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.5',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) AppleWebKit/605.1.15',
        ];

        for ($i = 0; $i < 100; $i++) {
            $operator = $users->random();
            $operation = $operations[array_rand($operations)];
            $resourceType = $resourceTypes[array_rand($resourceTypes)];

            AuditLog::create([
                'operator' => $operator->name,
                'operation_type' => $operation,
                'change_content' => in_array($operation, [AuditLog::OPERATION_CREATE, AuditLog::OPERATION_UPDATE])
                    ? $changeContents[array_rand($changeContents)]
                    : json_encode(['action' => $operation, 'description' => $this->getOperationDescription($operation)]),
                'timestamp' => now()->subDays(rand(1, 90))->setTime(rand(8, 20), rand(0, 59), rand(0, 59)),
                'resource_type' => $resourceType,
                'resource_id' => rand(1, 20),
                'ip_address' => $ipAddresses[array_rand($ipAddresses)],
                'user_agent' => $userAgents[array_rand($userAgents)],
                'metadata' => [
                    'user_id' => $operator->id,
                    'request_id' => 'REQ-' . uniqid(),
                    'environment' => 'testing',
                ],
            ]);
        }
    }

    private function getOperationDescription($operation): string
    {
        $descriptions = [
            AuditLog::OPERATION_VIEW => '查看记录详情',
            AuditLog::OPERATION_EXPORT => '导出数据报表',
            AuditLog::OPERATION_IMPORT => '导入数据文件',
            AuditLog::OPERATION_DELETE => '删除记录',
            AuditLog::OPERATION_APPROVE => '审批通过',
            AuditLog::OPERATION_REJECT => '审批拒绝',
            AuditLog::OPERATION_OTHER => '其他操作',
        ];
        return $descriptions[$operation] ?? '未知操作';
    }
}
