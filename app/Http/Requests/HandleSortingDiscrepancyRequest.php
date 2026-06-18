<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HandleSortingDiscrepancyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'remark' => 'required|string',
            'handling_result' => 'required|string',
            'social_impact' => 'nullable|array',
        ];
    }
}
