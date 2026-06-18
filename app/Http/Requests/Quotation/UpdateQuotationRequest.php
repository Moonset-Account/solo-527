<?php

namespace App\Http\Requests\Quotation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('quotation'));
    }

    public function rules(): array
    {
        return [
            'valid_until' => ['sometimes', 'date', 'after:today'],
            'delivery_date' => ['nullable', 'date'],
            'delivery_method' => ['nullable', 'string', 'max:100'],
            'delivery_terms' => ['nullable', 'string', 'max:255'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_type' => ['nullable', 'string', 'in:percentage,fixed,none'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'exists:quotation_items,id'],
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
            'items.*.manufacturer' => ['nullable', 'string', 'max:100'],
            'items.*.origin_country' => ['nullable', 'string', 'max:100'],
            'items.*.delivery_days' => ['nullable', 'integer', 'min:1'],
            'items.*.warranty_months' => ['nullable', 'integer', 'min:0'],
            'items.*.remarks' => ['nullable', 'string'],
        ];
    }
}
