<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
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

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(Notification $notification)
    {
        if ($notification->notifiable_id !== request()->user()->id) {
            abort(403);
        }

        $notification->update(['read_at' => $notification->read_at ?? now()]);

        return redirect()->route('notifications.index')
            ->with('success', '通知已标记为已读');
    }

    public function markAllRead()
    {
        Notification::where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', request()->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return redirect()->route('notifications.index')
            ->with('success', '所有通知已标记为已读');
    }
}
