<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['stage_report_id', 'student_id', 'attendance_rate', 'homework_score', 'artwork_score', 'teacher_comment', 'overall_score', 'rank'])]
class StageReportItem extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'attendance_rate' => 'decimal:2',
            'homework_score' => 'decimal:2',
            'artwork_score' => 'decimal:2',
            'overall_score' => 'decimal:2',
        ];
    }

    public function stageReport()
    {
        return $this->belongsTo(StageReport::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
