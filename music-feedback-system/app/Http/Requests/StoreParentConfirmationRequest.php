<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreParentConfirmationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assignment_id' => 'required|exists:assignments,id',
            'student_id' => 'required|exists:students,id',
            'confirmed' => 'required|boolean',
            'note' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'assignment_id.required' => '作业ID不能为空',
            'assignment_id.exists' => '作业不存在',
            'student_id.required' => '学生ID不能为空',
            'student_id.exists' => '学生不存在',
            'confirmed.required' => '确认状态不能为空',
            'confirmed.boolean' => '确认状态必须是布尔值',
            'note.string' => '备注必须是字符串',
        ];
    }
}
