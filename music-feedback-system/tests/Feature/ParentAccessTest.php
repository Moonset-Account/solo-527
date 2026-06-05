<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Annotation;
use App\Models\ParentConfirmation;
use App\Models\Piece;
use App\Models\PracticeRecording;
use App\Models\SavedFilter;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ParentAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $teacher;
    private User $otherTeacher;
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
        $this->otherTeacher = User::factory()->teacher()->create();
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

    public function test_parent_can_list_own_child_recordings(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);
        PracticeRecording::factory()->create([
            'student_id' => $this->studentA->id,
            'assignment_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->parentA, 'sanctum')
            ->getJson('/api/v1/recordings');

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

    public function test_parent_can_read_annotation_on_own_child_recording(): void
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

    public function test_parent_cannot_read_annotation_on_other_child_recording(): void
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
            ->getJson("/api/v1/annotations?practice_recording_id={$recording->id}");

        $response->assertForbidden();
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

    public function test_parent_can_confirm_own_child_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);

        $response = $this->actingAs($this->parentA, 'sanctum')
            ->postJson('/api/v1/parent-confirmations', [
                'assignment_id' => $assignment->id,
                'student_id' => $this->studentA->id,
                'confirmed' => true,
            ]);

        $response->assertCreated();
    }

    public function test_parent_cannot_confirm_other_child_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);

        $response = $this->actingAs($this->parentB, 'sanctum')
            ->postJson('/api/v1/parent-confirmations', [
                'assignment_id' => $assignment->id,
                'student_id' => $this->studentA->id,
                'confirmed' => true,
            ]);

        $response->assertForbidden();
    }

    public function test_parent_can_list_own_confirmations(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);
        ParentConfirmation::create([
            'parent_user_id' => $this->parentA->id,
            'assignment_id' => $assignment->id,
            'student_id' => $this->studentA->id,
            'confirmed' => true,
        ]);

        $response = $this->actingAs($this->parentA, 'sanctum')
            ->getJson('/api/v1/parent-confirmations');

        $response->assertOk();
    }

    public function test_parent_can_upload_recording_for_own_child(): void
    {
        Storage::fake('local');
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);

        $file = UploadedFile::fake()->create('recording.mp3', 100, 'audio/mpeg');

        $response = $this->actingAs($this->parentA, 'sanctum')
            ->postJson('/api/v1/recordings', [
                'student_id' => $this->studentA->id,
                'assignment_id' => $assignment->id,
                'file' => $file,
            ]);

        $response->assertCreated();
    }

    public function test_parent_cannot_upload_recording_for_other_child(): void
    {
        Storage::fake('local');
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);

        $file = UploadedFile::fake()->create('recording.mp3', 100, 'audio/mpeg');

        $response = $this->actingAs($this->parentB, 'sanctum')
            ->postJson('/api/v1/recordings', [
                'student_id' => $this->studentA->id,
                'assignment_id' => $assignment->id,
                'file' => $file,
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

    public function test_parent_can_view_progress_board_own_children(): void
    {
        $response = $this->actingAs($this->parentA, 'sanctum')
            ->getJson('/api/v1/progress-board');

        $response->assertOk();
    }

    public function test_teacher_cannot_create_annotation_for_other_teacher_student(): void
    {
        $otherStudent = Student::factory()->create([
            'parent_user_id' => $this->parentB->id,
            'teacher_user_id' => $this->otherTeacher->id,
        ]);
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->otherTeacher->id,
            'student_id' => $otherStudent->id,
        ]);
        $recording = PracticeRecording::factory()->create([
            'student_id' => $otherStudent->id,
            'assignment_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/annotations', [
                'practice_recording_id' => $recording->id,
                'timestamp_ms' => 0,
                'content' => '越权批注',
            ]);

        $response->assertForbidden();
    }

    public function test_teacher_cannot_view_other_teacher_student_annotation_list(): void
    {
        $otherStudent = Student::factory()->create([
            'parent_user_id' => $this->parentB->id,
            'teacher_user_id' => $this->otherTeacher->id,
        ]);
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->otherTeacher->id,
            'student_id' => $otherStudent->id,
        ]);
        $recording = PracticeRecording::factory()->create([
            'student_id' => $otherStudent->id,
            'assignment_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->getJson("/api/v1/annotations?practice_recording_id={$recording->id}");

        $response->assertForbidden();
    }

    public function test_teacher_only_sees_own_assignments_in_list(): void
    {
        Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
            'piece_id' => $this->piece->id,
        ]);
        Assignment::factory()->create([
            'teacher_user_id' => $this->otherTeacher->id,
            'student_id' => $this->studentB->id,
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/v1/assignments');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_sees_all_assignments_in_list(): void
    {
        Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
            'piece_id' => $this->piece->id,
        ]);
        Assignment::factory()->create([
            'teacher_user_id' => $this->otherTeacher->id,
            'student_id' => $this->studentB->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/assignments');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
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

    public function test_recordings_saved_filter_applies_to_list(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->studentA->id,
        ]);
        PracticeRecording::factory()->create([
            'student_id' => $this->studentA->id,
            'assignment_id' => $assignment->id,
        ]);

        $filter = SavedFilter::create([
            'user_id' => $this->teacher->id,
            'name' => '学生A的录音',
            'module' => 'recordings',
            'filter_config' => ['student_id' => $this->studentA->id],
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->getJson("/api/v1/recordings?saved_filter_id={$filter->id}");

        $response->assertOk();
    }

    public function test_progress_board_saved_filter_applies(): void
    {
        $filter = SavedFilter::create([
            'user_id' => $this->teacher->id,
            'name' => '钢琴学生',
            'module' => 'progress',
            'filter_config' => ['instrument' => 'piano'],
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->getJson("/api/v1/progress-board?saved_filter_id={$filter->id}");

        $response->assertOk();
    }
}
