<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSortingTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_id' => 'required|exists:orders,id',
            'greenhouse_id' => 'required|exists:greenhouses,id',
            'assigned_to' => 'nullable|exists:users,id',
            'planned_quantity' => 'required|numeric|min:0',
            'planned_sort_date' => 'required|date',
        ];
    }
}
