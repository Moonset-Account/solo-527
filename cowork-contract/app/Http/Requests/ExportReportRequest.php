<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExportReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'export_type' => 'nullable|string|in:contracts,bills',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'status' => 'nullable|string',
            'property_id' => 'nullable|integer|exists:properties,id',
            'contract_id' => 'nullable|integer|exists:contracts,id',
        ];
    }
}
