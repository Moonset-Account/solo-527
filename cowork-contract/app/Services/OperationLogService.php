<?php

namespace App\Services;

use App\Models\OperationLog;
use App\Models\User;

class OperationLogService
{
    public function log(User $user, string $action, ?string $subjectType = null, ?int $subjectId = null, ?array $payload = null): OperationLog
    {
        return OperationLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'payload' => $payload,
            'ip_address' => request()->ip(),
        ]);
    }
}
