<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResolveExceptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'resolved_by' => 'required|exists:users,id',
        ];
    }

    public function attributes(): array
    {
        return [
            'resolved_by' => '解决人',
        ];
    }
}
