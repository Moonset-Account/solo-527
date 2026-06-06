<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImportExportTask extends Model
{
    protected $fillable = [
        'task_no',
        'type',
        'module',
        'file_path',
        'file_name',
        'total_count',
        'success_count',
        'failed_count',
        'error_log',
        'status',
        'filters',
        'options',
        'created_by',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'filters' => 'array',
        'options' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    const TYPE_IMPORT = 'import';
    const TYPE_EXPORT = 'export';

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getTypeTextAttribute()
    {
        return $this->type === self::TYPE_IMPORT ? '导入' : '导出';
    }

    public function getStatusTextAttribute()
    {
        $statusMap = [
            self::STATUS_PENDING => '待处理',
            self::STATUS_PROCESSING => '处理中',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_FAILED => '失败',
        ];
        return $statusMap[$this->status] ?? $this->status;
    }

    public function generateTaskNo()
    {
        return strtoupper(substr($this->type, 0, 2)) . date('YmdHis') . rand(100, 999);
    }
}
