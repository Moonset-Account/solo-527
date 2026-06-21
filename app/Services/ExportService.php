<?php

namespace App\Services;

use App\Models\Event;
use App\Models\ExportRecord;
use App\Models\Registration;
use App\Models\ConversionSummary;
use App\Models\AttendanceSummary;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class ExportService
{
    protected array $columns = [
        'registrations' => [
            'registration_no' => '报名编号',
            'name' => '姓名',
            'gender' => '性别',
            'phone' => '手机号',
            'email' => '邮箱',
            'company' => '公司名称',
            'industry' => '行业',
            'department' => '部门',
            'position' => '职位',
            'source_channel' => '来源渠道',
            'conversion_stage' => '转化阶段',
            'registration_status' => '报名状态',
            'attendance_status' => '到场状态',
            'paid_amount' => '实付金额',
            'quality_level' => '质量等级',
            'total_score' => '质量总分',
            'created_at' => '创建时间',
            'owner_name' => '跟进人',
        ],
        'summary' => [
            'summary_date' => '统计日期',
            'new_inquiry_count' => '新增咨询',
            'new_registered_count' => '新增报名',
            'new_confirmed_count' => '新增确认',
            'new_paid_count' => '新增支付',
            'new_lost_count' => '新增流失',
            'total_inquiry_count' => '累计咨询',
            'total_registered_count' => '累计报名',
            'total_confirmed_count' => '累计确认',
            'total_paid_count' => '累计支付',
            'total_paid_amount' => '累计金额',
            'conversion_rate' => '转化率',
        ],
        'attendance' => [
            'summary_date' => '统计日期',
            'session_name' => '场次名称',
            'registered_count' => '报名人数',
            'confirmed_count' => '确认人数',
            'arrived_count' => '实到人数',
            'no_show_count' => '爽约人数',
            'attendance_rate' => '到场率',
            'seat_capacity' => '座位容量',
            'seat_sold' => '已售座位',
            'seat_occupied' => '实际占用',
            'arrival_rate' => '上座率',
        ],
    ];

    public function getExportColumns(string $type): array
    {
        return $this->columns[$type] ?? [];
    }

    public function createExport(array $criteria, string $exportType, ?User $user = null): ExportRecord
    {
        $user = $user ?? Auth::user();
        $eventId = $criteria['event_id'] ?? null;

        $exportColumns = $this->getExportColumns($exportType);
        $now = now();
        $fileName = sprintf(
            '%s_%s_%s_%s.xlsx',
            $exportType,
            $eventId ? "event{$eventId}" : 'all',
            $now->format('YmdHis'),
            $user?->id ?? 'system'
        );

        $criteriaWithMeta = array_merge($criteria, [
            'export_time' => $now->toDateTimeString(),
            'exported_by' => $user?->id,
            'exported_by_name' => $user?->name,
        ]);

        $record = ExportRecord::create([
            'event_id' => $eventId,
            'export_type' => $exportType,
            'file_name' => $fileName,
            'file_path' => "exports/{$now->format('Y/m')}/{$fileName}",
            'file_format' => 'xlsx',
            'record_count' => 0,
            'file_size' => 0,
            'query_criteria' => $criteriaWithMeta,
            'export_columns' => $exportColumns,
            'sql_hash' => $this->generateHash($exportType, $criteriaWithMeta),
            'exported_by' => $user?->id,
            'exported_by_name' => $user?->name ?? 'System',
            'exported_by_dept' => $user?->department,
            'exported_from_ip' => request()->ip(),
            'expired_at' => $now->copy()->addDays(30),
            'status' => 'generating',
        ]);

        try {
            $result = $this->generateFile($record, $exportType, $criteria);

            $record->update([
                'record_count' => $result['count'],
                'file_size' => $result['size'],
                'status' => 'completed',
            ]);
        } catch (\Exception $e) {
            $record->update([
                'status' => 'failed',
            ]);
            throw $e;
        }

        return $record;
    }

    protected function generateHash(string $type, array $criteria): string
    {
        return hash('sha256', json_encode([
            'type' => $type,
            'criteria' => $criteria,
            'timestamp' => microtime(true),
        ], JSON_UNESCAPED_UNICODE));
    }

    protected function generateFile(ExportRecord $record, string $type, array $criteria): array
    {
        $headers = array_values($record->export_columns ?? []);
        $rows = $this->getData($type, $criteria);

        $fileContent = $this->buildCsvContent($headers, $rows);

        $fullPath = Storage::path($record->file_path);
        $directory = dirname($fullPath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        file_put_contents($fullPath, "\xEF\xBB\xBF" . $fileContent);

        return [
            'count' => count($rows),
            'size' => filesize($fullPath),
        ];
    }

    protected function buildCsvContent(array $headers, array $rows): string
    {
        $output = fopen('php://temp', 'r+');

        fputcsv($output, $headers);

        foreach ($rows as $row) {
            fputcsv($output, $row);
        }

        rewind($output);
        $content = stream_get_contents($output);
        fclose($output);

        return $content;
    }

    protected function getData(string $type, array $criteria): array
    {
        return match ($type) {
            'registrations' => $this->getRegistrationData($criteria),
            'summary' => $this->getSummaryData($criteria),
            'attendance' => $this->getAttendanceData($criteria),
            default => [],
        };
    }

    protected function getRegistrationData(array $criteria): array
    {
        $query = Registration::with(['qualityScore', 'owner'])
            ->when($criteria['event_id'] ?? null, fn($q, $eid) => $q->where('event_id', $eid))
            ->when($criteria['start_date'] ?? null, fn($q, $sd) => $q->whereDate('created_at', '>=', $sd))
            ->when($criteria['end_date'] ?? null, fn($q, $ed) => $q->whereDate('created_at', '<=', $ed))
            ->when($criteria['conversion_stage'] ?? null, fn($q, $cs) => $q->where('conversion_stage', $cs))
            ->when($criteria['registration_status'] ?? null, fn($q, $rs) => $q->where('registration_status', $rs))
            ->when($criteria['attendance_status'] ?? null, fn($q, $as) => $q->where('attendance_status', $as))
            ->when($criteria['source_channel'] ?? null, fn($q, $sc) => $q->where('source_channel', $sc))
            ->when($criteria['quality_level'] ?? null, function ($q, $ql) {
                $q->whereHas('qualityScore', fn($sq) => $sq->where('quality_level', $ql));
            })
            ->orderBy('created_at', 'desc');

        $stageMap = Registration::CONVERSION_STAGES;
        $regMap = Registration::REGISTRATION_STATUSES;
        $attMap = Registration::ATTENDANCE_STATUSES;

        return $query->cursor()->map(function (Registration $reg) use ($stageMap, $regMap, $attMap) {
            return [
                $reg->registration_no,
                $reg->name,
                $reg->gender,
                "'" . $reg->phone,
                $reg->email,
                $reg->company,
                $reg->industry,
                $reg->department,
                $reg->position,
                $reg->source_channel,
                $stageMap[$reg->conversion_stage] ?? $reg->conversion_stage,
                $regMap[$reg->registration_status] ?? $reg->registration_status,
                $attMap[$reg->attendance_status] ?? $reg->attendance_status,
                $reg->paid_amount,
                $reg->qualityScore?->quality_level ?? '-',
                $reg->qualityScore?->total_score ?? 0,
                $reg->created_at?->toDateTimeString(),
                $reg->owner?->name ?? '-',
            ];
        })->toArray();
    }

    protected function getSummaryData(array $criteria): array
    {
        $query = ConversionSummary::query()
            ->when($criteria['event_id'] ?? null, fn($q, $eid) => $q->where('event_id', $eid))
            ->when($criteria['start_date'] ?? null, fn($q, $sd) => $q->where('summary_date', '>=', $sd))
            ->when($criteria['end_date'] ?? null, fn($q, $ed) => $q->where('summary_date', '<=', $ed))
            ->orderBy('summary_date', 'asc');

        return $query->cursor()->map(function (ConversionSummary $s) {
            return [
                $s->summary_date?->toDateString(),
                $s->new_inquiry_count,
                $s->new_registered_count,
                $s->new_confirmed_count,
                $s->new_paid_count,
                $s->new_lost_count,
                $s->total_inquiry_count,
                $s->total_registered_count,
                $s->total_confirmed_count,
                $s->total_paid_count,
                $s->total_paid_amount,
                ($s->conversion_rate * 100) . '%',
            ];
        })->toArray();
    }

    protected function getAttendanceData(array $criteria): array
    {
        $query = AttendanceSummary::with('session')
            ->when($criteria['event_id'] ?? null, fn($q, $eid) => $q->where('event_id', $eid))
            ->when($criteria['session_id'] ?? null, fn($q, $sid) => $q->where('session_id', $sid))
            ->when($criteria['start_date'] ?? null, fn($q, $sd) => $q->where('summary_date', '>=', $sd))
            ->when($criteria['end_date'] ?? null, fn($q, $ed) => $q->where('summary_date', '<=', $ed))
            ->orderBy('summary_date', 'asc');

        return $query->cursor()->map(function (AttendanceSummary $s) {
            return [
                $s->summary_date?->toDateString(),
                $s->session?->name ?? '全部场次',
                $s->registered_count,
                $s->confirmed_count,
                $s->arrived_count,
                $s->no_show_count,
                ($s->attendance_rate * 100) . '%',
                $s->seat_capacity,
                $s->seat_sold,
                $s->seat_occupied,
                ($s->arrival_rate * 100) . '%',
            ];
        })->toArray();
    }

    public function download(ExportRecord $record)
    {
        if (!$record->isAvailable()) {
            throw new \RuntimeException('文件不可用或已过期');
        }

        $record->increment('download_count');

        $headerInfo = [
            '报表名称' => ExportRecord::EXPORT_TYPES[$record->export_type] ?? $record->export_type,
            '查询口径' => $record->getQueryCriteriaText(),
            '导出人' => $record->exported_by_name . ($record->exported_by_dept ? "（{$record->exported_by_dept}）" : ''),
            '导出时间' => $record->created_at?->toDateTimeString(),
            '数据条数' => $record->record_count,
            '文件签名' => $record->sql_hash,
        ];

        return [
            'path' => Storage::path($record->file_path),
            'file_name' => $record->file_name,
            'headers' => $headerInfo,
            'record' => $record,
        ];
    }
}
