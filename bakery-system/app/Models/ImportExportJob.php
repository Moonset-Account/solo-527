<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ImportExportJob extends Model
{
    use HasFactory;

    const TYPE_IMPORT = 'import';
    const TYPE_EXPORT = 'export';

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    protected $fillable = [
        'type',
        'entity',
        'file_path',
        'disk',
        'status',
        'total_records',
        'processed_records',
        'failed_records',
        'error_message',
        'filters',
        'created_by',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'filters' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getProgressPercentageAttribute()
    {
        if ($this->total_records === 0) {
            return 0;
        }
        return round(($this->processed_records / $this->total_records) * 100, 2);
    }
}
