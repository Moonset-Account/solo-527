<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\CoachController;
use App\Http\Controllers\CourseTypeController;
use App\Http\Controllers\CoursePackageController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\TransferRequestController;
use App\Http\Controllers\RefundRequestController;
use App\Http\Controllers\NotificationController;

Route::prefix('members')->group(function () {
    Route::get('/', [MemberController::class, 'index']);
    Route::post('/', [MemberController::class, 'store']);
    Route::get('/{id}', [MemberController::class, 'show']);
    Route::put('/{id}', [MemberController::class, 'update']);
    Route::delete('/{id}', [MemberController::class, 'destroy']);
    Route::get('/{id}/bookings', [MemberController::class, 'getBookings']);
    Route::get('/{id}/packages', [MemberController::class, 'getPackages']);
    Route::get('/{id}/lesson-balance', [MemberController::class, 'getLessonBalance']);
});

Route::prefix('coaches')->group(function () {
    Route::get('/', [CoachController::class, 'index']);
    Route::post('/', [CoachController::class, 'store']);
    Route::get('/{id}', [CoachController::class, 'show']);
    Route::put('/{id}', [CoachController::class, 'update']);
    Route::delete('/{id}', [CoachController::class, 'destroy']);
    Route::get('/{id}/calendar', [CoachController::class, 'getCalendar']);
    Route::get('/{id}/available-slots', [CoachController::class, 'getAvailableSlots']);
    Route::get('/{id}/stats', [CoachController::class, 'getStats']);
    Route::get('/{id}/available-times', [CoachController::class, 'getAvailableTimes']);
    Route::post('/{id}/available-times', [CoachController::class, 'addAvailableTime']);
    Route::delete('/{id}/available-times/{timeId}', [CoachController::class, 'removeAvailableTime']);
});

Route::prefix('course-types')->group(function () {
    Route::get('/', [CourseTypeController::class, 'index']);
    Route::post('/', [CourseTypeController::class, 'store']);
    Route::get('/{id}', [CourseTypeController::class, 'show']);
    Route::put('/{id}', [CourseTypeController::class, 'update']);
    Route::delete('/{id}', [CourseTypeController::class, 'destroy']);
});

Route::prefix('course-packages')->group(function () {
    Route::get('/', [CoursePackageController::class, 'index']);
    Route::post('/', [CoursePackageController::class, 'store']);
    Route::get('/{id}', [CoursePackageController::class, 'show']);
    Route::put('/{id}', [CoursePackageController::class, 'update']);
    Route::delete('/{id}', [CoursePackageController::class, 'destroy']);
});

Route::prefix('bookings')->group(function () {
    Route::get('/', [BookingController::class, 'index']);
    Route::post('/', [BookingController::class, 'store']);
    Route::get('/{id}', [BookingController::class, 'show']);
    Route::post('/{id}/cancel', [BookingController::class, 'cancel']);
    Route::post('/{id}/reschedule', [BookingController::class, 'reschedule']);
});

Route::prefix('attendances')->group(function () {
    Route::get('/', [AttendanceController::class, 'index']);
    Route::get('/pending-reviews', [AttendanceController::class, 'getPendingReviews']);
    Route::get('/{id}', [AttendanceController::class, 'show']);
    Route::post('/booking/{bookingId}/member-checkin', [AttendanceController::class, 'memberCheckIn']);
    Route::post('/booking/{bookingId}/coach-sign', [AttendanceController::class, 'coachSign']);
    Route::post('/{attendanceId}/approve-sign', [AttendanceController::class, 'approveCoachSign']);
    Route::post('/{attendanceId}/reject-sign', [AttendanceController::class, 'rejectCoachSign']);
    Route::post('/booking/{bookingId}/mark-absent', [AttendanceController::class, 'markAbsent']);
});

Route::prefix('leave-requests')->group(function () {
    Route::get('/', [LeaveRequestController::class, 'index']);
    Route::get('/pending', [LeaveRequestController::class, 'getPending']);
    Route::post('/', [LeaveRequestController::class, 'store']);
    Route::get('/{id}', [LeaveRequestController::class, 'show']);
    Route::post('/{id}/approve', [LeaveRequestController::class, 'approve']);
    Route::post('/{id}/reject', [LeaveRequestController::class, 'reject']);
    Route::post('/{id}/withdraw', [LeaveRequestController::class, 'withdraw']);
    Route::post('/{id}/resubmit', [LeaveRequestController::class, 'resubmit']);
    Route::get('/member/{memberId}', [LeaveRequestController::class, 'getMemberRequests']);
});

Route::prefix('transfer-requests')->group(function () {
    Route::get('/', [TransferRequestController::class, 'index']);
    Route::get('/pending', [TransferRequestController::class, 'getPending']);
    Route::post('/', [TransferRequestController::class, 'store']);
    Route::get('/{id}', [TransferRequestController::class, 'show']);
    Route::post('/{id}/approve', [TransferRequestController::class, 'approve']);
    Route::post('/{id}/reject', [TransferRequestController::class, 'reject']);
    Route::post('/{id}/withdraw', [TransferRequestController::class, 'withdraw']);
    Route::post('/{id}/resubmit', [TransferRequestController::class, 'resubmit']);
    Route::get('/member/{memberId}', [TransferRequestController::class, 'getMemberRequests']);
});

Route::prefix('refund-requests')->group(function () {
    Route::get('/', [RefundRequestController::class, 'index']);
    Route::get('/pending', [RefundRequestController::class, 'getPending']);
    Route::get('/approved', [RefundRequestController::class, 'getApprovedForCompletion']);
    Route::post('/', [RefundRequestController::class, 'store']);
    Route::get('/{id}', [RefundRequestController::class, 'show']);
    Route::post('/{id}/approve', [RefundRequestController::class, 'approve']);
    Route::post('/{id}/reject', [RefundRequestController::class, 'reject']);
    Route::post('/{id}/withdraw', [RefundRequestController::class, 'withdraw']);
    Route::post('/{id}/resubmit', [RefundRequestController::class, 'resubmit']);
    Route::post('/{id}/complete', [RefundRequestController::class, 'complete']);
    Route::get('/member/{memberId}', [RefundRequestController::class, 'getMemberRequests']);
});

Route::prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::get('/failed', [NotificationController::class, 'getFailed']);
    Route::post('/retry-failed', [NotificationController::class, 'retryFailed']);
    Route::post('/{id}/mark-read', [NotificationController::class, 'markAsRead']);
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
});
