<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class DownloadLog extends Model
{
    protected $fillable = [
        'user_id',
        'download_type',
        'downloadable_id',
        'downloadable_type',
        'file_name',
        'file_path',
        'file_format',
        'file_size',
        'filter_criteria',
        'ip_address',
    ];

    protected $casts = [
        'filter_criteria' => 'array',
        'file_size' => 'integer',
    ];

    const TYPE_GAP_REPORT = 'gap_report';
    const TYPE_CHECKLIST = 'checklist';
    const TYPE_EVIDENCE = 'evidence';
    const TYPE_COMPLIANCE_SUMMARY = 'compliance_summary';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function downloadable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('download_type', $type);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function getFormattedFileSizeAttribute(): string
    {
        $size = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
        }

        return round($size, 2) . ' ' . $units[$i];
    }
}
