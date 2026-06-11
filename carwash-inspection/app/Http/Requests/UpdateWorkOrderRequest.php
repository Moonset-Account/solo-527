<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehicle_id' => ['sometimes', 'exists:vehicles,id'],
            'technician_id' => ['nullable', 'exists:technicians,id'],
            'station_id' => ['nullable', 'exists:work_stations,id'],
            'service_item_id' => ['sometimes', 'exists:service_items,id'],
            'inspection_template_id' => ['nullable', 'exists:inspection_templates,id'],
            'status' => ['sometimes', 'in:pending,confirmed,in_progress,completed,no_show,cancelled,paid'],
            'scheduled_time' => ['nullable', 'date'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'string'],
            'payment_status' => ['nullable', 'in:unpaid,partial,paid'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
