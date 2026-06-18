<?php

namespace App\Http\Requests\FinancialReview;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFinancialReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('financialReview'));
    }

    public function rules(): array
    {
        return [
            'budget_check' => ['sometimes', 'boolean'],
            'budget_check_note' => ['nullable', 'string', 'max:500'],
            'price_comparison' => ['sometimes', 'boolean'],
            'price_comparison_note' => ['nullable', 'string', 'max:500'],
            'vendor_check' => ['sometimes', 'boolean'],
            'vendor_check_note' => ['nullable', 'string', 'max:500'],
            'additional_checks' => ['nullable', 'array'],
            'comments' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
