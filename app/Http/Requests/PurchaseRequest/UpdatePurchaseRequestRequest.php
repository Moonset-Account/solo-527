<?php

namespace App\Http\Requests\PurchaseRequest;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('purchaseRequest'));
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'department' => ['sometimes', 'string', 'max:100'],
            'reason' => ['sometimes', 'string'],
            'urgency_level' => ['sometimes', 'string', 'in:low,medium,high,critical'],
            'expected_date' => ['nullable', 'date'],
            'delivery_address' => ['nullable', 'string', 'max:500'],
            'remarks' => ['nullable', 'string'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'exists:purchase_request_items,id'],
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
}
