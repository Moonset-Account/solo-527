<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contract_no' => [
                'sometimes',
                'string',
                Rule::unique('contracts', 'contract_no')->ignore($this->route('contract')->id),
            ],
            'property_id' => 'sometimes|exists:properties,id',
            'tenant_id' => 'sometimes|exists:users,id',
            'consultant_id' => 'sometimes|exists:users,id',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
            'monthly_rent' => 'sometimes|numeric|min:0',
            'deposit_amount' => 'sometimes|numeric|min:0',
            'payment_cycle' => 'sometimes|string|in:monthly,quarterly,semi_annually,annually',
            'status' => 'sometimes|string|in:draft,pending_approval,active,expired,terminated',
            'terms' => 'nullable|string',
            'signed_at' => 'nullable|date',
        ];
    }
}
