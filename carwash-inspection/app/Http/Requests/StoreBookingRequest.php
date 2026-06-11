<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plate_number' => ['required', 'string', 'max:20'],
            'make' => ['required_without:vehicle_id', 'string', 'max:255'],
            'model' => ['required_without:vehicle_id', 'string', 'max:255'],
            'owner_name' => ['required_without:vehicle_id', 'string', 'max:255'],
            'owner_phone' => ['required', 'string', 'max:20'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'color' => ['nullable', 'string', 'max:50'],
            'service_item_id' => ['required', 'exists:service_items,id'],
            'scheduled_time' => ['required', 'date', 'after:now'],
        ];
    }
}
