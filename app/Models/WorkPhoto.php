<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'work_id',
        'file_path',
        'thumbnail_path',
        'type',
        'caption',
        'sort_order',
    ];

    public function work()
    {
        return $this->belongsTo(Work::class);
    }

    public function getFileUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail_path ? asset('storage/' . $this->thumbnail_path) : null;
    }
}
