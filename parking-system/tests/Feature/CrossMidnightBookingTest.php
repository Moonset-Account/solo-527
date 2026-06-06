<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ParkingSpot;
use App\Models\Booking;
use App\Services\BookingService;
use App\Services\SettlementService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CrossMidnightBookingTest extends TestCase
{
    use RefreshDatabase;

    protected BookingService $bookingService;
    protected SettlementService $settlementService;
    protected User $owner;
    protected User $visitor;
    protected ParkingSpot $spot;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bookingService = app(BookingService::class);
        $this->settlementService = app(SettlementService::class);

        $this->owner = User::factory()->create(['role' => 'owner']);
        $this->visitor = User::factory()->create(['role' => 'visitor']);

        $this->spot = ParkingSpot::factory()->create([
            'owner_id' => $this->owner->id,
            'hourly_rate' => 10,
            'daily_rate' => 80,
        ]);
    }

    public function test_should_detect_cross_midnight_booking(): void
    {
        $startTime = Carbon::today()->setTime(22, 0);
        $endTime = Carbon::tomorrow()->setTime(6, 0);

        $booking = $this->bookingService->createBooking([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'license_plate' => '京A12345',
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);

        $this->assertTrue($booking->cross_midnight);
        $this->assertTrue($booking->isCrossMidnight());
    }

    public function test_should_create_daily_splits_for_cross_midnight_booking(): void
    {
        $startTime = Carbon::today()->setTime(22, 0);
        $endTime = Carbon::tomorrow()->setTime(6, 0);

        $booking = $this->bookingService->createBooking([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'license_plate' => '京A12345',
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);

        $splits = $booking->dailySplits;

        $this->assertCount(2, $splits);
        $this->assertEquals($startTime->toDateString(), $splits[0]->split_date);
        $this->assertEquals($endTime->toDateString(), $splits[1]->split_date);
    }

    public function test_daily_splits_should_have_correct_duration(): void
    {
        $startTime = Carbon::today()->setTime(22, 0);
        $endTime = Carbon::tomorrow()->setTime(6, 0);

        $booking = $this->bookingService->createBooking([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'license_plate' => '京A12345',
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);

        $splits = $booking->dailySplits;
        $totalDuration = $splits->sum('duration_minutes');

        $this->assertEquals(480, $totalDuration);
        $this->assertEquals(120, $splits[0]->duration_minutes);
        $this->assertEquals(360, $splits[1]->duration_minutes);
    }

    public function test_daily_splits_amount_should_match_total(): void
    {
        $startTime = Carbon::today()->setTime(22, 0);
        $endTime = Carbon::tomorrow()->setTime(6, 0);

        $booking = $this->bookingService->createBooking([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'license_plate' => '京A12345',
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);

        $splits = $booking->dailySplits;
        $totalSplitAmount = $splits->sum('segment_amount');
        $totalOwnerShare = $splits->sum('owner_share');
        $totalPlatformShare = $splits->sum('platform_share');

        $this->assertEqualsWithDelta($booking->total_amount, $totalSplitAmount, 0.01);
        $this->assertEqualsWithDelta($booking->owner_earning, $totalOwnerShare, 0.01);
        $this->assertEqualsWithDelta($booking->platform_fee, $totalPlatformShare, 0.01);
    }

    public function test_multi_day_booking_should_have_correct_splits(): void
    {
        $startTime = Carbon::today()->setTime(10, 0);
        $endTime = Carbon::today()->addDays(2)->setTime(14, 0);

        $booking = $this->bookingService->createBooking([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'license_plate' => '京A99999',
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);

        $splits = $booking->dailySplits;
        $this->assertCount(3, $splits);

        $totalDuration = $splits->sum('duration_minutes');
        $this->assertEquals($booking->getDurationInMinutes(), $totalDuration);
    }

    public function test_settlement_should_include_manual_intervention_count(): void
    {
        $startTime = Carbon::now()->subDays(5);
        $endTime = $startTime->copy()->addHours(4);

        $booking = Booking::factory()->create([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => 'completed',
            'manual_intervention_count' => 2,
            'total_amount' => 40,
            'owner_earning' => 36,
            'platform_fee' => 4,
        ]);

        $periodStart = Carbon::now()->subWeek();
        $periodEnd = Carbon::now();

        $settlement = $this->settlementService->generateSettlement(
            $this->owner->id,
            $periodStart,
            $periodEnd
        );

        $this->assertEquals(2, $settlement->manual_intervention_count);
        $this->assertGreaterThan(0, $settlement->total_owner_earning);
    }

    public function test_settlement_should_calculate_shares_correctly(): void
    {
        $startTime = Carbon::now()->subDays(3);
        $endTime = $startTime->copy()->addHours(5);

        Booking::factory()->create([
            'spot_id' => $this->spot->id,
            'visitor_id' => $this->visitor->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => 'completed',
            'total_amount' => 50,
            'owner_earning' => 45,
            'platform_fee' => 5,
        ]);

        $periodStart = Carbon::now()->subWeek();
        $periodEnd = Carbon::now();

        $settlement = $this->settlementService->generateSettlement(
            $this->owner->id,
            $periodStart,
            $periodEnd
        );

        $this->assertEquals(50, $settlement->total_booking_amount);
        $this->assertEquals(45, $settlement->total_owner_earning);
        $this->assertEquals(5, $settlement->total_platform_fee);
        $this->assertEquals(45, $settlement->net_settlement);
    }
}
