<?php

namespace App\Http\Requests\SystemConfig;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSystemConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage_system_config');
    }

    public function rules(): array
    {
        return [
            'configs' => ['required', 'array'],
            'configs.*' => ['nullable'],
        ];
    }
}
