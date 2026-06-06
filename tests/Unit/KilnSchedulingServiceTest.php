<?php

namespace Tests\Unit;

use App\Models\Clay;
use App\Models\FiringCurveTemplate;
use App\Models\Glaze;
use App\Models\Kiln;
use App\Models\KilnBatch;
use App\Models\User;
use App\Models\Work;
use App\Services\ConflictCheckService;
use App\Services\KilnSchedulingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class KilnSchedulingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected KilnSchedulingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new KilnSchedulingService(new ConflictCheckService());
        Redis::shouldReceive('setex')->andReturn(true);
        Redis::shouldReceive('del')->andReturn(true);
        Redis::shouldReceive('get')->andReturn(null);
    }

    protected function createTestData(): array
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student', 'max_works_per_batch' => 3]);

        $clay = Clay::factory()->create([
            'firing_temp_min' => 1100,
            'firing_temp_max' => 1280,
        ]);

        $glaze = Glaze::factory()->create([
            'firing_temp_min' => 1180,
            'firing_temp_max' => 1260,
        ]);

        $kiln = Kiln::factory()->create([
            'capacity' => 20,
            'width' => 100,
            'height' => 100,
            'depth' => 100,
            'temp_max' => 1300,
            'temperature_zones' => [1240, 1260, 1280],
        ]);

        $curve = FiringCurveTemplate::factory()->create([
            'max_temperature' => 1250,
            'created_by' => $teacher->id,
        ]);

        $work = Work::factory()->create([
            'student_id' => $student->id,
            'clay_id' => $clay->id,
            'width' => 10,
            'height' => 10,
            'depth' => 10,
            'status' => 'ready_for_firing',
        ]);

        return compact('teacher', 'student', 'clay', 'glaze', 'kiln', 'curve', 'work');
    }

    public function test_create_kiln_batch_successfully(): void
    {
        $data = $this->createTestData();

        $batch = $this->service->createKilnBatch([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'scheduled_fire_date' => Carbon::now()->addWeek(),
        ], $data['teacher']);

        $this->assertInstanceOf(KilnBatch::class, $batch);
        $this->assertEquals('draft', $batch->status);
        $this->assertNotNull($batch->batch_number);
    }

    public function test_create_kiln_batch_fails_on_maintenance_day(): void
    {
        $data = $this->createTestData();
        $maintenanceDate = Carbon::now()->addWeek();
        $data['kiln']->maintenanceDays()->create([
            'maintenance_date' => $maintenanceDate,
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('该日期为窑炉维护日，无法排烧');

        $this->service->createKilnBatch([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'scheduled_fire_date' => $maintenanceDate,
        ], $data['teacher']);
    }

    public function test_add_work_to_batch_successfully(): void
    {
        $data = $this->createTestData();
        $batch = KilnBatch::factory()->create([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'created_by' => $data['teacher']->id,
            'max_capacity' => 20,
        ]);

        $result = $this->service->addWorkToBatch($batch, $data['work']);

        $this->assertTrue($result['success']);
        $this->assertEquals(1, $batch->fresh()->work_count);
        $this->assertEquals('scheduled', $data['work']->fresh()->status);
    }

    public function test_add_work_to_batch_fails_when_not_editable(): void
    {
        $data = $this->createTestData();
        $batch = KilnBatch::factory()->create([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'created_by' => $data['teacher']->id,
            'status' => 'firing',
        ]);

        $result = $this->service->addWorkToBatch($batch, $data['work']);

        $this->assertFalse($result['success']);
        $this->assertEquals('该窑次状态不允许添加作品', $result['message']);
    }

    public function test_remove_work_from_batch_releases_capacity(): void
    {
        $data = $this->createTestData();
        $batch = KilnBatch::factory()->create([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'created_by' => $data['teacher']->id,
            'max_capacity' => 20,
        ]);

        $this->service->addWorkToBatch($batch, $data['work']);
        $this->assertEquals(1, $batch->fresh()->work_count);

        $result = $this->service->removeWorkFromBatch($batch, $data['work']);

        $this->assertTrue($result['success']);
        $this->assertEquals(0, $batch->fresh()->work_count);
        $this->assertEquals('ready_for_firing', $data['work']->fresh()->status);
        $this->assertEquals(1, $result['released_capacity']);
    }

    public function test_cancel_kiln_batch_releases_all_works(): void
    {
        $data = $this->createTestData();
        $batch = KilnBatch::factory()->create([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'created_by' => $data['teacher']->id,
            'max_capacity' => 20,
        ]);

        $this->service->addWorkToBatch($batch, $data['work']);

        $result = $this->service->cancelKilnBatch($batch);

        $this->assertTrue($result['success']);
        $this->assertEquals('cancelled', $batch->fresh()->status);
        $this->assertEquals('ready_for_firing', $data['work']->fresh()->status);
        $this->assertCount(1, $result['affected_students']);
    }

    public function test_cancel_kiln_batch_fails_when_firing(): void
    {
        $data = $this->createTestData();
        $batch = KilnBatch::factory()->create([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'created_by' => $data['teacher']->id,
            'status' => 'firing',
        ]);

        $result = $this->service->cancelKilnBatch($batch);

        $this->assertFalse($result['success']);
    }

    public function test_update_batch_curve_detects_affected_works(): void
    {
        $data = $this->createTestData();
        $batch = KilnBatch::factory()->create([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'created_by' => $data['teacher']->id,
        ]);
        $this->service->addWorkToBatch($batch, $data['work']);

        $newCurve = FiringCurveTemplate::factory()->create([
            'max_temperature' => 900,
            'created_by' => $data['teacher']->id,
        ]);

        $result = $this->service->updateBatchCurve($batch, $newCurve->id);

        $this->assertTrue($result['success']);
        $this->assertTrue($result['has_affected_works']);
        $this->assertCount(1, $result['affected_works']);
    }

    public function test_batch_unload_updates_works_status(): void
    {
        $data = $this->createTestData();
        $batch = KilnBatch::factory()->create([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'created_by' => $data['teacher']->id,
            'status' => 'cooling',
        ]);
        $this->service->addWorkToBatch($batch, $data['work']);

        $work2 = Work::factory()->create([
            'student_id' => $data['student']->id,
            'clay_id' => $data['clay']->id,
            'status' => 'ready_for_firing',
        ]);
        $this->service->addWorkToBatch($batch, $work2);

        $result = $this->service->batchUnload($batch, [
            [
                'work_id' => $data['work']->id,
                'post_firing_status' => 'success',
                'for_exhibition' => true,
            ],
            [
                'work_id' => $work2->id,
                'post_firing_status' => 'broken',
                'breakage_reason' => '釉面开裂',
                'compensation_status' => 'pending',
            ],
        ]);

        $this->assertTrue($result['success']);
        $this->assertEquals(2, $result['updated_works_count']);
        $this->assertEquals('unloaded', $data['work']->fresh()->status);
        $this->assertTrue($data['work']->fresh()->for_exhibition);
        $this->assertEquals('broken', $work2->fresh()->status);
        $this->assertEquals('釉面开裂', $work2->fresh()->breakage_reason);
        $this->assertEquals('pending', $work2->fresh()->compensation_status);
    }

    public function test_get_available_slots_returns_correct_maintenance_days(): void
    {
        $data = $this->createTestData();
        $today = Carbon::now();

        $data['kiln']->maintenanceDays()->create([
            'maintenance_date' => $today->copy()->addDays(5),
        ]);

        $slots = $this->service->getAvailableSlots($data['kiln'], $today, 10);

        $this->assertCount(10, $slots);
        $this->assertTrue($slots[5]['is_maintenance']);
        $this->assertFalse($slots[5]['is_available']);
    }

    public function test_recommend_optimal_zone_returns_correct_zone(): void
    {
        $data = $this->createTestData();
        $batch = KilnBatch::factory()->create([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'created_by' => $data['teacher']->id,
        ]);

        $zone = $this->service->recommendOptimalZone($batch, $data['work']);

        $this->assertNotNull($zone);
        $this->assertGreaterThanOrEqual(0, $zone);
        $this->assertLessThan(3, $zone);
    }
}
