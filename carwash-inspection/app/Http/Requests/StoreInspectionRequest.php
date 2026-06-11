<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string'],
            'items.*.category' => ['required', 'string'],
            'items.*.result' => ['required', 'in:pass,fail,warning,skip'],
            'items.*.remarks' => ['nullable', 'string'],
        ];
    }
}
