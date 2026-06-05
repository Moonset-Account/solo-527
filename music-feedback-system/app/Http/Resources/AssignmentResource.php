<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'teacher' => UserResource::make($this->whenLoaded('teacher')),
            'student' => StudentResource::make($this->whenLoaded('student')),
            'piece' => PieceResource::make($this->whenLoaded('piece')),
            'title' => $this->title,
            'description' => $this->description,
            'bpm_requirement' => $this->bpm_requirement,
            'beat_time_signature' => $this->beat_time_signature,
            'due_date' => $this->due_date,
            'status' => $this->status,
            'recordings_count' => $this->whenCounted('practiceRecordings'),
            'parent_confirmations' => ParentConfirmationResource::collection($this->whenLoaded('parentConfirmations')),
            'latest_approval' => ApprovalFlowResource::make($this->whenLoaded('latestApproval')),
            'created_at' => $this->created_at,
        ];
    }
}
