<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\EntryRecord;
use App\Models\ParkingViolation;
use App\Models\ViolationAppeal;
use App\Models\ParkingSpot;
use App\Models\Settlement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PropertyController extends Controller
{
    public function dashboard(): View
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::today()->startOfMonth();

        $stats = [
            'today_bookings' => Booking::whereDate('start_time', $today)->count(),
            'today_entries' => EntryRecord::whereDate('occurred_at', $today)->count(),
            'pending_violations' => ParkingViolation::where('status', 'pending')->count(),
            'pending_appeals' => ViolationAppeal::where('status', 'pending')->count(),
            'month_revenue' => Booking::whereMonth('created_at', $startOfMonth->month)
                ->whereNotIn('status', ['cancelled', 'refunded'])
                ->sum('total_amount'),
            'manual_interventions' => Booking::whereMonth('created_at', $startOfMonth->month)
                ->sum('manual_intervention_count'),
            'active_spots' => ParkingSpot::where('status', 'active')->count(),
            'total_users' => User::where('is_active', true)->count(),
        ];

        $recentBookings = Booking::with('spot', 'visitor')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $recentEntries = EntryRecord::with('spot', 'booking')
            ->orderByDesc('occurred_at')
            ->limit(10)
            ->get();

        return view('admin.property.dashboard', compact('stats', 'recentBookings', 'recentEntries'));
    }

    public function payments(Request $request): View
    {
        $status = $request->input('status');
        $type = $request->input('type');

        $payments = Payment::with(['booking', 'user'])
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($type, fn($q) => $q->where('type', $type))
            ->orderByDesc('created_at')
            ->paginate(20);

        $summary = [
            'total' => Payment::sum('amount'),
            'success' => Payment::where('status', 'success')->sum('amount'),
            'refunded' => Payment::whereIn('status', ['refunded', 'partial_refund'])->sum('amount'),
        ];

        return view('admin.property.payments', compact('payments', 'summary'));
    }

    public function entryRecords(Request $request): View
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $type = $request->input('type');
        $isManual = $request->input('is_manual');
        $licensePlate = $request->input('license_plate');

        $records = EntryRecord::with(['booking', 'spot', 'operator'])
            ->when($startDate, fn($q) => $q->where('occurred_at', '>=', Carbon::parse($startDate)))
            ->when($endDate, fn($q) => $q->where('occurred_at', '<=', Carbon::parse($endDate)))
            ->when($type, fn($q) => $q->where('type', $type))
            ->when($isManual, fn($q) => $q->whereIn('recognition_method', ['manual', 'corrected'])->orWhere('is_manual_release', true))
            ->when($licensePlate, fn($q) => $q->where('license_plate', 'like', "%{$licensePlate}%"))
            ->orderByDesc('occurred_at')
            ->paginate(20);

        $manualStats = [
            'total' => EntryRecord::whereIn('recognition_method', ['manual', 'corrected'])->orWhere('is_manual_release', true)->count(),
            'today' => EntryRecord::whereDate('occurred_at', Carbon::today())
                ->where(function($q) {
                    $q->whereIn('recognition_method', ['manual', 'corrected'])
                        ->orWhere('is_manual_release', true);
                })->count(),
        ];

        return view('admin.property.entry-records', compact('records', 'manualStats'));
    }

    public function violations(Request $request): View
    {
        $status = $request->input('status');
        $hasAppeal = $request->input('has_appeal');
        $licensePlate = $request->input('license_plate');

        $violations = ParkingViolation::with(['spot', 'booking', 'appeals'])
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($hasAppeal, fn($q) => $q->where('has_appeal', true))
            ->when($licensePlate, fn($q) => $q->where('license_plate', 'like', "%{$licensePlate}%"))
            ->orderByDesc('created_at')
            ->paginate(20);

        return view('admin.property.violations', compact('violations'));
    }

    public function appeals(Request $request): View
    {
        $status = $request->input('status');

        $appeals = ViolationAppeal::with(['violation', 'appellant', 'reviewer'])
            ->when($status, fn($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(20);

        return view('admin.property.appeals', compact('appeals'));
    }

    public function spotRevenue(Request $request): View
    {
        $ownerId = $request->input('owner_id');
        $startDate = $request->input('start_date', Carbon::now()->subMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        $spots = ParkingSpot::with('owner')
            ->when($ownerId, fn($q) => $q->where('owner_id', $ownerId))
            ->withSum(['bookings' => function($q) use ($startDate, $endDate) {
                $q->whereNotIn('status', ['cancelled', 'refunded'])
                    ->whereBetween('start_time', [Carbon::parse($startDate), Carbon::parse($endDate)]);
            }], 'total_amount')
            ->withSum(['bookings' => function($q) use ($startDate, $endDate) {
                $q->whereNotIn('status', ['cancelled', 'refunded'])
                    ->whereBetween('start_time', [Carbon::parse($startDate), Carbon::parse($endDate)]);
            }], 'owner_earning')
            ->withCount(['bookings' => function($q) use ($startDate, $endDate) {
                $q->whereNotIn('status', ['cancelled', 'refunded'])
                    ->whereBetween('start_time', [Carbon::parse($startDate), Carbon::parse($endDate)]);
            }])
            ->paginate(15);

        $owners = User::where('role', 'owner')->get(['id', 'name']);

        return view('admin.property.spot-revenue', compact('spots', 'owners'));
    }

    public function settlements(Request $request): View
    {
        $status = $request->input('status');
        $ownerId = $request->input('owner_id');

        $settlements = Settlement::with(['owner', 'items'])
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($ownerId, fn($q) => $q->where('owner_id', $ownerId))
            ->orderByDesc('period_end')
            ->paginate(15);

        $owners = User::where('role', 'owner')->get(['id', 'name']);

        $totalManualInterventions = Settlement::sum('manual_intervention_count');

        return view('admin.property.settlements', compact('settlements', 'owners', 'totalManualInterventions'));
    }

    public function settlementDetail(int $id): View
    {
        $settlement = Settlement::with(['owner', 'items.booking', 'items.violation'])
            ->findOrFail($id);

        return view('admin.property.settlement-detail', compact('settlement'));
    }

    public function bookings(Request $request): View
    {
        $status = $request->input('status');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $licensePlate = $request->input('license_plate');

        $bookings = Booking::with(['spot', 'visitor', 'payments', 'entryRecords'])
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($startDate, fn($q) => $q->where('start_time', '>=', Carbon::parse($startDate)))
            ->when($endDate, fn($q) => $q->where('end_time', '<=', Carbon::parse($endDate)))
            ->when($licensePlate, fn($q) => $q->where('license_plate', 'like', "%{$licensePlate}%"))
            ->orderByDesc('created_at')
            ->paginate(20);

        return view('admin.property.bookings', compact('bookings'));
    }

    public function confirmViolation(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        $violation = ParkingViolation::findOrFail($id);

        try {
            $violation->update([
                'status' => 'confirmed',
                'processed_by' => $request->user()?->id,
                'processed_at' => now(),
            ]);

            return redirect()->back()->with('success', '违停记录已确认');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function completeSettlement(Request $request, int $id): \Illuminate\Http\RedirectResponse
    {
        $settlement = Settlement::findOrFail($id);

        try {
            $settlement->update([
                'status' => 'completed',
                'settled_at' => now(),
            ]);

            return redirect()->back()->with('success', '结算已完成');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
