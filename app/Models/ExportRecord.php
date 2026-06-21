<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class ExportRecord extends Model
{
    use HasFactory, SoftDeletes;

    const EXPORT_TYPES = [
        'registrations' => '报名数据',
        'summary' => '汇总数据',
        'attendance' => '到场数据',
        'refund' => '退款数据',
        'feedback' => '反馈数据',
    ];

    protected $fillable = [
        'event_id', 'export_type', 'file_name', 'file_path', 'file_format',
        'record_count', 'file_size', 'query_criteria', 'export_columns',
        'sql_hash', 'exported_by', 'exported_by_name', 'exported_by_dept',
        'exported_from_ip', 'expired_at', 'status', 'download_count',
    ];

    protected function casts(): array
    {
        return [
            'query_criteria' => 'array',
            'export_columns' => 'array',
            'expired_at' => 'datetime',
            'record_count' => 'integer',
            'file_size' => 'integer',
            'download_count' => 'integer',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function exporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'exported_by');
    }

    public function getExportTypeTextAttribute(): string
    {
        return static::EXPORT_TYPES[$this->export_type] ?? $this->export_type;
    }

    public function getFileUrlAttribute(): string
    {
        if (str_starts_with($this->file_path, 'http')) {
            return $this->file_path;
        }
        return Storage::url($this->file_path);
    }

    public function getQueryCriteriaText(): string
    {
        if (empty($this->query_criteria)) {
            return '无筛选条件（全部数据）';
        }

        $parts = [];
        foreach ($this->query_criteria as $key => $value) {
            if ($value === null || $value === '') continue;
            if (is_array($value)) {
                $value = implode(',', $value);
            }
            $label = $this->mapCriteriaLabel($key);
            $parts[] = "{$label} = {$value}";
        }
        return implode('；', $parts);
    }

    protected function mapCriteriaLabel(string $key): string
    {
        return match ($key) {
            'event_id' => '活动ID',
            'event_name' => '活动名称',
            'start_date' => '开始日期',
            'end_date' => '结束日期',
            'conversion_stage' => '转化阶段',
            'registration_status' => '报名状态',
            'attendance_status' => '到场状态',
            'source_channel' => '来源渠道',
            'quality_level' => '质量等级',
            'industry' => '行业',
            'session_id' => '场次ID',
            'export_time' => '导出时间',
            default => $key,
        };
    }

    public function isExpired(): bool
    {
        return $this->expired_at && $this->expired_at->isPast();
    }

    public function isAvailable(): bool
    {
        return $this->status === 'completed' && !$this->isExpired() && Storage::exists($this->file_path);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('exported_by', $userId);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
