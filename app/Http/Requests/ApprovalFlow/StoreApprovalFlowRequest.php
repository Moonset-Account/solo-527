<?php

namespace App\Http\Requests\ApprovalFlow;

use Illuminate\Foundation\Http\FormRequest;

class StoreApprovalFlowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\ApprovalFlow::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:approval_flows'],
            'description' => ['nullable', 'string'],
            'entity_type' => ['required', 'string', 'max:50'],
            'is_default' => ['boolean'],
            'is_active' => ['boolean'],
            'min_amount' => ['nullable', 'numeric', 'min:0'],
            'max_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => '请输入流程名称',
            'code.required' => '请输入流程编码',
            'code.unique' => '流程编码已存在',
            'entity_type.required' => '请选择适用对象',
        ];
    }
}
