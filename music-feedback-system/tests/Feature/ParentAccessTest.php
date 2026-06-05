<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Annotation;
use App\Models\Piece;
use App\Models\PracticeRecording;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParentAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $teacher;
    private User $parentA;
    private User $parentB;
    private Student $studentA;
    private Student $studentB;
    private Piece $piece;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->teacher = User::factory()->teacher()->create();
        $this->parentA = User::factory()->parent()->create();
        $this->parentB = User::factory()->parent()->create();
        $this->studentA = Student::factory()->create([
            'parent_user_id' => $this->parentA->id,
            'teacher_user_id' => $this->teacher->id,
        ]);
        $this->studentB = Student::factory()->create([
            'parent_user_id' => $this->parentB->id,
            'teacher_user_id' => $this->teacher->id,
        ]);
        $this->piece = Piece::factory()->create();
    }

    public function test_parent_can_view_own_child_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
            'piece_id' => $this->piece->id,
        ]);

        $response = $this->actingAs($this->parentA, 'sanctum')
            ->getJson("/api/v1/assignments/{$assignment->id}");

        $response->assertOk();
    }

    public function test_parent_cannot_view_other_child_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
            'piece_id' => $this->piece->id,
        ]);

        $response = $this->actingAs($this->parentB, 'sanctum')
            ->getJson("/api/v1/assignments/{$assignment->id}");

        $response->assertForbidden();
    }

    public function test_parent_cannot_list_assignments(): void
    {
        Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
            'piece_id' => $this->piece->id,
        ]);

        $response = $this->actingAs($this->parentA, 'sanctum')
            ->getJson('/api/v1/assignments');

        $response->assertForbidden();
    }

    public function test_parent_can_view_own_child_recording(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);
        $recording = PracticeRecording::factory()->create([
            'student_id' => $this->studentA->id,
            'assignment_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->parentA, 'sanctum')
            ->getJson("/api/v1/recordings/{$recording->id}");

        $response->assertOk();
    }

    public function test_parent_cannot_view_other_child_recording(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);
        $recording = PracticeRecording::factory()->create([
            'student_id' => $this->studentA->id,
            'assignment_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->parentB, 'sanctum')
            ->getJson("/api/v1/recordings/{$recording->id}");

        $response->assertForbidden();
    }

    public function test_parent_can_read_annotation_on_child_recording(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);
        $recording = PracticeRecording::factory()->create([
            'student_id' => $this->studentA->id,
            'assignment_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->parentA, 'sanctum')
            ->getJson("/api/v1/annotations?practice_recording_id={$recording->id}");

        $response->assertOk();
    }

    public function test_parent_cannot_create_annotation(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);
        $recording = PracticeRecording::factory()->create([
            'student_id' => $this->studentA->id,
            'assignment_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->parentA, 'sanctum')
            ->postJson('/api/v1/annotations', [
                'practice_recording_id' => $recording->id,
                'timestamp_ms' => 5000,
                'content' => '家长不能批注',
            ]);

        $response->assertForbidden();
    }

    public function test_parent_can_view_own_payment_reminder(): void
    {
        $payment = \App\Models\PaymentReminder::factory()->create([
            'student_id' => $this->studentA->id,
        ]);

        $response = $this->actingAs($this->parentA, 'sanctum')
            ->getJson("/api/v1/payment-reminders/{$payment->id}");

        $response->assertOk();
    }

    public function test_parent_cannot_view_other_child_payment(): void
    {
        $payment = \App\Models\PaymentReminder::factory()->create([
            'student_id' => $this->studentA->id,
        ]);

        $response = $this->actingAs($this->parentB, 'sanctum')
            ->getJson("/api/v1/payment-reminders/{$payment->id}");

        $response->assertForbidden();
    }

    public function test_parent_cannot_list_payment_reminders(): void
    {
        $response = $this->actingAs($this->parentA, 'sanctum')
            ->getJson('/api/v1/payment-reminders');

        $response->assertForbidden();
    }

    public function test_teacher_can_view_own_student_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
            'piece_id' => $this->piece->id,
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->getJson("/api/v1/assignments/{$assignment->id}");

        $response->assertOk();
    }

    public function test_other_teacher_cannot_view_assignment(): void
    {
        $otherTeacher = User::factory()->teacher()->create();
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
            'piece_id' => $this->piece->id,
        ]);

        $response = $this->actingAs($otherTeacher, 'sanctum')
            ->getJson("/api/v1/assignments/{$assignment->id}");

        $response->assertForbidden();
    }
}
