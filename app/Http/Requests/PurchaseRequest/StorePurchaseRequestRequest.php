<?php

namespace App\Http\Requests\PurchaseRequest;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\PurchaseRequest::class);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:100'],
            'reason' => ['required', 'string'],
            'urgency_level' => ['required', 'string', 'in:low,medium,high,critical'],
            'expected_date' => ['nullable', 'date'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'remarks' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.supply_id' => ['required', 'exists:supplies,id'],
            'items.*.supply_name' => ['required', 'string', 'max:255'],
            'items.*.specification' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:1'],
            'items.*.unit' => ['required', 'string', 'max:20'],
            'items.*.estimated_unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.currency' => ['nullable', 'string', 'max:10'],
            'items.*.remarks' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => '请输入申请标题',
            'department.required' => '请输入申请部门',
            'reason.required' => '请输入申请理由',
            'urgency_level.required' => '请选择紧急程度',
            'items.required' => '请至少添加一条物资明细',
            'items.*.supply_id.required' => '请选择物资',
            'items.*.quantity.required' => '请输入数量',
            'items.*.quantity.min' => '数量必须大于0',
            'items.*.unit.required' => '请输入计量单位',
        ];
    }
}
