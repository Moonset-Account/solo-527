<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ParkingSpot;
use App\Models\ParkingViolation;
use App\Services\ViolationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ViolationAppealTest extends TestCase
{
    use RefreshDatabase;

    protected ViolationService $violationService;
    protected User $owner;
    protected User $visitor;
    protected User $property;
    protected ParkingSpot $spot;

    protected function setUp(): void
    {
        parent::setUp();
        $this->violationService = app(ViolationService::class);

        $this->owner = User::factory()->create(['role' => 'owner']);
        $this->visitor = User::factory()->create(['role' => 'visitor']);
        $this->property = User::factory()->create(['role' => 'property']);

        $this->spot = ParkingSpot::factory()->create([
            'owner_id' => $this->owner->id,
            'hourly_rate' => 10,
        ]);
    }

    public function test_should_create_violation(): void
    {
        $violation = $this->violationService->createViolation([
            'spot_id' => $this->spot->id,
            'license_plate' => '京A12345',
            'type' => 'no_booking',
            'violation_time' => Carbon::now(),
            'description' => '无预约停车',
        ]);

        $this->assertNotNull($violation->violation_no);
        $this->assertEquals('pending', $violation->status);
        $this->assertEquals(200, $violation->fine_amount);
    }

    public function test_should_not_create_duplicate_fine_during_appeal_lock(): void
    {
        $violation = $this->violationService->createViolation([
            'spot_id' => $this->spot->id,
            'license_plate' => '京A12345',
            'type' => 'no_booking',
            'violation_time' => Carbon::now(),
        ]);

        $this->violationService->createAppeal([
            'violation_id' => $violation->id,
            'appellant_id' => $this->visitor->id,
            'reason' => '有预约记录，系统识别错误',
        ]);

        $violation->refresh();
        $this->assertTrue($violation->has_appeal);
        $this->assertNotNull($violation->appeal_lock_until);
        $this->assertTrue($violation->isUnderAppealLock());

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('该车辆违停正在申诉中');

        $this->violationService->createViolation([
            'spot_id' => $this->spot->id,
            'license_plate' => '京A12345',
            'type' => 'no_booking',
            'violation_time' => Carbon::now()->addHour(),
        ]);
    }

    public function test_should_approve_appeal_and_cancel_violation(): void
    {
        $violation = $this->violationService->createViolation([
            'spot_id' => $this->spot->id,
            'license_plate' => '京A12345',
            'type' => 'no_booking',
        ]);

        $appeal = $this->violationService->createAppeal([
            'violation_id' => $violation->id,
            'appellant_id' => $this->visitor->id,
            'reason' => '系统错误，有预约记录',
        ]);

        $reviewedAppeal = $this->violationService->reviewAppeal(
            $appeal,
            true,
            $this->property->id,
            '申诉成立，已核实预约记录',
            0
        );

        $this->assertEquals('approved', $reviewedAppeal->status);
        $this->assertTrue($reviewedAppeal->fine_waived);
        $this->assertEquals('cancelled', $reviewedAppeal->violation->status);
    }

    public function test_should_reject_appeal_and_unlock_fine(): void
    {
        $violation = $this->violationService->createViolation([
            'spot_id' => $this->spot->id,
            'license_plate' => '京A12345',
            'type' => 'no_booking',
        ]);

        $appeal = $this->violationService->createAppeal([
            'violation_id' => $violation->id,
            'appellant_id' => $this->visitor->id,
            'reason' => '理由不充分的申诉',
        ]);

        $reviewedAppeal = $this->violationService->reviewAppeal(
            $appeal,
            false,
            $this->property->id,
            '申诉不成立，无有效预约记录',
            0
        );

        $this->assertEquals('rejected', $reviewedAppeal->status);
        $this->assertFalse($reviewedAppeal->fine_waived);

        $violation->refresh();
        $this->assertEquals('confirmed', $violation->status);
        $this->assertFalse($violation->has_appeal);
        $this->assertNull($violation->appeal_lock_until);
    }

    public function test_after_appeal_rejected_can_fine_again(): void
    {
        $violation = $this->violationService->createViolation([
            'spot_id' => $this->spot->id,
            'license_plate' => '京A12345',
            'type' => 'no_booking',
        ]);

        $appeal = $this->violationService->createAppeal([
            'violation_id' => $violation->id,
            'appellant_id' => $this->visitor->id,
            'reason' => '测试申诉',
        ]);

        $this->violationService->reviewAppeal(
            $appeal,
            false,
            $this->property->id,
            '申诉驳回',
            0
        );

        $newViolation = $this->violationService->createViolation([
            'spot_id' => $this->spot->id,
            'license_plate' => '京A12345',
            'type' => 'overtime',
            'violation_time' => Carbon::now()->addHours(2),
        ]);

        $this->assertNotNull($newViolation);
        $this->assertEquals('overtime', $newViolation->type);
    }

    public function test_different_violation_type_can_be_fined_during_appeal(): void
    {
        $violation = $this->violationService->createViolation([
            'spot_id' => $this->spot->id,
            'license_plate' => '京A12345',
            'type' => 'no_booking',
        ]);

        $this->violationService->createAppeal([
            'violation_id' => $violation->id,
            'appellant_id' => $this->visitor->id,
            'reason' => '有预约',
        ]);

        $newViolation = $this->violationService->createViolation([
            'spot_id' => $this->spot->id,
            'license_plate' => '京A12345',
            'type' => 'overtime',
            'violation_time' => Carbon::now()->addHour(),
        ]);

        $this->assertNotNull($newViolation);
        $this->assertEquals('overtime', $newViolation->type);
    }

    public function test_paid_violation_with_refund_on_appeal(): void
    {
        $violation = $this->violationService->createViolation([
            'spot_id' => $this->spot->id,
            'license_plate' => '京A12345',
            'type' => 'no_booking',
        ]);

        $this->violationService->payViolation($violation, 'wechat', $this->visitor->id);

        $violation->refresh();
        $this->assertEquals('paid', $violation->status);

        $appeal = $this->violationService->createAppeal([
            'violation_id' => $violation->id,
            'appellant_id' => $this->visitor->id,
            'reason' => '误判申诉',
        ]);

        $refundAmount = $violation->fine_amount;
        $reviewedAppeal = $this->violationService->reviewAppeal(
            $appeal,
            true,
            $this->property->id,
            '申诉通过，全额退款',
            $refundAmount
        );

        $this->assertEquals($refundAmount, $reviewedAppeal->refund_amount);
        $this->assertTrue($reviewedAppeal->fine_waived);
    }
}
