<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApprovalActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => 'required|in:submit,approve,reject,withdraw',
            'comment' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'action.required' => '操作类型不能为空',
            'action.in' => '操作类型必须是submit,approve,reject或withdraw',
            'comment.string' => '评论必须是字符串',
        ];
    }
}
