<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkNoShowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string'],
            'contact_attempts' => ['nullable', 'integer', 'min:0'],
            'rescheduled' => ['nullable', 'boolean'],
        ];
    }
}
