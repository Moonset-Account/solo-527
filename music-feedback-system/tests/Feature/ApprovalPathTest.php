<?php

namespace Tests\Feature;

use App\Models\ApprovalFlow;
use App\Models\Assignment;
use App\Models\Piece;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalPathTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $teacher;
    private User $parent;
    private Student $student;
    private Piece $piece;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->teacher = User::factory()->teacher()->create();
        $this->parent = User::factory()->parent()->create();
        $this->student = Student::factory()->create([
            'parent_user_id' => $this->parent->id,
            'teacher_user_id' => $this->teacher->id,
        ]);
        $this->piece = Piece::factory()->create();
    }

    public function test_publish_assignment_creates_approval_flow(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'piece_id' => $this->piece->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/publish");

        $response->assertOk()
            ->assertJsonPath('data.status', 'published');

        $this->assertDatabaseHas('approval_flows', [
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'approver_user_id' => $this->teacher->id,
            'action' => 'submit',
        ]);

        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'status' => 'published',
        ]);
    }

    public function test_admin_can_approve_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $approval = ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'approver_user_id' => $this->teacher->id,
            'action' => 'submit',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/approval-flows/{$approval->id}/approve", [
                'action' => 'approve',
                'comment' => '作业内容合理，同意发布',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.action', 'approve');
    }

    public function test_admin_can_reject_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $approval = ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'approver_user_id' => $this->teacher->id,
            'action' => 'submit',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/approval-flows/{$approval->id}/reject", [
                'action' => 'reject',
                'comment' => 'BPM要求不合理',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.action', 'reject');
    }

    public function test_teacher_cannot_approve_own_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $approval = ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'approver_user_id' => $this->teacher->id,
            'action' => 'submit',
        ]);

        $otherTeacher = User::factory()->teacher()->create();

        $response = $this->actingAs($otherTeacher, 'sanctum')
            ->postJson("/api/v1/approval-flows/{$approval->id}/approve", [
                'action' => 'approve',
            ]);

        $response->assertForbidden();
    }

    public function test_parent_cannot_approve_anything(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $approval = ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'approver_user_id' => $this->teacher->id,
            'action' => 'submit',
        ]);

        $response = $this->actingAs($this->parent, 'sanctum')
            ->postJson("/api/v1/approval-flows/{$approval->id}/approve", [
                'action' => 'approve',
            ]);

        $response->assertForbidden();
    }

    public function test_cannot_publish_already_published_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/publish");

        $response->assertStatus(422);
    }

    public function test_payment_mark_paid_creates_approval_flow(): void
    {
        $payment = \App\Models\PaymentReminder::factory()->create([
            'student_id' => $this->student->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/payment-reminders/{$payment->id}/mark-paid");

        $response->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->assertDatabaseHas('approval_flows', [
            'approvable_type' => \App\Models\PaymentReminder::class,
            'approvable_id' => $payment->id,
            'action' => 'approve',
        ]);
    }

    public function test_approval_action_validation(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $approval = ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'approver_user_id' => $this->teacher->id,
            'action' => 'submit',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/approval-flows/{$approval->id}/approve", [
                'comment' => '审批通过',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.action', 'approve')
            ->assertJsonPath('data.comment', '审批通过');
    }

    public function test_list_approval_flows_with_filter(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
        ]);

        ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'approver_user_id' => $this->teacher->id,
            'action' => 'submit',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/approval-flows?action=submit');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_other_teacher_cannot_publish_someone_elses_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'draft',
        ]);

        $otherTeacher = User::factory()->teacher()->create();

        $response = $this->actingAs($otherTeacher, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/publish");

        $response->assertForbidden();
    }

    public function test_teacher_only_sees_own_approval_flows(): void
    {
        $otherTeacher = User::factory()->teacher()->create();
        $otherStudent = Student::factory()->create([
            'parent_user_id' => User::factory()->parent()->create()->id,
            'teacher_user_id' => $otherTeacher->id,
        ]);

        $ownAssignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
        ]);
        $otherAssignment = Assignment::factory()->create([
            'teacher_user_id' => $otherTeacher->id,
            'student_id' => $otherStudent->id,
        ]);

        ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $ownAssignment->id,
            'approver_user_id' => $this->teacher->id,
            'action' => 'submit',
        ]);
        ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $otherAssignment->id,
            'approver_user_id' => $otherTeacher->id,
            'action' => 'submit',
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/v1/approval-flows');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_sees_all_approval_flows(): void
    {
        $otherTeacher = User::factory()->teacher()->create();
        $otherStudent = Student::factory()->create([
            'parent_user_id' => User::factory()->parent()->create()->id,
            'teacher_user_id' => $otherTeacher->id,
        ]);

        $ownAssignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
        ]);
        $otherAssignment = Assignment::factory()->create([
            'teacher_user_id' => $otherTeacher->id,
            'student_id' => $otherStudent->id,
        ]);

        ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $ownAssignment->id,
            'approver_user_id' => $this->teacher->id,
            'action' => 'submit',
        ]);
        ApprovalFlow::create([
            'approvable_type' => Assignment::class,
            'approvable_id' => $otherAssignment->id,
            'approver_user_id' => $otherTeacher->id,
            'action' => 'submit',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/approval-flows');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
