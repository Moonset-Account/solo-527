<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'instrument' => $this->instrument,
            'status' => $this->status,
            'parent' => UserResource::make($this->whenLoaded('parent')),
            'teacher' => UserResource::make($this->whenLoaded('teacher')),
            'assignments_count' => $this->whenCounted('assignments'),
            'practice_recordings_count' => $this->whenCounted('practiceRecordings'),
            'completion_rate' => $this->when(isset($this->completion_rate), $this->completion_rate ?? null),
            'recording_count' => $this->when(isset($this->recording_count), $this->recording_count ?? null),
            'created_at' => $this->created_at,
        ];
    }
}
