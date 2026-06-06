<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ParkingSpot;
use App\Models\Booking;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class BookingConflictTest extends TestCase
{
    use RefreshDatabase;

    protected BookingService $bookingService;
    protected User $owner;
    protected User $visitor;
    protected ParkingSpot $spot;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bookingService = app(BookingService::class);

        $this->owner = User::factory()->create(['role' => 'owner']);
        $this->visitor = User::factory()->create(['role' => 'visitor']);

        $this->spot = ParkingSpot::factory()->create([
            'owner_id' => $this->owner->id,
            'hourly_rate' => 10,
            'daily_rate' => 80,
        ]);
    }

    public function test_should_detect_time_conflict(): void
    {
        $startTime = Carbon::now()->addHour();
        $endTime = $startTime->copy()->addHours(2);

        Booking::factory()->create([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => 'confirmed',
        ]);

        $conflictStart = $startTime->copy()->addHour();
        $conflictEnd = $conflictStart->copy()->addHour();

        $hasConflict = $this->bookingService->checkTimeConflict(
            $this->spot->id,
            $conflictStart,
            $conflictEnd
        );

        $this->assertTrue($hasConflict);
    }

    public function test_should_not_detect_conflict_for_non_overlapping_times(): void
    {
        $startTime = Carbon::now()->addHour();
        $endTime = $startTime->copy()->addHours(2);

        Booking::factory()->create([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => 'confirmed',
        ]);

        $laterStart = $endTime->copy()->addMinute();
        $laterEnd = $laterStart->copy()->addHour();

        $hasConflict = $this->bookingService->checkTimeConflict(
            $this->spot->id,
            $laterStart,
            $laterEnd
        );

        $this->assertFalse($hasConflict);
    }

    public function test_should_prevent_creating_conflicting_booking(): void
    {
        $startTime = Carbon::now()->addHour();
        $endTime = $startTime->copy()->addHours(2);

        Booking::factory()->create([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => 'confirmed',
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('该时段已被预约');

        $this->bookingService->createBooking([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'license_plate' => '京A12345',
            'start_time' => $startTime->copy()->addHour(),
            'end_time' => $startTime->copy()->addHours(3),
        ]);
    }

    public function test_should_rollback_booking_on_conflict(): void
    {
        $startTime = Carbon::now()->addHour();
        $endTime = $startTime->copy()->addHours(2);

        $booking = Booking::factory()->create([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => 'confirmed',
            'total_amount' => 20,
        ]);

        $bookingId = $booking->id;
        $result = $this->bookingService->rollbackBooking($booking);

        $this->assertTrue($result);
        $this->assertNull(Booking::find($bookingId));
        $this->assertDatabaseMissing('bookings', ['id' => $bookingId]);
        $this->assertDatabaseMissing('booking_daily_splits', ['booking_id' => $bookingId]);
    }

    public function test_concurrent_booking_should_only_succeed_once(): void
    {
        $startTime = Carbon::now()->addHour();
        $endTime = $startTime->copy()->addHours(2);

        $visitor2 = User::factory()->create(['role' => 'visitor']);

        $lockKey1 = $this->bookingService->lockSpot(
            $this->spot->id,
            $startTime,
            $endTime,
            $this->visitor->id
        );

        $this->assertNotNull($lockKey1);

        $lockKey2 = $this->bookingService->lockSpot(
            $this->spot->id,
            $startTime,
            $endTime,
            $visitor2->id
        );

        $this->assertNull($lockKey2);
    }
}
