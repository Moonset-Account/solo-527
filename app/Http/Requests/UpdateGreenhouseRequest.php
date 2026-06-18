<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGreenhouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:greenhouses,code,' . $this->route('greenhouse')->id,
            'location' => 'required|string',
            'area' => 'required|numeric|min:0',
            'crop_type' => 'required|string',
            'status' => 'required|in:active,inactive,maintenance',
            'manager_id' => 'nullable|exists:users,id',
        ];
    }
}
