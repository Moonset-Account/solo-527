<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSavedFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:100',
            'filter_config' => 'sometimes|array',
        ];
    }

    public function messages(): array
    {
        return [
            'name.string' => '筛选器名称必须是字符串',
            'name.max' => '筛选器名称不能超过100个字符',
            'filter_config.array' => '筛选配置必须是数组',
        ];
    }
}
