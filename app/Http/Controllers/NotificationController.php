<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = auth()->user()->notifications()->latest();

        if ($type = $request->input('type')) {
            $query->byType($type);
        }

        if ($level = $request->input('level')) {
            $query->byLevel($level);
        }

        if ($read = $request->input('read')) {
            if ($read === 'yes') {
                $query->read();
            } elseif ($read === 'no') {
                $query->unread();
            }
        }

        $notifications = $query->paginate(20)->withQueryString();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'filters' => $request->all(),
            'unreadCount' => auth()->user()->unreadNotificationsCount(),
        ]);
    }

    public function show(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            abort(403);
        }

        $notification->markAsRead();

        return Inertia::render('Notifications/Show', [
            'notification' => $notification,
        ]);
    }

    public function markAsRead(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            abort(403);
        }

        $notification->markAsRead();

        return back()->with('success', '通知已标记为已读');
    }

    public function markAsUnread(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            abort(403);
        }

        $notification->markAsUnread();

        return back()->with('success', '通知已标记为未读');
    }

    public function markAllAsRead()
    {
        Notification::markAllAsReadForUser(auth()->user());

        return back()->with('success', '所有通知已标记为已读');
    }

    public function destroy(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            abort(403);
        }

        $notification->delete();

        return back()->with('success', '通知已删除');
    }

    public function getUnreadCount()
    {
        return response()->json([
            'count' => auth()->user()->unreadNotificationsCount(),
        ]);
    }

    public function getLatest()
    {
        $notifications = auth()->user()->notifications()
            ->unread()
            ->latest()
            ->take(10)
            ->get();

        return response()->json($notifications);
    }
}
