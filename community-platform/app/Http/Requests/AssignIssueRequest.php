<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignIssueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_id' => 'required|exists:departments,id',
            'deadline' => 'nullable|date',
        ];
    }

    public function attributes(): array
    {
        return [
            'department_id' => '部门',
            'deadline' => '截止日期',
        ];
    }
}
