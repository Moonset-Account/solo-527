<?php

namespace App\Http\Controllers\Api\Visitor;

use App\Http\Controllers\Controller;
use App\Services\ViolationService;
use App\Models\ParkingViolation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ViolationController extends Controller
{
    public function __construct(protected ViolationService $violationService) {}

    public function myViolations(Request $request): JsonResponse
    {
        $status = $request->input('status');
        $licensePlates = $request->user()->bookingsAsVisitor()
            ->pluck('license_plate')
            ->unique();

        $violations = ParkingViolation::whereIn('license_plate', $licensePlates)
            ->when($status, function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->with(['spot', 'appeals'])
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($violations);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $violation = ParkingViolation::with(['spot', 'appeals', 'booking'])
            ->findOrFail($id);

        return response()->json($violation);
    }

    public function createAppeal(Request $request, int $violationId): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string',
            'existing_evidence' => 'nullable|array',
        ]);

        $attachments = $request->file('attachments', []);

        try {
            $data = $request->only(['reason', 'existing_evidence']);
            $data['violation_id'] = $violationId;
            $data['appellant_id'] = $request->user()->id;

            $appeal = $this->violationService->createAppeal($data, $attachments);

            return response()->json([
                'message' => '申诉提交成功',
                'appeal' => $appeal,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function myAppeals(Request $request): JsonResponse
    {
        $appeals = \App\Models\ViolationAppeal::where('appellant_id', $request->user()->id)
            ->with(['violation', 'reviewer'])
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($appeals);
    }

    public function payViolation(Request $request, int $id): JsonResponse
    {
        $violation = ParkingViolation::findOrFail($id);

        $request->validate([
            'method' => 'required|in:wechat,alipay,cash,card,balance',
        ]);

        try {
            $payment = $this->violationService->payViolation(
                $violation,
                $request->input('method'),
                $request->user()->id
            );

            return response()->json([
                'message' => '罚款支付成功',
                'payment' => $payment,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
