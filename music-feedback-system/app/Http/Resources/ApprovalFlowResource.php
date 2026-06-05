<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprovalFlowResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'approvable_type' => $this->approvable_type,
            'approvable_id' => $this->approvable_id,
            'approver' => $this->whenLoaded('approver', fn() => $this->approver->name),
            'action' => $this->action,
            'comment' => $this->comment,
            'created_at' => $this->created_at,
        ];
    }
}
