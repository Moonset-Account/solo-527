<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BatchController extends Controller
{
    public function validateBatch(Request $request)
    {
        $validated = $request->validate([
            'operation' => 'required|string|in:assign_status,assign_owner,move_to_ocean,reclaim_from_ocean,update_quality',
            'lead_ids' => 'required|array|min:1|max:500',
            'lead_ids.*' => 'integer|exists:leads,id',
            'params' => 'required|array',
        ]);

        $operation = $validated['operation'];
        $leadIds = $validated['lead_ids'];
        $params = $validated['params'];

        $failures = [];
        $passed = [];

        $leads = Lead::whereIn('id', $leadIds)->get()->keyBy('id');

        foreach ($leadIds as $index => $leadId) {
            $lead = $leads->get($leadId);
            if (!$lead) {
                $failures[] = [
                    'index' => $index,
                    'lead_id' => $leadId,
                    'reason' => '线索不存在或已删除',
                ];
                continue;
            }

            $errors = $this->validateSingleOperation($lead, $operation, $params);
            if (!empty($errors)) {
                $failures[] = [
                    'index' => $index,
                    'lead_id' => $leadId,
                    'lead_name' => $lead->name,
                    'lead_phone' => $lead->phone,
                    'reasons' => $errors,
                ];
            } else {
                $passed[] = [
                    'index' => $index,
                    'lead_id' => $leadId,
                    'lead_name' => $lead->name,
                    'lead_phone' => $lead->phone,
                    'current_status' => $lead->status_label,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'summary' => [
                'total' => count($leadIds),
                'passed' => count($passed),
                'failed' => count($failures),
            ],
            'passed' => $passed,
            'failures' => $failures,
        ]);
    }

    private function validateSingleOperation(Lead $lead, string $operation, array $params): array
    {
        $errors = [];

        switch ($operation) {
            case 'assign_status':
                $targetStatus = $params['status'] ?? null;
                $allowed = ['new', 'contacted', 'consulting', 'quoted', 'contract_pending', 'signed', 'treatment', 'completed', 'lost', 'ocean'];
                if (!$targetStatus || !in_array($targetStatus, $allowed)) {
                    $errors[] = '目标状态无效，可选值：' . implode('、', $allowed);
                }
                if ($targetStatus === 'signed' && empty($params['contract_amount'])) {
                    $errors[] = '状态改为"已签约"时必须填写合同金额';
                }
                if ($targetStatus === 'contract_pending' && empty($params['contract_pending_explanation'])) {
                    $errors[] = '状态改为"合同待确认"时必须填写待确认说明';
                }
                if ($targetStatus === 'lost' && empty($params['churn_reason_id'])) {
                    $errors[] = '状态改为"已流失"时必须选择流失原因';
                }
                break;

            case 'assign_owner':
                $assigneeId = $params['assignee_id'] ?? null;
                if (!$assigneeId) {
                    $errors[] = '请选择新的责任人';
                } else {
                    $user = User::where('id', $assigneeId)->whereIn('role', ['admin', 'operator'])->first();
                    if (!$user) {
                        $errors[] = '所选责任人不存在或无权限';
                    }
                }
                break;

            case 'move_to_ocean':
                if ($lead->is_in_ocean) {
                    $errors[] = '该线索已在公海中';
                }
                if ($lead->status === 'signed' || $lead->status === 'treatment' || $lead->status === 'completed') {
                    $errors[] = '已签约/治疗中/已完成的线索不可流入公海';
                }
                break;

            case 'reclaim_from_ocean':
                if (!$lead->is_in_ocean) {
                    $errors[] = '该线索不在公海中';
                }
                if (empty($params['assignee_id'])) {
                    $errors[] = '回收时必须指定新的责任人';
                }
                break;

            case 'update_quality':
                $quality = $params['quality'] ?? null;
                if (!in_array($quality, ['A', 'B', 'C', 'D'])) {
                    $errors[] = '线索质量级别必须为 A、B、C、D 之一';
                }
                break;
        }

        if (!auth()->user()->isAdmin()) {
            if ($operation === 'assign_owner' && $params['assignee_id'] ?? null) {
                if ((int) $params['assignee_id'] !== auth()->id()) {
                    $errors[] = '普通运营无权将线索分配给其他人';
                }
            }
        }

        return $errors;
    }

    public function process(Request $request)
    {
        $validated = $request->validate([
            'operation' => 'required|string|in:assign_status,assign_owner,move_to_ocean,reclaim_from_ocean,update_quality',
            'lead_ids' => 'required|array|min:1|max:500',
            'lead_ids.*' => 'integer|exists:leads,id',
            'params' => 'required|array',
            'force' => 'nullable|boolean',
        ]);

        $operation = $validated['operation'];
        $leadIds = $validated['lead_ids'];
        $params = $validated['params'];
        $force = $validated['force'] ?? false;

        $results = [
            'total' => count($leadIds),
            'success' => 0,
            'failed' => 0,
            'failures' => [],
            'success_ids' => [],
        ];

        DB::beginTransaction();
        try {
            $leads = Lead::whereIn('id', $leadIds)->get()->keyBy('id');

            foreach ($leadIds as $index => $leadId) {
                $lead = $leads->get($leadId);
                if (!$lead) {
                    $results['failed']++;
                    $results['failures'][] = [
                        'lead_id' => $leadId,
                        'reasons' => ['线索不存在'],
                    ];
                    continue;
                }

                if (!$force) {
                    $errors = $this->validateSingleOperation($lead, $operation, $params);
                    if (!empty($errors)) {
                        $results['failed']++;
                        $results['failures'][] = [
                            'lead_id' => $leadId,
                            'lead_name' => $lead->name,
                            'lead_phone' => $lead->phone,
                            'reasons' => $errors,
                        ];
                        continue;
                    }
                }

                $ok = $this->applyOperation($lead, $operation, $params);
                if ($ok) {
                    $results['success']++;
                    $results['success_ids'][] = $leadId;
                } else {
                    $results['failed']++;
                    $results['failures'][] = [
                        'lead_id' => $leadId,
                        'lead_name' => $lead->name,
                        'lead_phone' => $lead->phone,
                        'reasons' => ['执行操作时发生未知错误'],
                    ];
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => '批量处理失败：' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => "批量处理完成：成功 {$results['success']} 条，失败 {$results['failed']} 条",
            'results' => $results,
        ]);
    }

    private function applyOperation(Lead $lead, string $operation, array $params): bool
    {
        $operatorId = auth()->id();

        switch ($operation) {
            case 'assign_status':
                $lead->status = $params['status'];
                if (!empty($params['contract_pending_explanation'])) {
                    $lead->contract_pending_explanation = $params['contract_pending_explanation'];
                }
                if (!empty($params['contract_amount'])) {
                    $lead->contract_amount = $params['contract_amount'];
                }
                if (!empty($params['churn_reason_id'])) {
                    $lead->churn_reason_id = $params['churn_reason_id'];
                }
                if ($params['status'] === 'signed' && empty($lead->signed_at)) {
                    $lead->signed_at = now();
                }
                $lead->save();

                $nodeMap = [
                    'contacted' => 'first_contact',
                    'consulting' => 'consultation',
                    'quoted' => 'quote_sent',
                    'contract_pending' => 'contract_sent',
                    'signed' => 'contract_signed',
                    'treatment' => 'treatment_arranged',
                    'lost' => 'lost',
                ];
                if (isset($nodeMap[$params['status']])) {
                    \App\Models\ResponseNode::create([
                        'lead_id' => $lead->id,
                        'node_type' => $nodeMap[$params['status']],
                        'content' => "批量修改状态为：{$params['status']}" . ($params['status'] === 'contract_pending' && !empty($params['contract_pending_explanation']) ? "（{$params['contract_pending_explanation']}）" : ''),
                        'operator_id' => $operatorId,
                    ]);
                }
                return true;

            case 'assign_owner':
                $old = $lead->assignee_id;
                $lead->assignee_id = $params['assignee_id'];
                $lead->is_in_ocean = false;
                $lead->entered_ocean_at = null;
                $lead->save();

                $newUser = User::find($params['assignee_id']);
                \App\Models\ResponseNode::create([
                    'lead_id' => $lead->id,
                    'node_type' => 'follow_up',
                    'content' => '批量分配责任人：' . ($newUser->name ?? '未指定'),
                    'operator_id' => $operatorId,
                ]);
                return true;

            case 'move_to_ocean':
                $lead->is_in_ocean = true;
                $lead->entered_ocean_at = now();
                $lead->status = 'ocean';
                $lead->assignee_id = null;
                $lead->save();

                \App\Models\ResponseNode::create([
                    'lead_id' => $lead->id,
                    'node_type' => 'follow_up',
                    'content' => '批量流入公海池',
                    'operator_id' => $operatorId,
                ]);
                return true;

            case 'reclaim_from_ocean':
                $lead->is_in_ocean = false;
                $lead->entered_ocean_at = null;
                $lead->assignee_id = $params['assignee_id'];
                if ($lead->status === 'ocean') {
                    $lead->status = 'contacted';
                }
                $lead->save();

                $newUser = User::find($params['assignee_id']);
                \App\Models\ResponseNode::create([
                    'lead_id' => $lead->id,
                    'node_type' => 'first_contact',
                    'content' => '从公海回收，责任人：' . ($newUser->name ?? '未指定'),
                    'operator_id' => $operatorId,
                ]);
                return true;

            case 'update_quality':
                $lead->quality = $params['quality'];
                $lead->save();

                \App\Models\ResponseNode::create([
                    'lead_id' => $lead->id,
                    'node_type' => 'follow_up',
                    'content' => "批量调整线索质量为：{$params['quality']}级",
                    'operator_id' => $operatorId,
                ]);
                return true;
        }

        return false;
    }
}
