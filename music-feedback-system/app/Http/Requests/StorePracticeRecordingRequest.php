<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePracticeRecordingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:students,id',
            'assignment_id' => 'required|exists:assignments,id',
            'file' => 'required|file|mimes:mp3,wav,m4a,ogg|max:51200',
            'duration_seconds' => 'nullable|integer|min:0',
            'note' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => '学生ID不能为空',
            'student_id.exists' => '学生不存在',
            'assignment_id.required' => '作业ID不能为空',
            'assignment_id.exists' => '作业不存在',
            'file.required' => '录音文件不能为空',
            'file.file' => '上传内容必须是文件',
            'file.mimes' => '录音文件格式仅支持mp3,wav,m4a,ogg',
            'file.max' => '录音文件不能超过50MB',
            'duration_seconds.integer' => '录音时长必须是整数',
            'duration_seconds.min' => '录音时长不能为负数',
            'note.string' => '备注必须是字符串',
        ];
    }
}
