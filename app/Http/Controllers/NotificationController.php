<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $notifications = $this->notificationService->getUserNotifications(
            $validated['user_id'],
            $validated['limit'] ?? 20
        );

        return response()->json($notifications);
    }

    public function getUnreadCount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $count = $this->notificationService->getUnreadCount($validated['user_id']);

        return response()->json(['unread_count' => $count]);
    }

    public function retryFailed(): JsonResponse
    {
        $count = $this->notificationService->retryFailedNotifications();

        return response()->json(['retried_count' => $count]);
    }

    public function getFailed(Request $request): JsonResponse
    {
        $query = \App\Models\Notification::whereIn('status', ['failed', 'pending_retry'])
            ->with(['user', 'relatedBooking', 'relatedMember', 'relatedCoach']);

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $notifications = $query->orderBy('next_retry_at', 'asc')->paginate(20);

        return response()->json($notifications);
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        $notification = \App\Models\Notification::findOrFail($id);
        $notification->read_at = now();
        $notification->save();

        return response()->json($notification);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        \App\Models\Notification::where('user_id', $validated['user_id'])
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => '全部标记为已读']);
    }
}
