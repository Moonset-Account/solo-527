<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGreenhouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:greenhouses',
            'location' => 'required|string',
            'area' => 'required|numeric|min:0',
            'crop_type' => 'required|string',
            'status' => 'required|in:active,inactive,maintenance',
            'manager_id' => 'nullable|exists:users,id',
        ];
    }
}
