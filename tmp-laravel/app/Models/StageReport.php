<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['art_class_id', 'title', 'stage_type', 'start_date', 'end_date', 'config', 'status', 'generated_at', 'published_at'])]
class StageReport extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
            'generated_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function artClass()
    {
        return $this->belongsTo(ArtClass::class);
    }

    public function items()
    {
        return $this->hasMany(StageReportItem::class);
    }
}
