<?php

namespace App\Services;

use App\Models\ReconciliationDifference;
use App\Models\ReconciliationStatement;
use App\Models\Project;
use App\Models\ProjectInvoice;
use App\Models\ProjectPayment;
use App\Models\WriteOff;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ReportService
{
    public function __construct(
        protected ReconciliationDifference $differenceModel,
        protected ReconciliationStatement $statementModel,
        protected Project $projectModel,
        protected ProjectInvoice $invoiceModel,
        protected ProjectPayment $paymentModel,
        protected WriteOff $writeOffModel,
        protected CashFlowService $cashFlowService
    ) {}

    public function getDifferenceReport(array $filters = []): array
    {
        $query = $this->differenceModel->with([
            'project',
            'statement',
            'responsibleUser',
            'payment',
            'statementItem',
        ]);

        if (! empty($filters['project_id'])) {
            $query->where('project_id', $filters['project_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }

        if (! empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }

        if (! empty($filters['responsible_user_id'])) {
            $query->where('responsible_user_id', $filters['responsible_user_id']);
        }

        $differences = $query->orderBy('created_at', 'desc')->get();

        $summary = [
            'total' => $differences->count(),
            'total_amount' => $differences->sum('difference_amount'),
            'by_status' => $differences->groupBy('status')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'amount' => $group->sum('difference_amount'),
                ];
            }),
            'by_type' => $differences->groupBy('type')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'amount' => $group->sum('difference_amount'),
                ];
            }),
            'by_project' => $differences->groupBy('project_id')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'amount' => $group->sum('difference_amount'),
                    'project_name' => $group->first()->project->name ?? '未知项目',
                ];
            })->sortByDesc('amount'),
            'overdue_count' => $differences->whereNotNull('due_date')->where('due_date', '<', now())->count(),
            'escalated_count' => $differences->whereNotNull('escalated_at')->count(),
        ];

        return [
            'summary' => $summary,
            'differences' => $differences->map(function ($diff) {
                return [
                    'id' => $diff->id,
                    'statement_id' => $diff->statement_id,
                    'project_code' => $diff->project->project_code ?? null,
                    'project_name' => $diff->project->name ?? null,
                    'type' => $diff->type,
                    'type_label' => $this->getTypeLabel($diff->type),
                    'statement_amount' => $diff->statement_amount,
                    'system_amount' => $diff->system_amount,
                    'difference_amount' => $diff->difference_amount,
                    'description' => $diff->description,
                    'status' => $diff->status,
                    'status_label' => $this->getStatusLabel($diff->status),
                    'responsible_user' => $diff->responsibleUser?->name,
                    'due_date' => $diff->due_date?->format('Y-m-d'),
                    'is_overdue' => $diff->due_date && $diff->due_date < now(),
                    'is_escalated' => ! empty($diff->escalated_at),
                    'created_at' => $diff->created_at->format('Y-m-d H:i:s'),
                ];
            }),
        ];
    }

    public function exportReport(array $filters = []): string
    {
        $differenceReport = $this->getDifferenceReport($filters);
        $projectIds = $differenceReport['differences']->pluck('project_id')->unique()->filter();

        $cashFlowData = collect();
        $invoiceErrors = collect();
        $recentChanges = collect();

        foreach ($projectIds as $projectId) {
            $cashFlow = $this->cashFlowService->forecastCashFlow($projectId, 6);
            $cashFlowData = $cashFlowData->merge($cashFlow->map(function ($item) use ($projectId) {
                $project = $this->projectModel->find($projectId);
                return array_merge($item, [
                    'project_code' => $project->project_code ?? null,
                    'project_name' => $project->name ?? null,
                ]);
            }));

            $errors = $this->getInvoiceErrors($projectId);
            $invoiceErrors = $invoiceErrors->merge($errors);

            $changes = $this->getRecentChanges($projectId);
            $recentChanges = $recentChanges->merge($changes);
        }

        $filePath = $this->generateExcelReport(
            $differenceReport['differences'],
            $cashFlowData,
            $invoiceErrors,
            $recentChanges,
            $differenceReport['summary']
        );

        return $filePath;
    }

    protected function getInvoiceErrors(int $projectId): Collection
    {
        return $this->invoiceModel
            ->where('project_id', $projectId)
            ->where(function ($query) {
                $query->where('has_error', true)
                    ->orWhere('status', ProjectInvoice::STATUS_REJECTED)
                    ->orWhereNull('invoice_no');
            })
            ->with('project')
            ->get()
            ->map(function ($invoice) {
                $errorTypes = [];
                if ($invoice->has_error) {
                    $errorTypes[] = '数据错误';
                }
                if ($invoice->status === ProjectInvoice::STATUS_REJECTED) {
                    $errorTypes[] = '已驳回';
                }
                if (empty($invoice->invoice_no)) {
                    $errorTypes[] = '缺少发票号';
                }

                return [
                    'project_code' => $invoice->project->project_code ?? null,
                    'project_name' => $invoice->project->name ?? null,
                    'invoice_id' => $invoice->id,
                    'invoice_no' => $invoice->invoice_no ?? '无',
                    'amount' => $invoice->total_amount,
                    'issue_date' => $invoice->issue_date?->format('Y-m-d'),
                    'error_types' => implode(', ', $errorTypes),
                    'error_description' => $invoice->error_message,
                    'status' => $invoice->status,
                    'created_at' => $invoice->created_at->format('Y-m-d H:i:s'),
                ];
            });
    }

    protected function getRecentChanges(int $projectId): Collection
    {
        $changes = collect();

        $recentDifferences = $this->differenceModel
            ->where('project_id', $projectId)
            ->where('updated_at', '>=', now()->subDays(30))
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($diff) {
                return [
                    'project_code' => $diff->project->project_code ?? null,
                    'project_name' => $diff->project->name ?? null,
                    'change_type' => '差异更新',
                    'record_id' => $diff->id,
                    'old_status' => $this->getStatusLabel($diff->getOriginal('status') ?? ''),
                    'new_status' => $this->getStatusLabel($diff->status),
                    'change_time' => $diff->updated_at->format('Y-m-d H:i:s'),
                    'operator' => $diff->processedBy?->name ?? $diff->confirmedBy?->name ?? '系统',
                    'remark' => $diff->processing_remark ?? $diff->confirmation_remark ?? '',
                ];
            });

        $recentWriteOffs = $this->writeOffModel
            ->where('project_id', $projectId)
            ->where('updated_at', '>=', now()->subDays(30))
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($wo) {
                return [
                    'project_code' => $wo->project->project_code ?? null,
                    'project_name' => $wo->project->name ?? null,
                    'change_type' => '冲销' . $this->getWriteOffStatusLabel($wo->status),
                    'record_id' => $wo->id,
                    'old_status' => '',
                    'new_status' => $this->getWriteOffStatusLabel($wo->status),
                    'change_time' => $wo->updated_at->format('Y-m-d H:i:s'),
                    'operator' => $wo->approvedBy?->name ?? $wo->rejectedBy?->name ?? $wo->createdBy?->name ?? '系统',
                    'remark' => $wo->reason ?? $wo->rejection_reason ?? '',
                ];
            });

        $recentPayments = $this->paymentModel
            ->where('project_id', $projectId)
            ->where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($payment) {
                return [
                    'project_code' => $payment->project->project_code ?? null,
                    'project_name' => $payment->project->name ?? null,
                    'change_type' => '新增付款记录',
                    'record_id' => $payment->id,
                    'old_status' => '',
                    'new_status' => $payment->status,
                    'change_time' => $payment->created_at->format('Y-m-d H:i:s'),
                    'operator' => $payment->createdBy?->name ?? '系统',
                    'remark' => $payment->description,
                ];
            });

        return $changes->merge($recentDifferences)
            ->merge($recentWriteOffs)
            ->merge($recentPayments)
            ->sortByDesc('change_time')
            ->values()
            ->take(50);
    }

    protected function generateExcelReport(
        Collection $differences,
        Collection $cashFlow,
        Collection $invoiceErrors,
        Collection $recentChanges,
        array $summary
    ): string {
        $spreadsheet = new Spreadsheet();

        $this->addSummarySheet($spreadsheet, $summary);
        $this->addDifferencesSheet($spreadsheet, $differences);
        $this->addCashFlowSheet($spreadsheet, $cashFlow);
        $this->addInvoiceErrorsSheet($spreadsheet, $invoiceErrors);
        $this->addRecentChangesSheet($spreadsheet, $recentChanges);

        $fileName = '对账中心报表_' . now()->format('YmdHis') . '.xlsx';
        $filePath = storage_path('exports/' . $fileName);

        if (! is_dir(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }

        $writer = new Xlsx($spreadsheet);
        $writer->save($filePath);

        return $filePath;
    }

    protected function addSummarySheet(Spreadsheet $spreadsheet, array $summary): void
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('汇总');

        $sheet->setCellValue('A1', '对账差异汇总报表');
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);

        $sheet->setCellValue('A3', '统计时间');
        $sheet->setCellValue('B3', now()->format('Y-m-d H:i:s'));

        $sheet->setCellValue('A5', '总差异数');
        $sheet->setCellValue('B5', $summary['total']);
        $sheet->setCellValue('A6', '总差异金额');
        $sheet->setCellValue('B6', $summary['total_amount']);
        $sheet->setCellValue('A7', '超期差异数');
        $sheet->setCellValue('B7', $summary['overdue_count']);
        $sheet->setCellValue('A8', '已升级差异数');
        $sheet->setCellValue('B8', $summary['escalated_count']);

        $sheet->getColumnDimension('A')->setWidth(20);
        $sheet->getColumnDimension('B')->setWidth(20);
    }

    protected function addDifferencesSheet(Spreadsheet $spreadsheet, Collection $differences): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('差异明细');

        $headers = [
            '项目编号', '项目名称', '差异类型', '对账单金额', '系统金额',
            '差异金额', '状态', '责任人', '截止日期', '是否超期', '创建时间', '备注'
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getColumnDimension($col)->setWidth(15);
            $col++;
        }

        $row = 2;
        foreach ($differences as $diff) {
            $sheet->setCellValue('A' . $row, $diff['project_code']);
            $sheet->setCellValue('B' . $row, $diff['project_name']);
            $sheet->setCellValue('C' . $row, $diff['type_label']);
            $sheet->setCellValue('D' . $row, $diff['statement_amount']);
            $sheet->setCellValue('E' . $row, $diff['system_amount']);
            $sheet->setCellValue('F' . $row, $diff['difference_amount']);
            $sheet->setCellValue('G' . $row, $diff['status_label']);
            $sheet->setCellValue('H' . $row, $diff['responsible_user']);
            $sheet->setCellValue('I' . $row, $diff['due_date']);
            $sheet->setCellValue('J' . $row, $diff['is_overdue'] ? '是' : '否');
            $sheet->setCellValue('K' . $row, $diff['created_at']);
            $row++;
        }
    }

    protected function addCashFlowSheet(Spreadsheet $spreadsheet, Collection $cashFlow): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('现金流预测');

        $headers = [
            '项目编号', '项目名称', '月份', '期初余额', '预计流入',
            '预计流出', '净现金流', '期末余额', '风险等级'
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getColumnDimension($col)->setWidth(15);
            $col++;
        }

        $row = 2;
        foreach ($cashFlow as $item) {
            $sheet->setCellValue('A' . $row, $item['project_code'] ?? '');
            $sheet->setCellValue('B' . $row, $item['project_name'] ?? '');
            $sheet->setCellValue('C' . $row, $item['month_name']);
            $sheet->setCellValue('D' . $row, $item['opening_balance']);
            $sheet->setCellValue('E' . $row, $item['incoming']);
            $sheet->setCellValue('F' . $row, $item['outgoing']);
            $sheet->setCellValue('G' . $row, $item['net_cash_flow']);
            $sheet->setCellValue('H' . $row, $item['closing_balance']);
            $sheet->setCellValue('I' . $row, $this->getRiskLabel($item['risk_level']));
            $row++;
        }
    }

    protected function addInvoiceErrorsSheet(Spreadsheet $spreadsheet, Collection $invoiceErrors): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('发票错误');

        $headers = [
            '项目编号', '项目名称', '发票ID', '发票号', '金额',
            '开票日期', '错误类型', '错误描述', '状态', '创建时间'
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getColumnDimension($col)->setWidth(15);
            $col++;
        }

        $row = 2;
        foreach ($invoiceErrors as $error) {
            $sheet->setCellValue('A' . $row, $error['project_code']);
            $sheet->setCellValue('B' . $row, $error['project_name']);
            $sheet->setCellValue('C' . $row, $error['invoice_id']);
            $sheet->setCellValue('D' . $row, $error['invoice_no']);
            $sheet->setCellValue('E' . $row, $error['amount']);
            $sheet->setCellValue('F' . $row, $error['issue_date']);
            $sheet->setCellValue('G' . $row, $error['error_types']);
            $sheet->setCellValue('H' . $row, $error['error_description']);
            $sheet->setCellValue('I' . $row, $error['status']);
            $sheet->setCellValue('J' . $row, $error['created_at']);
            $row++;
        }
    }

    protected function addRecentChangesSheet(Spreadsheet $spreadsheet, Collection $recentChanges): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('最近变更');

        $headers = [
            '项目编号', '项目名称', '变更类型', '记录ID', '原状态',
            '新状态', '变更时间', '操作人', '备注'
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getColumnDimension($col)->setWidth(15);
            $col++;
        }

        $row = 2;
        foreach ($recentChanges as $change) {
            $sheet->setCellValue('A' . $row, $change['project_code']);
            $sheet->setCellValue('B' . $row, $change['project_name']);
            $sheet->setCellValue('C' . $row, $change['change_type']);
            $sheet->setCellValue('D' . $row, $change['record_id']);
            $sheet->setCellValue('E' . $row, $change['old_status']);
            $sheet->setCellValue('F' . $row, $change['new_status']);
            $sheet->setCellValue('G' . $row, $change['change_time']);
            $sheet->setCellValue('H' . $row, $change['operator']);
            $sheet->setCellValue('I' . $row, $change['remark']);
            $row++;
        }
    }

    protected function getTypeLabel(?string $type): string
    {
        $labels = [
            ReconciliationDifference::TYPE_AMOUNT_MISMATCH => '金额不匹配',
            ReconciliationDifference::TYPE_MISSING_IN_SYSTEM => '系统缺失',
            ReconciliationDifference::TYPE_MISSING_IN_STATEMENT => '对账单缺失',
            ReconciliationDifference::TYPE_DATE_MISMATCH => '日期不匹配',
        ];

        return $labels[$type] ?? $type;
    }

    protected function getStatusLabel(?string $status): string
    {
        $labels = [
            ReconciliationDifference::STATUS_PENDING => '待处理',
            ReconciliationDifference::STATUS_ASSIGNED => '已分配',
            ReconciliationDifference::STATUS_IN_PROGRESS => '处理中',
            ReconciliationDifference::STATUS_PENDING_WRITE_OFF => '待冲销',
            ReconciliationDifference::STATUS_WRITE_OFF_PENDING_APPROVAL => '冲销待审批',
            ReconciliationDifference::STATUS_RESOLVED => '已解决',
        ];

        return $labels[$status] ?? $status;
    }

    protected function getWriteOffStatusLabel(?string $status): string
    {
        $labels = [
            WriteOff::STATUS_PENDING => '待审批',
            WriteOff::STATUS_APPROVED => '已批准',
            WriteOff::STATUS_REJECTED => '已驳回',
        ];

        return $labels[$status] ?? $status;
    }

    protected function getRiskLabel(?string $level): string
    {
        $labels = [
            'low' => '低',
            'medium' => '中',
            'high' => '高',
        ];

        return $labels[$level] ?? $level;
    }
}
