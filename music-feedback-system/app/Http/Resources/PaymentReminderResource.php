<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentReminderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student' => StudentResource::make($this->whenLoaded('student')),
            'amount' => $this->amount,
            'due_date' => $this->due_date,
            'status' => $this->status,
            'note' => $this->note,
            'latest_approval' => ApprovalFlowResource::make($this->whenLoaded('latestApproval')),
            'created_at' => $this->created_at,
        ];
    }
}
