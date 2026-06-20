<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Services\NotificationService;
use App\Services\OperationLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class RentReminderController extends Controller
{
    public function check(): JsonResponse
    {
        $cacheKey = 'rent_reminder:' . request()->user()->id;

        $result = Cache::store('redis')->remember($cacheKey, 300, function () {
            $upcoming = Bill::with(['contract.property', 'contract.tenant'])
                ->where('status', 'pending')
                ->where('due_date', '>=', now()->toDateString())
                ->where('due_date', '<=', now()->addDays(7)->toDateString())
                ->orderBy('due_date')
                ->get();

            $overdue = Bill::with(['contract.property', 'contract.tenant'])
                ->where('status', 'pending')
                ->where('due_date', '<', now()->toDateString())
                ->orderBy('due_date')
                ->get();

            return [
                'upcoming' => $upcoming,
                'overdue' => $overdue,
                'checked_at' => now()->toIso8601String(),
            ];
        });

        return response()->json($result);
    }

    public function notify(): JsonResponse
    {
        $user = request()->user();
        $notificationService = app(NotificationService::class);

        $upcoming = Bill::with(['contract.property', 'contract.tenant'])
            ->where('status', 'pending')
            ->where('due_date', '>=', now()->toDateString())
            ->where('due_date', '<=', now()->addDays(7)->toDateString())
            ->orderBy('due_date')
            ->get();

        $overdue = Bill::with(['contract.property', 'contract.tenant'])
            ->where('status', 'pending')
            ->where('due_date', '<', now()->toDateString())
            ->orderBy('due_date')
            ->get();

        $notificationService->sendRentReminder($user, $upcoming, $overdue);

        Cache::store('redis')->forget('rent_reminder:' . $user->id);

        app(OperationLogService::class)->log(
            $user,
            'trigger_rent_reminder',
            Bill::class,
            null,
            ['upcoming_count' => $upcoming->count(), 'overdue_count' => $overdue->count()]
        );

        return response()->json([
            'message' => '收租提醒已发送',
            'upcoming_count' => $upcoming->count(),
            'overdue_count' => $overdue->count(),
        ]);
    }
}
