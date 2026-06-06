<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditTrail extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'table_name',
        'record_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'request_url',
        'remarks',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    const ACTION_CREATE = 'create';
    const ACTION_UPDATE = 'update';
    const ACTION_DELETE = 'delete';
    const ACTION_VIEW = 'view';
    const ACTION_EXPORT = 'export';
    const ACTION_IMPORT = 'import';
    const ACTION_APPROVE = 'approve';
    const ACTION_REJECT = 'reject';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getActionTextAttribute()
    {
        $actionMap = [
            self::ACTION_CREATE => '创建',
            self::ACTION_UPDATE => '更新',
            self::ACTION_DELETE => '删除',
            self::ACTION_VIEW => '查看',
            self::ACTION_EXPORT => '导出',
            self::ACTION_IMPORT => '导入',
            self::ACTION_APPROVE => '审批通过',
            self::ACTION_REJECT => '审批拒绝',
        ];
        return $actionMap[$this->action] ?? $this->action;
    }

    public static function log($action, $tableName, $recordId = null, $oldValues = null, $newValues = null, $remarks = null)
    {
        return self::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'table_name' => $tableName,
            'record_id' => $recordId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'request_url' => request()->fullUrl(),
            'remarks' => $remarks,
        ]);
    }
}
