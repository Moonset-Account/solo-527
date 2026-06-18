<?php

namespace App\Models;

use App\Enums\SupplierRiskLevel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierRiskLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'old_level',
        'new_level',
        'reason',
        'operator_id',
    ];

    protected function casts(): array
    {
        return [
            'old_level' => SupplierRiskLevel::class,
            'new_level' => SupplierRiskLevel::class,
        ];
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function isLevelUp(): bool
    {
        return $this->new_level->score() > $this->old_level?->score();
    }

    public function isLevelDown(): bool
    {
        return $this->new_level->score() < $this->old_level?->score();
    }
}
