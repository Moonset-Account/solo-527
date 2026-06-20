<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CloseRiskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'close_remark' => 'required|string|max:1000',
        ];
    }
}
