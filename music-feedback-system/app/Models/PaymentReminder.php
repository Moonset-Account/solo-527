<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentReminder extends Model
{
    use HasFactory;
    protected $fillable = [
        'student_id',
        'amount',
        'due_date',
        'status',
        'note',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'status' => 'string',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function approvalFlows()
    {
        return $this->morphMany(ApprovalFlow::class, 'approvable');
    }

    public function latestApproval()
    {
        return $this->morphOne(ApprovalFlow::class, 'approvable')->latestOfMany();
    }

    public function scopeByStatus($query, string $status)
    {
        $query->where('status', $status);
    }

    public function scopeByStudent($query, int $studentId)
    {
        $query->where('student_id', $studentId);
    }

    public function scopeOverdue($query)
    {
        $query->where('due_date', '<', now())->where('status', '!=', 'paid');
    }

    public function scopePending($query)
    {
        $query->where('status', 'pending');
    }
}
