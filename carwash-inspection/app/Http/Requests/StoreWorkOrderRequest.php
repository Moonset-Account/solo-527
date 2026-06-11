<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'technician_id' => ['nullable', 'exists:technicians,id'],
            'station_id' => ['nullable', 'exists:work_stations,id'],
            'service_item_id' => ['required', 'exists:service_items,id'],
            'inspection_template_id' => ['nullable', 'exists:inspection_templates,id'],
            'scheduled_time' => ['nullable', 'date'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
