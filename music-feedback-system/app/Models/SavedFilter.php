<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedFilter extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'module',
        'filter_config',
    ];

    protected $casts = [
        'filter_config' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeByUser($query, int $userId)
    {
        $query->where('user_id', $userId);
    }

    public function scopeByModule($query, string $module)
    {
        $query->where('module', $module);
    }
}
