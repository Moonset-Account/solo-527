<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnnotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'practice_recording_id' => 'required|exists:practice_recordings,id',
            'timestamp_ms' => 'required|integer|min:0',
            'content' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'practice_recording_id.required' => '录音ID不能为空',
            'practice_recording_id.exists' => '录音不存在',
            'timestamp_ms.required' => '时间戳不能为空',
            'timestamp_ms.integer' => '时间戳必须是整数',
            'timestamp_ms.min' => '时间戳不能为负数',
            'content.required' => '批注内容不能为空',
            'content.string' => '批注内容必须是字符串',
        ];
    }
}
