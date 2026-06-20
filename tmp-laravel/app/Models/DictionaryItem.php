<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['dictionary_id', 'value', 'label', 'sort_order', 'is_active'])]
class DictionaryItem extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function dictionary()
    {
        return $this->belongsTo(Dictionary::class);
    }
}
