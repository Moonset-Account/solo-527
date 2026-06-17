<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function callback(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notification_id' => 'required|integer',
            'status' => 'required|in:success,failed',
            'reason' => 'nullable|string',
            'data' => 'nullable|array',
        ]);

        if ($validated['status'] === 'failed') {
            $notification = $this->notificationService->trackFailure(
                $validated['notification_id'],
                $validated['reason'] ?? '未知错误'
            );
        }

        return response()->json([
            'success' => true,
            'message' => '回调已处理',
        ]);
    }

    public function failures(): JsonResponse
    {
        $statistics = $this->notificationService->getFailureStatistics();

        return response()->json([
            'success' => true,
            'data' => $statistics,
        ]);
    }

    public function retry(Request $request, $id): JsonResponse
    {
        $notification = $this->notificationService->retryNotification((int) $id);

        return response()->json([
            'success' => true,
            'message' => '通知已重试',
            'data' => [
                'notification_id' => $notification->id,
                'status' => $notification->status,
                'retry_count' => $notification->retry_count,
            ],
        ]);
    }
}
