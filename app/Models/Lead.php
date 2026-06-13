<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'gender',
        'age',
        'source',
        'status',
        'quality',
        'intention',
        'budget_min',
        'budget_max',
        'quote_version_id',
        'churn_reason_id',
        'owner_id',
        'assignee_id',
        'contract_pending_explanation',
        'contract_amount',
        'signed_at',
        'last_follow_at',
        'next_follow_at',
        'is_in_ocean',
        'entered_ocean_at',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
        'last_follow_at' => 'datetime',
        'next_follow_at' => 'datetime',
        'entered_ocean_at' => 'datetime',
        'is_in_ocean' => 'boolean',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'contract_amount' => 'decimal:2',
    ];

    protected static array $sourceLabels = [
        'douyin' => '抖音',
        'xiaohongshu' => '小红书',
        'wechat' => '微信朋友圈',
        'baidu' => '百度推广',
        'meituan' => '美团',
        'recommend' => '老客转介绍',
        'offline' => '线下到店',
        'other' => '其他',
    ];

    protected static array $statusLabels = [
        'new' => '新线索',
        'contacted' => '已联系',
        'consulting' => '咨询中',
        'quoted' => '已报价',
        'contract_pending' => '合同待确认',
        'signed' => '已签约',
        'treatment' => '治疗中',
        'completed' => '已完成',
        'lost' => '已流失',
        'ocean' => '公海',
    ];

    protected static array $qualityLabels = [
        'A' => 'A级 - 高意向',
        'B' => 'B级 - 中意向',
        'C' => 'C级 - 低意向',
        'D' => 'D级 - 无效',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function quoteVersion(): BelongsTo
    {
        return $this->belongsTo(QuoteVersion::class);
    }

    public function churnReason(): BelongsTo
    {
        return $this->belongsTo(ChurnReason::class);
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class)->orderBy('created_at', 'desc');
    }

    public function responseNodes(): HasMany
    {
        return $this->hasMany(ResponseNode::class)->orderBy('created_at', 'asc');
    }

    public function getSourceLabelAttribute(): string
    {
        return static::$sourceLabels[$this->source] ?? $this->source;
    }

    public function getStatusLabelAttribute(): string
    {
        return static::$statusLabels[$this->status] ?? $this->status;
    }

    public function getQualityLabelAttribute(): string
    {
        return static::$qualityLabels[$this->quality] ?? $this->quality;
    }

    public function getGenderLabelAttribute(): string
    {
        return match ($this->gender) {
            'male' => '男',
            'female' => '女',
            default => '未知',
        };
    }

    public function scopeFilterByPeriod($query, $startDate, $endDate)
    {
        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }
        return $query;
    }

    public function scopeByStatus($query, $status)
    {
        if ($status && is_array($status)) {
            return $query->whereIn('status', $status);
        }
        if ($status && is_string($status)) {
            return $query->where('status', $status);
        }
        return $query;
    }

    public function scopeByAssignee($query, $assigneeId)
    {
        if ($assigneeId) {
            return $query->where('assignee_id', $assigneeId);
        }
        return $query;
    }

    public function scopeByQuality($query, $quality)
    {
        if ($quality) {
            return $query->where('quality', $quality);
        }
        return $query;
    }

    public function scopeBySource($query, $source)
    {
        if ($source && is_array($source)) {
            return $query->whereIn('source', $source);
        }
        if ($source && is_string($source)) {
            return $query->where('source', $source);
        }
        return $query;
    }

    public static function getSourceLabels(): array
    {
        return static::$sourceLabels;
    }

    public static function getStatusLabels(): array
    {
        return static::$statusLabels;
    }

    public static function getQualityLabels(): array
    {
        return static::$qualityLabels;
    }
}
