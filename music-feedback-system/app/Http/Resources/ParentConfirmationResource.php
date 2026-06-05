<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParentConfirmationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent' => $this->whenLoaded('parent', fn() => $this->parent->name),
            'assignment_id' => $this->assignment_id,
            'student_id' => $this->student_id,
            'confirmed' => $this->confirmed,
            'note' => $this->note,
            'created_at' => $this->created_at,
        ];
    }
}
