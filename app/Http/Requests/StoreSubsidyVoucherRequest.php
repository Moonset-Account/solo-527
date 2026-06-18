<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubsidyVoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'voucher_no' => 'required|unique:subsidy_vouchers',
            'greenhouse_id' => 'required',
            'subsidy_type' => 'required',
            'amount' => 'required|numeric|min:0',
            'apply_date' => 'required|date',
        ];
    }
}
