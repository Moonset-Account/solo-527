<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoachRevenueLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'coach_id',
        'attendance_id',
        'transfer_request_id',
        'refund_request_id',
        'type',
        'amount',
        'description',
        'created_by',
    ];

    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    public function attendance()
    {
        return $this->belongsTo(Attendance::class);
    }

    public function transferRequest()
    {
        return $this->belongsTo(TransferRequest::class);
    }

    public function refundRequest()
    {
        return $this->belongsTo(RefundRequest::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
