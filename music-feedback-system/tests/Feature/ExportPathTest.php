<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\PaymentReminder;
use App\Models\Piece;
use App\Models\PracticeRecording;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExportPathTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $teacher;
    private User $otherTeacher;
    private User $parent;
    private Student $student;
    private Piece $piece;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->teacher = User::factory()->teacher()->create();
        $this->otherTeacher = User::factory()->teacher()->create();
        $this->parent = User::factory()->parent()->create();
        $this->student = Student::factory()->create([
            'parent_user_id' => $this->parent->id,
            'teacher_user_id' => $this->teacher->id,
        ]);
        $this->piece = Piece::factory()->create();
    }

    public function test_admin_can_export_assignments_csv(): void
    {
        Assignment::factory()->count(3)->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'piece_id' => $this->piece->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/exports/assignments');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();
        $this->assertStringContainsString('id', $csv);
        $this->assertStringContainsString('student_name', $csv);
        $this->assertStringContainsString('piece_title', $csv);
        $this->assertStringContainsString('title', $csv);
        $this->assertStringContainsString('status', $csv);
    }

    public function test_teacher_can_export_assignments_csv(): void
    {
        Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'piece_id' => $this->piece->id,
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/v1/exports/assignments');

        $response->assertOk();
    }

    public function test_parent_cannot_export_assignments(): void
    {
        $response = $this->actingAs($this->parent, 'sanctum')
            ->getJson('/api/v1/exports/assignments');

        $response->assertForbidden();
    }

    public function test_guest_cannot_export(): void
    {
        $response = $this->getJson('/api/v1/exports/assignments');

        $response->assertUnauthorized();
    }

    public function test_export_assignments_with_status_filter(): void
    {
        Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'piece_id' => $this->piece->id,
            'status' => 'draft',
        ]);
        Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'piece_id' => $this->piece->id,
            'status' => 'published',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/exports/assignments?status=draft');

        $response->assertOk();
        $csv = $response->streamedContent();
        $this->assertStringContainsString('draft', $csv);
    }

    public function test_export_assignments_with_teacher_filter(): void
    {
        Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'piece_id' => $this->piece->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/exports/assignments?teacher_user_id=' . $this->teacher->id);

        $response->assertOk();
    }

    public function test_admin_can_export_recordings_csv(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'piece_id' => $this->piece->id,
        ]);
        PracticeRecording::factory()->count(2)->create([
            'student_id' => $this->student->id,
            'assignment_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/exports/recordings');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();
        $this->assertStringContainsString('id', $csv);
        $this->assertStringContainsString('student_name', $csv);
        $this->assertStringContainsString('assignment_title', $csv);
        $this->assertStringContainsString('duration', $csv);
    }

    public function test_parent_cannot_export_recordings(): void
    {
        $response = $this->actingAs($this->parent, 'sanctum')
            ->getJson('/api/v1/exports/recordings');

        $response->assertForbidden();
    }

    public function test_export_recordings_with_student_filter(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
        ]);
        PracticeRecording::factory()->create([
            'student_id' => $this->student->id,
            'assignment_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/exports/recordings?student_id=' . $this->student->id);

        $response->assertOk();
    }

    public function test_admin_can_export_payments_csv(): void
    {
        PaymentReminder::factory()->count(2)->create([
            'student_id' => $this->student->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/exports/payments');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();
        $this->assertStringContainsString('id', $csv);
        $this->assertStringContainsString('student_name', $csv);
        $this->assertStringContainsString('amount', $csv);
        $this->assertStringContainsString('status', $csv);
    }

    public function test_teacher_cannot_export_payments(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/v1/exports/payments');

        $response->assertForbidden();
    }

    public function test_parent_cannot_export_payments(): void
    {
        $response = $this->actingAs($this->parent, 'sanctum')
            ->getJson('/api/v1/exports/payments');

        $response->assertForbidden();
    }

    public function test_export_payments_with_status_filter(): void
    {
        PaymentReminder::factory()->create([
            'student_id' => $this->student->id,
            'status' => 'pending',
        ]);
        PaymentReminder::factory()->create([
            'student_id' => $this->student->id,
            'status' => 'paid',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/exports/payments?status=pending');

        $response->assertOk();
        $csv = $response->streamedContent();
        $this->assertStringContainsString('pending', $csv);
    }

    public function test_export_payments_with_date_range_filter(): void
    {
        PaymentReminder::factory()->create([
            'student_id' => $this->student->id,
            'due_date' => now()->addDays(10),
        ]);
        PaymentReminder::factory()->create([
            'student_id' => $this->student->id,
            'due_date' => now()->addDays(40),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/exports/payments?due_date_from=' . now()->addDays(5)->format('Y-m-d') . '&due_date_to=' . now()->addDays(30)->format('Y-m-d'));

        $response->assertOk();
    }

    public function test_export_empty_data_produces_header_only_csv(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/exports/assignments');

        $response->assertOk();
        $csv = $response->streamedContent();
        $lines = array_filter(explode("\n", trim($csv)));
        $this->assertCount(1, $lines);
    }
}
