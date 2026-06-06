<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreRevenueLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'transfer_request_id',
        'refund_request_id',
        'package_id',
        'type',
        'amount',
        'description',
        'created_by',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function transferRequest()
    {
        return $this->belongsTo(TransferRequest::class);
    }

    public function refundRequest()
    {
        return $this->belongsTo(RefundRequest::class);
    }

    public function package()
    {
        return $this->belongsTo(MemberCoursePackage::class, 'package_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
