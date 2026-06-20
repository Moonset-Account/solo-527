<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contract_no' => 'required|string|unique:contracts,contract_no',
            'property_id' => 'required|exists:properties,id',
            'tenant_id' => 'required|exists:users,id',
            'consultant_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'monthly_rent' => 'required|numeric|min:0',
            'deposit_amount' => 'required|numeric|min:0',
            'payment_cycle' => 'required|string|in:monthly,quarterly,semi_annually,annually',
            'status' => 'required|string|in:draft,pending_approval',
            'terms' => 'nullable|string',
            'signed_at' => 'nullable|date',
        ];
    }
}
