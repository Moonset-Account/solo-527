<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PracticeRecordingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student' => StudentResource::make($this->whenLoaded('student')),
            'assignment_id' => $this->assignment_id,
            'file_path' => $this->file_path,
            'duration_seconds' => $this->duration_seconds,
            'note' => $this->note,
            'annotations' => AnnotationResource::collection($this->whenLoaded('annotations')),
            'created_at' => $this->created_at,
        ];
    }
}
