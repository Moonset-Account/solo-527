<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssistanceRequest extends FormRequest
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
            'deadline' => 'nullable|date',
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => '标题',
            'description' => '描述',
            'deadline' => '截止日期',
        ];
    }
}
