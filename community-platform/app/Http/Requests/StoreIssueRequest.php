<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIssueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|max:200',
            'description' => 'required',
            'category' => 'required|max:100',
            'deadline' => 'nullable|date',
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => '标题',
            'description' => '描述',
            'category' => '分类',
            'deadline' => '截止日期',
        ];
    }
}
