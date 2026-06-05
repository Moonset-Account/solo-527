<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PieceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'composer' => $this->composer,
            'instrument' => $this->instrument,
            'difficulty_level' => $this->difficulty_level,
            'notes' => $this->notes,
        ];
    }
}
