<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessOrder extends Model
{
    protected $fillable = [
        'order_no',
        'title',
        'description',
        'status',
        'handler_id',
        'handled_at',
        'remarks',
        'created_by',
    ];

    protected $casts = [
        'status' => 'string',
        'handled_at' => 'datetime',
    ];

    public function alertRules(): HasMany
    {
        return $this->hasMany(AlertRule::class);
    }

    public function dimensions(): HasMany
    {
        return $this->hasMany(Dimension::class);
    }

    public function datasetPermissions(): HasMany
    {
        return $this->hasMany(DatasetPermission::class);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handler_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
