<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class KilnBatchWork extends Pivot
{
    use HasFactory;

    protected $table = 'kiln_batch_works';

    protected $fillable = [
        'kiln_batch_id',
        'work_id',
        'position_shelf',
        'position_zone',
        'position_x',
        'position_y',
        'space_occupied',
        'post_firing_status',
        'post_firing_notes',
    ];

    public function kilnBatch()
    {
        return $this->belongsTo(KilnBatch::class);
    }

    public function work()
    {
        return $this->belongsTo(Work::class);
    }
}
