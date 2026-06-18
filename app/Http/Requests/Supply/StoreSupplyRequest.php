<?php

namespace App\Http\Requests\Supply;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create_supplies');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:supplies'],
            'category_id' => ['required', 'exists:supply_categories,id'],
            'specification' => ['nullable', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:20'],
            'brand' => ['nullable', 'string', 'max:100'],
            'min_stock' => ['nullable', 'numeric', 'min:0'],
            'max_stock' => ['nullable', 'numeric', 'min:0'],
            'current_stock' => ['nullable', 'numeric', 'min:0'],
            'reference_price' => ['nullable', 'numeric', 'min:0'],
            'storage_location' => ['nullable', 'string', 'max:100'],
            'remark' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => '请输入物资名称',
            'code.required' => '请输入物资编码',
            'code.unique' => '物资编码已存在',
            'category_id.required' => '请选择物资分类',
            'category_id.exists' => '选择的分类不存在',
            'unit.required' => '请输入计量单位',
        ];
    }
}
