<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_user_id' => 'nullable|exists:users,id',
            'student_id' => 'nullable|exists:students,id',
            'piece_id' => 'nullable|exists:pieces,id',
            'title' => 'nullable|string|max:200',
            'description' => 'nullable|string',
            'bpm_requirement' => 'nullable|integer|min:30|max:300',
            'beat_time_signature' => 'nullable|string|max:20',
            'due_date' => 'nullable|date',
            'status' => 'nullable|in:draft,published,submitted,reviewed,completed,cancelled',
        ];
    }

    public function messages(): array
    {
        return [
            'teacher_user_id.exists' => '教师不存在',
            'student_id.exists' => '学生不存在',
            'piece_id.exists' => '曲目不存在',
            'title.string' => '作业标题必须是字符串',
            'title.max' => '作业标题不能超过200个字符',
            'description.string' => '描述必须是字符串',
            'bpm_requirement.integer' => 'BPM要求必须是整数',
            'bpm_requirement.min' => 'BPM不能低于30',
            'bpm_requirement.max' => 'BPM不能超过300',
            'beat_time_signature.string' => '拍号必须是字符串',
            'beat_time_signature.max' => '拍号不能超过20个字符',
            'due_date.date' => '截止日期格式不正确',
            'status.in' => '状态值不合法',
        ];
    }
}
