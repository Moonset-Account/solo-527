<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnnotationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'teacher' => $this->whenLoaded('teacher', fn() => $this->teacher->name),
            'practice_recording_id' => $this->practice_recording_id,
            'timestamp_ms' => $this->timestamp_ms,
            'content' => $this->content,
            'created_at' => $this->created_at,
        ];
    }
}
