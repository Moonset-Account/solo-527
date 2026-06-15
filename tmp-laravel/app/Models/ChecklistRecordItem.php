<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChecklistRecordItem extends Model
{
    protected $fillable = [
        'checklist_record_id',
        'checklist_item_id',
        'gap_id',
        'result',
        'evidence',
        'remark',
        'has_gap',
    ];

    protected $casts = [
        'has_gap' => 'boolean',
    ];

    const RESULT_PASS = 'pass';
    const RESULT_FAIL = 'fail';
    const RESULT_PARTIAL = 'partial';
    const RESULT_PENDING = 'pending';
    const RESULT_NA = 'na';

    public function checklistRecord(): BelongsTo
    {
        return $this->belongsTo(ChecklistRecord::class);
    }

    public function checklistItem(): BelongsTo
    {
        return $this->belongsTo(ChecklistItem::class);
    }
}
