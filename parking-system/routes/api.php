<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Visitor\BookingController as VisitorBookingController;
use App\Http\Controllers\Api\Visitor\ViolationController as VisitorViolationController;
use App\Http\Controllers\Api\Owner\ParkingSpotController as OwnerParkingSpotController;
use App\Http\Controllers\Api\Property\ManagementController as PropertyManagementController;

Route::prefix('v1')->group(function () {

    Route::prefix('visitor')->middleware(['auth:sanctum'])->group(function () {
        Route::prefix('bookings')->group(function () {
            Route::post('/check-availability', [VisitorBookingController::class, 'checkAvailability']);
            Route::post('/lock-spot', [VisitorBookingController::class, 'lockSpot']);
            Route::post('/', [VisitorBookingController::class, 'create']);
            Route::get('/', [VisitorBookingController::class, 'myBookings']);
            Route::get('/{id}', [VisitorBookingController::class, 'show']);
            Route::post('/{id}/cancel', [VisitorBookingController::class, 'cancel']);
            Route::post('/{id}/pay', [VisitorBookingController::class, 'pay']);
        });

        Route::prefix('violations')->group(function () {
            Route::get('/', [VisitorViolationController::class, 'myViolations']);
            Route::get('/appeals', [VisitorViolationController::class, 'myAppeals']);
            Route::get('/{id}', [VisitorViolationController::class, 'show']);
            Route::post('/{id}/appeal', [VisitorViolationController::class, 'createAppeal']);
            Route::post('/{id}/pay', [VisitorViolationController::class, 'payViolation']);
        });
    });

    Route::prefix('owner')->middleware(['auth:sanctum'])->group(function () {
        Route::prefix('spots')->group(function () {
            Route::get('/', [OwnerParkingSpotController::class, 'index']);
            Route::post('/', [OwnerParkingSpotController::class, 'store']);
            Route::get('/{id}', [OwnerParkingSpotController::class, 'show']);
            Route::put('/{id}', [OwnerParkingSpotController::class, 'update']);
            Route::post('/{id}/availability', [OwnerParkingSpotController::class, 'addAvailability']);
            Route::get('/{id}/bookings', [OwnerParkingSpotController::class, 'getBookings']);
        });

        Route::prefix('settlements')->group(function () {
            Route::get('/summary', [OwnerParkingSpotController::class, 'getSettlementSummary']);
            Route::get('/', [OwnerParkingSpotController::class, 'getSettlements']);
        });
    });

    Route::prefix('property')->middleware(['auth:sanctum'])->group(function () {
        Route::get('/dashboard', [PropertyManagementController::class, 'dashboard']);

        Route::prefix('plate-recognition')->group(function () {
            Route::post('/callback', [PropertyManagementController::class, 'plateRecognitionCallback']);
        });

        Route::prefix('entry-records')->group(function () {
            Route::get('/', [PropertyManagementController::class, 'getEntryRecords']);
            Route::post('/manual', [PropertyManagementController::class, 'manualEntry']);
            Route::post('/{id}/correct', [PropertyManagementController::class, 'correctEntry']);
            Route::post('/manual-release', [PropertyManagementController::class, 'manualRelease']);
            Route::get('/manual-stats', [PropertyManagementController::class, 'getManualStats']);
        });

        Route::prefix('bookings')->group(function () {
            Route::get('/', [PropertyManagementController::class, 'getBookings']);
        });

        Route::prefix('violations')->group(function () {
            Route::get('/', [PropertyManagementController::class, 'getViolations']);
            Route::post('/', [PropertyManagementController::class, 'createViolation']);
            Route::post('/{id}/confirm', [PropertyManagementController::class, 'confirmViolation']);
        });

        Route::prefix('appeals')->group(function () {
            Route::get('/', [PropertyManagementController::class, 'getAppeals']);
            Route::post('/{id}/review', [PropertyManagementController::class, 'reviewAppeal']);
        });

        Route::prefix('settlements')->group(function () {
            Route::get('/', [PropertyManagementController::class, 'getSettlements']);
            Route::post('/generate', [PropertyManagementController::class, 'generateSettlement']);
            Route::post('/{id}/complete', [PropertyManagementController::class, 'completeSettlement']);
        });
    });

    Route::prefix('public')->group(function () {
        Route::get('/spots', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\ParkingSpot::where('status', 'active')
                ->with('owner:id,name');

            if ($request->has('location')) {
                $query->where('location', 'like', "%{$request->input('location')}%");
            }

            return response()->json($query->paginate(20));
        });

        Route::get('/spots/{id}/availability', function ($id, \Illuminate\Http\Request $request) {
            $spot = \App\Models\ParkingSpot::findOrFail($id);
            $startDate = \Carbon\Carbon::parse($request->input('start_date', 'today'));
            $endDate = \Carbon\Carbon::parse($request->input('end_date', '+7 days'));

            $bookings = \App\Models\Booking::where('spot_id', $id)
                ->whereNotIn('status', ['cancelled', 'refunded'])
                ->whereBetween('start_time', [$startDate, $endDate])
                ->select('id', 'start_time', 'end_time', 'status')
                ->get();

            return response()->json([
                'spot' => $spot,
                'booked_slots' => $bookings,
            ]);
        });
    });
});
