<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class AuditLog extends Model
{
    use HasFactory;

    const OPERATION_CREATE = 'create';
    const OPERATION_UPDATE = 'update';
    const OPERATION_DELETE = 'delete';
    const OPERATION_VIEW = 'view';
    const OPERATION_EXPORT = 'export';
    const OPERATION_IMPORT = 'import';
    const OPERATION_APPROVE = 'approve';
    const OPERATION_REJECT = 'reject';
    const OPERATION_OTHER = 'other';

    public $timestamps = false;

    protected $fillable = [
        'operator',
        'operation_type',
        'change_content',
        'timestamp',
        'resource_type',
        'resource_id',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'metadata' => 'array',
    ];

    public function scopeOperator($query, $operator)
    {
        return $query->where('operator', $operator);
    }

    public function scopeOperationType($query, $type)
    {
        return $query->where('operation_type', $type);
    }

    public function scopeCreate($query)
    {
        return $query->where('operation_type', self::OPERATION_CREATE);
    }

    public function scopeUpdate($query)
    {
        return $query->where('operation_type', self::OPERATION_UPDATE);
    }

    public function scopeDelete($query)
    {
        return $query->where('operation_type', self::OPERATION_DELETE);
    }

    public function scopeResource($query, $resourceType, $resourceId = null)
    {
        $query = $query->where('resource_type', $resourceType);
        if ($resourceId !== null) {
            $query->where('resource_id', $resourceId);
        }
        return $query;
    }

    public function scopeResourceType($query, $resourceType)
    {
        return $query->where('resource_type', $resourceType);
    }

    public function scopeResourceId($query, $resourceId)
    {
        return $query->where('resource_id', $resourceId);
    }

    public function scopeIpAddress($query, $ipAddress)
    {
        return $query->where('ip_address', $ipAddress);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('timestamp', [$startDate, $endDate]);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('timestamp', '>=', now()->subDays($days));
    }

    public function scopeToday($query)
    {
        return $query->whereDate('timestamp', now()->toDateString());
    }

    protected function formattedTimestamp(): Attribute
    {
        return Attribute::make(
            get: fn () => optional($this->timestamp)->format('Y-m-d H:i:s'),
        );
    }

    protected function formattedDate(): Attribute
    {
        return Attribute::make(
            get: fn () => optional($this->timestamp)->format('Y-m-d'),
        );
    }

    protected function operationTypeLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::OPERATION_CREATE => '创建',
                    self::OPERATION_UPDATE => '更新',
                    self::OPERATION_DELETE => '删除',
                    self::OPERATION_VIEW => '查看',
                    self::OPERATION_EXPORT => '导出',
                    self::OPERATION_IMPORT => '导入',
                    self::OPERATION_APPROVE => '审批通过',
                    self::OPERATION_REJECT => '审批拒绝',
                    self::OPERATION_OTHER => '其他',
                ];
                return $labels[$this->operation_type] ?? $this->operation_type;
            },
        );
    }

    protected function isCreate(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->operation_type === self::OPERATION_CREATE,
        );
    }

    protected function isUpdate(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->operation_type === self::OPERATION_UPDATE,
        );
    }

    protected function isDelete(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->operation_type === self::OPERATION_DELETE,
        );
    }

    protected function resource(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->resource_type) {
                    return null;
                }
                $modelClass = 'App\\Models\\' . ucfirst($this->resource_type);
                if (class_exists($modelClass) && $this->resource_id) {
                    return $modelClass::find($this->resource_id);
                }
                return null;
            },
        );
    }

    protected function changeContentArray(): Attribute
    {
        return Attribute::make(
            get: function () {
                $decoded = json_decode($this->change_content, true);
                return json_last_error() === JSON_ERROR_NONE ? $decoded : $this->change_content;
            },
        );
    }
}
