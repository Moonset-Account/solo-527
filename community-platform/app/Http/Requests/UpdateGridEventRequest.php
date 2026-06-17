<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGridEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|max:200',
            'description' => 'sometimes|string',
            'location' => 'sometimes|max:200',
            'status' => 'sometimes|in:pending,processing,resolved,closed',
            'handler_id' => 'sometimes|exists:users,id',
            'department_id' => 'sometimes|exists:departments,id',
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => '标题',
            'description' => '描述',
            'location' => '地点',
            'status' => '状态',
            'handler_id' => '处理人',
            'department_id' => '部门',
        ];
    }
}
