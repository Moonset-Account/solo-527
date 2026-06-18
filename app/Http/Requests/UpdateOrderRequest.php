<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => 'required',
            'customer_phone' => 'required',
            'product_name' => 'required',
            'quantity' => 'required|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'expected_delivery_date' => 'nullable|date',
        ];
    }
}
