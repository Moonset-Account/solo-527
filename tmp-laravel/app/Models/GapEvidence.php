<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class GapEvidence extends Model
{
    use SoftDeletes;

    protected $table = 'gap_evidences';

    protected $fillable = [
        'compliance_gap_id',
        'uploaded_by',
        'file_name',
        'file_path',
        'file_size',
        'file_type',
        'description',
        'evidence_type',
    ];

    public function complianceGap(): BelongsTo
    {
        return $this->belongsTo(ComplianceGap::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
