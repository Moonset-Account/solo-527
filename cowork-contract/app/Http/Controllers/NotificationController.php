<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response|JsonResponse
    {
        $query = Notification::where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', request()->user()->id);

        if (request()->filled('status')) {
            if (request()->input('status') === 'unread') {
                $query->whereNull('read_at');
            } elseif (request()->input('status') === 'read') {
                $query->whereNotNull('read_at');
            }
        }

        $notifications = $query->orderByDesc('id')->paginate(request()->input('per_page', 15));

        if (request()->expectsJson() || request()->is('api/*')) {
            return response()->json([
                'data' => $notifications->items(),
                'meta' => [
                    'total' => $notifications->total(),
                    'per_page' => $notifications->perPage(),
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'unread_count' => Notification::where('notifiable_type', 'App\\Models\\User')
                        ->where('notifiable_id', request()->user()->id)
                        ->whereNull('read_at')
                        ->count(),
                ],
            ]);
        }

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(Notification $notification): RedirectResponse|JsonResponse
    {
        if ($notification->notifiable_id !== request()->user()->id) {
            if (request()->expectsJson() || request()->is('api/*')) {
                return response()->json(['message' => '无权操作此通知'], 403);
            }
            abort(403);
        }

        $notification->update(['read_at' => $notification->read_at ?? now()]);

        if (request()->expectsJson() || request()->is('api/*')) {
            return response()->json([
                'message' => '通知已标记为已读',
                'notification' => $notification,
            ]);
        }

        return redirect()->route('notifications.index')
            ->with('success', '通知已标记为已读');
    }

    public function markAllRead(): RedirectResponse|JsonResponse
    {
        $count = Notification::where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', request()->user()->id)
            ->whereNull('read_at')
            ->count();

        Notification::where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', request()->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        if (request()->expectsJson() || request()->is('api/*')) {
            return response()->json([
                'message' => '所有通知已标记为已读',
                'marked_count' => $count,
            ]);
        }

        return redirect()->route('notifications.index')
            ->with('success', '所有通知已标记为已读');
    }
}
