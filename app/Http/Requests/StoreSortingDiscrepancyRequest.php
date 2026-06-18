<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSortingDiscrepancyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sorting_task_id' => 'required|exists:sorting_tasks,id',
            'discrepancy_type' => 'required',
            'planned_qty' => 'required|numeric',
            'actual_qty' => 'required|numeric',
            'remark' => 'nullable|string',
        ];
    }
}
