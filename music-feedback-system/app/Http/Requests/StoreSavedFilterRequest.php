<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSavedFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'module' => 'required|in:assignments,recordings,payments,progress',
            'filter_config' => 'required|array',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => '筛选器名称不能为空',
            'name.string' => '筛选器名称必须是字符串',
            'name.max' => '筛选器名称不能超过100个字符',
            'module.required' => '模块不能为空',
            'module.in' => '模块必须是assignments,recordings,payments或progress',
            'filter_config.required' => '筛选配置不能为空',
            'filter_config.array' => '筛选配置必须是数组',
        ];
    }
}
