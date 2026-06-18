<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MachineryAppointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_no',
        'greenhouse_id',
        'applicant_id',
        'machinery_type',
        'machinery_name',
        'purpose',
        'start_time',
        'end_time',
        'status',
        'operator_id',
        'remark',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    public function greenhouse()
    {
        return $this->belongsTo(Greenhouse::class);
    }

    public function applicant()
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}
