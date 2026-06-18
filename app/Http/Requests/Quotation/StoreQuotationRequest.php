<?php

namespace App\Http\Requests\Quotation;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Quotation::class);
    }

    public function rules(): array
    {
        return [
            'purchase_request_id' => ['required', 'exists:purchase_requests,id'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'valid_until' => ['required', 'date', 'after:today'],
            'delivery_date' => ['nullable', 'date'],
            'delivery_method' => ['nullable', 'string', 'max:100'],
            'delivery_terms' => ['nullable', 'string', 'max:255'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'currency' => ['required', 'string', 'max:10'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_type' => ['nullable', 'string', 'in:percentage,fixed,none'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_request_item_id' => ['nullable', 'exists:purchase_request_items,id'],
            'items.*.supply_id' => ['required', 'exists:supplies,id'],
            'items.*.supply_name' => ['required', 'string', 'max:255'],
            'items.*.specification' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:1'],
            'items.*.unit' => ['required', 'string', 'max:20'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_type' => ['nullable', 'string', 'in:percentage,fixed,none'],
            'items.*.discount_value' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.tax_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.manufacturer' => ['nullable', 'string', 'max:100'],
            'items.*.origin_country' => ['nullable', 'string', 'max:100'],
            'items.*.delivery_days' => ['nullable', 'integer', 'min:1'],
            'items.*.warranty_months' => ['nullable', 'integer', 'min:0'],
            'items.*.remarks' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'purchase_request_id.required' => '请选择采购申请',
            'supplier_id.required' => '请选择供应商',
            'valid_until.required' => '请输入报价有效期',
            'valid_until.after' => '报价有效期必须在今天之后',
            'currency.required' => '请选择币种',
            'items.required' => '请至少添加一条报价明细',
            'items.*.unit_price.required' => '请输入单价',
            'items.*.quantity.required' => '请输入数量',
        ];
    }
}
