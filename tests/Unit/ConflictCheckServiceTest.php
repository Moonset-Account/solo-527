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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConflictCheckServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ConflictCheckService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ConflictCheckService();
    }

    protected function createTestData(): array
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student', 'max_works_per_batch' => 3]);

        $clay = Clay::factory()->create([
            'firing_temp_min' => 1100,
            'firing_temp_max' => 1280,
        ]);

        $glaze1 = Glaze::factory()->create([
            'firing_temp_min' => 1180,
            'firing_temp_max' => 1260,
        ]);

        $glaze2 = Glaze::factory()->create([
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

        $batch = KilnBatch::factory()->create([
            'kiln_id' => $kiln->id,
            'firing_curve_template_id' => $curve->id,
            'created_by' => $teacher->id,
            'max_capacity' => 20,
        ]);

        $work = Work::factory()->create([
            'student_id' => $student->id,
            'clay_id' => $clay->id,
            'width' => 10,
            'height' => 10,
            'depth' => 10,
            'status' => 'ready_for_firing',
        ]);
        $work->glazes()->attach($glaze1->id, ['layer_number' => 1]);

        return compact('teacher', 'student', 'clay', 'glaze1', 'glaze2', 'kiln', 'curve', 'batch', 'work');
    }

    public function test_check_all_conflicts_passes_with_no_conflicts(): void
    {
        $data = $this->createTestData();
        $result = $this->service->checkAllConflicts($data['batch'], $data['work']);

        $this->assertTrue($result['passed']);
        $this->assertEmpty($result['conflicts']);
    }

    public function test_check_capacity_conflict_when_full(): void
    {
        $data = $this->createTestData();
        $data['batch']->update(['max_capacity' => 0]);

        $result = $this->service->checkCapacity($data['batch']);

        $this->assertFalse($result['passed']);
        $this->assertEquals('capacity', $result['type']);
    }

    public function test_check_student_work_limit_conflict(): void
    {
        $data = $this->createTestData();
        $data['student']->update(['max_works_per_batch' => 1]);

        $work2 = Work::factory()->create([
            'student_id' => $data['student']->id,
            'clay_id' => $data['clay']->id,
            'status' => 'ready_for_firing',
        ]);
        $data['batch']->works()->attach($work2->id, ['space_occupied' => 100]);

        $result = $this->service->checkStudentWorkLimit($data['batch'], $data['work']);

        $this->assertFalse($result['passed']);
        $this->assertEquals('student_limit', $result['type']);
    }

    public function test_check_temperature_zone_conflict_for_clay(): void
    {
        $data = $this->createTestData();
        $data['clay']->update(['firing_temp_max' => 1000]);

        $result = $this->service->checkTemperatureZone($data['batch'], $data['work']);

        $this->assertFalse($result['passed']);
        $this->assertEquals('temperature_zone', $result['type']);
    }

    public function test_check_temperature_zone_conflict_for_glaze(): void
    {
        $data = $this->createTestData();
        Glaze::where('id', $data['glaze1']->id)->update(['firing_temp_max' => 1000]);
        $data['work']->load('glazes');

        $result = $this->service->checkTemperatureZone($data['batch'], $data['work']);

        $this->assertFalse($result['passed']);
    }

    public function test_check_glaze_compatibility_conflict(): void
    {
        $data = $this->createTestData();
        $work2 = Work::factory()->create([
            'student_id' => User::factory()->create(['role' => 'student'])->id,
            'clay_id' => $data['clay']->id,
            'status' => 'ready_for_firing',
        ]);
        $work2->glazes()->attach($data['glaze2']->id, ['layer_number' => 1]);
        $data['batch']->works()->attach($work2->id, ['space_occupied' => 100]);

        \App\Models\GlazeCompatibility::create([
            'glaze1_id' => min($data['glaze1']->id, $data['glaze2']->id),
            'glaze2_id' => max($data['glaze1']->id, $data['glaze2']->id),
            'compatibility' => 'incompatible',
        ]);

        $result = $this->service->checkGlazeCompatibility($data['batch'], $data['work']);

        $this->assertFalse($result['passed']);
        $this->assertNotEmpty($result['incompatibilities']);
    }

    public function test_check_kiln_space_conflict(): void
    {
        $data = $this->createTestData();
        $data['work']->update(['width' => 200, 'height' => 200, 'depth' => 200]);

        $result = $this->service->checkKilnSpace($data['batch'], $data['work']);

        $this->assertFalse($result['passed']);
    }

    public function test_check_work_status_conflict_when_already_scheduled(): void
    {
        $data = $this->createTestData();
        $otherBatch = KilnBatch::factory()->create([
            'kiln_id' => $data['kiln']->id,
            'firing_curve_template_id' => $data['curve']->id,
            'created_by' => $data['teacher']->id,
        ]);
        $otherBatch->works()->attach($data['work']->id, ['space_occupied' => 100]);

        $result = $this->service->checkWorkStatus($data['work']->fresh());

        $this->assertFalse($result['passed']);
    }

    public function test_check_batch_for_curve_change_finds_affected_works(): void
    {
        $data = $this->createTestData();
        $data['batch']->works()->attach($data['work']->id, ['space_occupied' => 100]);

        $newCurve = FiringCurveTemplate::factory()->create([
            'max_temperature' => 900,
            'created_by' => $data['teacher']->id,
        ]);
        $data['batch']->update(['firing_curve_template_id' => $newCurve->id]);
        $data['batch']->load('firingCurveTemplate');

        $result = $this->service->checkBatchForCurveChange($data['batch']);

        $this->assertTrue($result['has_affected']);
        $this->assertCount(1, $result['affected_works']);
    }
}
