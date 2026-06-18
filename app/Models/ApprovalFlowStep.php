<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalFlowStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'approval_flow_id',
        'step_order',
        'name',
        'description',
        'approver_type',
        'approver_id',
        'role_id',
        'department',
        'is_required',
        'can_delegate',
        'timeout_hours',
    ];

    protected function casts(): array
    {
        return [
            'step_order' => 'integer',
            'is_required' => 'boolean',
            'can_delegate' => 'boolean',
            'timeout_hours' => 'integer',
        ];
    }

    public function flow()
    {
        return $this->belongsTo(ApprovalFlow::class, 'approval_flow_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function approvalRecords()
    {
        return $this->hasMany(ApprovalRecord::class, 'step_id');
    }

    public function getApprovers(): \Illuminate\Support\Collection
    {
        if ($this->approver_type === 'user' && $this->approver_id) {
            return collect([$this->approver]);
        }

        if ($this->approver_type === 'role' && $this->role_id) {
            return User::whereHas('roles', function ($q) {
                $q->where('id', $this->role_id);
            })->get();
        }

        if ($this->approver_type === 'department' && $this->department) {
            return User::where('department', $this->department)
                ->whereHas('roles', function ($q) {
                    $q->whereIn('name', [
                        \App\Enums\RoleName::DEPARTMENT_HEAD->value,
                        \App\Enums\RoleName::ADMIN->value,
                    ]);
                })->get();
        }

        return collect();
    }

    public function isFirstStep(): bool
    {
        return $this->step_order === 1;
    }

    public function isLastStep(): bool
    {
        $maxOrder = $this->flow->steps()->max('step_order');
        return $this->step_order === $maxOrder;
    }
}
