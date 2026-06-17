<?php

namespace App\Services;

use App\Models\ReconciliationStatement;
use App\Models\ReconciliationDifference;
use App\Models\ProjectPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ReconciliationService
{
    public function __construct(
        protected ReconciliationStatement $statementModel,
        protected ReconciliationDifference $differenceModel,
        protected ProjectPayment $paymentModel
    ) {}

    public function parseStatement(UploadedFile $file): ReconciliationStatement
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        if (! in_array($extension, ['xls', 'xlsx', 'csv'])) {
            throw ValidationException::withMessages([
                'file' => '仅支持 Excel 和 CSV 格式文件',
            ]);
        }

        $path = $file->store('statements', 'local');
        $fullPath = Storage::disk('local')->path($path);

        try {
            $spreadsheet = IOFactory::load($fullPath);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = collect($worksheet->toArray());

            if ($rows->isEmpty()) {
                throw ValidationException::withMessages([
                    'file' => '对账单文件内容为空',
                ]);
            }

            $header = $rows->shift();
            $records = $this->normalizeRecords($rows, $header);

            return DB::transaction(function () use ($file, $path, $records) {
                $statement = $this->statementModel->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'total_records' => $records->count(),
                    'total_amount' => $records->sum('amount'),
                    'status' => ReconciliationStatement::STATUS_PARSED,
                    'uploaded_by' => auth()->id(),
                ]);

                $statement->items()->createMany($records->toArray());

                return $statement;
            });
        } catch (\Exception $e) {
            Storage::disk('local')->delete($path);
            throw $e;
        }
    }

    public function compareWithSystem(int $statementId): Collection
    {
        $statement = $this->statementModel->findOrFail($statementId);

        if ($statement->status !== ReconciliationStatement::STATUS_PARSED) {
            throw ValidationException::withMessages([
                'statement' => '对账单状态不正确，无法进行比对',
            ]);
        }

        return DB::transaction(function () use ($statement) {
            $statementItems = $statement->items;
            $systemPayments = $this->paymentModel
                ->whereIn('project_id', $statementItems->pluck('project_id')->unique())
                ->whereBetween('payment_date', [
                    $statementItems->min('payment_date'),
                    $statementItems->max('payment_date'),
                ])
                ->get();

            $differences = collect();

            foreach ($statementItems as $item) {
                $matchedPayment = $systemPayments->firstWhere(function ($payment) use ($item) {
                    return $payment->project_id == $item->project_id
                        && abs($payment->amount - $item->amount) < 0.01
                        && $payment->payment_date->format('Y-m-d') == $item->payment_date;
                });

                if (! $matchedPayment) {
                    $difference = $this->differenceModel->create([
                        'statement_id' => $statement->id,
                        'project_id' => $item->project_id,
                        'statement_item_id' => $item->id,
                        'type' => ReconciliationDifference::TYPE_MISSING_IN_SYSTEM,
                        'statement_amount' => $item->amount,
                        'system_amount' => 0,
                        'difference_amount' => $item->amount,
                        'description' => '对账单记录在系统中不存在',
                        'status' => ReconciliationDifference::STATUS_PENDING,
                    ]);
                    $differences->push($difference);
                } elseif (abs($matchedPayment->amount - $item->amount) > 0.01) {
                    $difference = $this->differenceModel->create([
                        'statement_id' => $statement->id,
                        'project_id' => $item->project_id,
                        'statement_item_id' => $item->id,
                        'payment_id' => $matchedPayment->id,
                        'type' => ReconciliationDifference::TYPE_AMOUNT_MISMATCH,
                        'statement_amount' => $item->amount,
                        'system_amount' => $matchedPayment->amount,
                        'difference_amount' => $item->amount - $matchedPayment->amount,
                        'description' => '金额不匹配',
                        'status' => ReconciliationDifference::STATUS_PENDING,
                    ]);
                    $differences->push($difference);
                }
            }

            foreach ($systemPayments as $payment) {
                $matchedItem = $statementItems->firstWhere(function ($item) use ($payment) {
                    return $item->project_id == $payment->project_id
                        && abs($item->amount - $payment->amount) < 0.01
                        && $item->payment_date == $payment->payment_date->format('Y-m-d');
                });

                if (! $matchedItem) {
                    $difference = $this->differenceModel->create([
                        'statement_id' => $statement->id,
                        'project_id' => $payment->project_id,
                        'payment_id' => $payment->id,
                        'type' => ReconciliationDifference::TYPE_MISSING_IN_STATEMENT,
                        'statement_amount' => 0,
                        'system_amount' => $payment->amount,
                        'difference_amount' => -$payment->amount,
                        'description' => '系统记录在对账单中不存在',
                        'status' => ReconciliationDifference::STATUS_PENDING,
                    ]);
                    $differences->push($difference);
                }
            }

            $statement->update([
                'status' => ReconciliationStatement::STATUS_COMPARED,
                'matched_count' => $statementItems->count() - $differences->where('type', '!=', ReconciliationDifference::TYPE_MISSING_IN_STATEMENT)->count(),
                'difference_count' => $differences->count(),
            ]);

            return $differences;
        });
    }

    public function confirmDifferences(int $statementId, array $differences): ReconciliationStatement
    {
        $statement = $this->statementModel->findOrFail($statementId);

        if ($statement->status !== ReconciliationStatement::STATUS_COMPARED) {
            throw ValidationException::withMessages([
                'statement' => '对账单状态不正确，无法确认差异',
            ]);
        }

        return DB::transaction(function () use ($statement, $differences) {
            foreach ($differences as $diffData) {
                $difference = $this->differenceModel->findOrFail($diffData['id']);
                
                if ($difference->statement_id !== $statement->id) {
                    continue;
                }

                $difference->update([
                    'confirmed' => $diffData['confirmed'] ?? false,
                    'confirmation_remark' => $diffData['remark'] ?? null,
                    'confirmed_by' => auth()->id(),
                    'confirmed_at' => now(),
                ]);
            }

            $statement->update([
                'status' => ReconciliationStatement::STATUS_DIFFERENCES_CONFIRMED,
                'confirmed_by' => auth()->id(),
                'confirmed_at' => now(),
            ]);

            return $statement->load('differences');
        });
    }

    protected function normalizeRecords(Collection $rows, array $header): Collection
    {
        $headerMap = [
            '项目编号' => 'project_code',
            '项目名称' => 'project_name',
            '付款日期' => 'payment_date',
            '金额' => 'amount',
            '摘要' => 'summary',
            '对方账户' => 'counterparty_account',
            '对方名称' => 'counterparty_name',
        ];

        return $rows->map(function ($row) use ($header, $headerMap) {
            $record = [];

            foreach ($header as $index => $column) {
                $column = trim($column);
                if (isset($headerMap[$column])) {
                    $record[$headerMap[$column]] = $row[$index] ?? null;
                }
            }

            $record['amount'] = (float) str_replace([',', ' '], '', $record['amount'] ?? 0);
            $record['payment_date'] = $this->normalizeDate($record['payment_date'] ?? null);

            return $record;
        })->filter(function ($record) {
            return ! empty($record['project_code']) && ! empty($record['amount']);
        });
    }

    protected function normalizeDate($date): ?string
    {
        if (empty($date)) {
            return null;
        }

        if (is_numeric($date)) {
            return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($date)->format('Y-m-d');
        }

        try {
            return (new \DateTime($date))->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }
}
