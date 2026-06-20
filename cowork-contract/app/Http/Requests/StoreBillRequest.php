<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contract_id' => 'required|exists:contracts,id',
            'bill_no' => 'required|string|unique:bills,bill_no',
            'type' => 'required|string|in:rent,deposit,management_fee,other',
            'amount' => 'required|numeric|min:0',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
            'due_date' => 'required|date',
            'paid_date' => 'nullable|date',
            'status' => 'required|string|in:pending,paid,overdue,cancelled',
            'remark' => 'nullable|string',
        ];
    }
}
