<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGridEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|max:200',
            'description' => 'required',
            'location' => 'required|max:200',
            'event_time' => 'required|date',
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => '标题',
            'description' => '描述',
            'location' => '地点',
            'event_time' => '事件时间',
        ];
    }
}
