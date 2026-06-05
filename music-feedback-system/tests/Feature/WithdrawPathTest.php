<?php

namespace Tests\Feature;

use App\Models\ApprovalFlow;
use App\Models\Assignment;
use App\Models\Piece;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WithdrawPathTest extends TestCase
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

    public function test_teacher_can_withdraw_published_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/withdraw");

        $response->assertOk()
            ->assertJsonPath('data.status', 'draft');

        $this->assertDatabaseHas('assignments', [
            'id' => $assignment->id,
            'status' => 'draft',
        ]);

        $this->assertDatabaseHas('approval_flows', [
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'action' => 'withdraw',
        ]);
    }

    public function test_teacher_can_withdraw_submitted_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/withdraw");

        $response->assertOk()
            ->assertJsonPath('data.status', 'draft');
    }

    public function test_admin_can_withdraw_any_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/withdraw");

        $response->assertOk()
            ->assertJsonPath('data.status', 'draft');
    }

    public function test_other_teacher_cannot_withdraw_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $response = $this->actingAs($this->otherTeacher, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/withdraw");

        $response->assertForbidden();
    }

    public function test_parent_cannot_withdraw_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $response = $this->actingAs($this->parent, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/withdraw");

        $response->assertForbidden();
    }

    public function test_cannot_withdraw_draft_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/withdraw");

        $response->assertStatus(422);
    }

    public function test_cannot_withdraw_completed_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/withdraw");

        $response->assertStatus(422);
    }

    public function test_cannot_withdraw_cancelled_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'cancelled',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/withdraw");

        $response->assertStatus(422);
    }

    public function test_delete_draft_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->deleteJson("/api/v1/assignments/{$assignment->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('assignments', ['id' => $assignment->id]);
    }

    public function test_cannot_delete_published_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->deleteJson("/api/v1/assignments/{$assignment->id}");

        $response->assertStatus(422);

        $this->assertDatabaseHas('assignments', ['id' => $assignment->id]);
    }

    public function test_other_teacher_cannot_delete_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->otherTeacher, 'sanctum')
            ->deleteJson("/api/v1/assignments/{$assignment->id}");

        $response->assertForbidden();
    }

    public function test_withdraw_creates_proper_approval_record(): void
    {
        $assignment = Assignment::factory()->create([
            'teacher_user_id' => $this->teacher->id,
            'student_id' => $this->student->id,
            'status' => 'published',
        ]);

        $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/assignments/{$assignment->id}/withdraw");

        $approval = ApprovalFlow::where([
            'approvable_type' => Assignment::class,
            'approvable_id' => $assignment->id,
            'action' => 'withdraw',
        ])->first();

        $this->assertNotNull($approval);
        $this->assertEquals($this->teacher->id, $approval->approver_user_id);
    }

    public function test_approval_flow_withdraw_action(): void
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
            ->postJson("/api/v1/approval-flows/{$approval->id}/withdraw", [
                'action' => 'withdraw',
                'comment' => '需要修改作业内容',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.action', 'withdraw');
    }
}
