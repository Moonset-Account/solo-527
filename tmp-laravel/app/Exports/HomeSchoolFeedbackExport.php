<?php

namespace App\Exports;

use App\Models\HomeSchoolFeedback;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class HomeSchoolFeedbackExport implements FromCollection, WithHeadings, WithMapping
{
    protected $feedbacks;

    public function __construct($feedbacks)
    {
        $this->feedbacks = $feedbacks;
    }

    public function collection()
    {
        return $this->feedbacks;
    }

    public function headings(): array
    {
        return [
            'ID',
            '学员',
            '教师',
            '类型',
            '内容',
            '家长回复',
            '家长已读时间',
            '提醒时间',
            '创建时间',
        ];
    }

    public function map($feedback): array
    {
        return [
            $feedback->id,
            $feedback->student->name ?? '',
            $feedback->teacher->name ?? '',
            $feedback->type,
            $feedback->content,
            $feedback->parent_reply,
            $feedback->parent_read_at?->format('Y-m-d H:i:s'),
            $feedback->reminded_at?->format('Y-m-d H:i:s'),
            $feedback->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
