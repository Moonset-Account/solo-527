<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentReminderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'note' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => '学生ID不能为空',
            'student_id.exists' => '学生不存在',
            'amount.required' => '金额不能为空',
            'amount.numeric' => '金额必须是数字',
            'amount.min' => '金额不能为负数',
            'due_date.required' => '截止日期不能为空',
            'due_date.date' => '截止日期格式不正确',
            'note.string' => '备注必须是字符串',
        ];
    }
}
