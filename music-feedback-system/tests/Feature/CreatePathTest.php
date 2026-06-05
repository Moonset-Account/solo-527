<?php

namespace Tests\Feature;

use App\Models\ApprovalFlow;
use App\Models\Assignment;
use App\Models\Annotation;
use App\Models\ParentConfirmation;
use App\Models\PaymentReminder;
use App\Models\Piece;
use App\Models\PracticeRecording;
use App\Models\SavedFilter;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CreatePathTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $teacher;
    private User $parent;
    private User $otherParent;
    private Student $student;
    private Piece $piece;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->teacher = User::factory()->teacher()->create();
        $this->parent = User::factory()->parent()->create();
        $this->otherParent = User::factory()->parent()->create();
        $this->student = Student::factory()->create([
            'parent_user_id' => $this->parent->id,
            'teacher_user_id' => $this->teacher->id,
        ]);
        $this->piece = Piece::factory()->create();
    }

    public function test_teacher_can_create_assignment(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/assignments', [
                'teacher_user_id' => $this->teacher->id,
                'student_id' => $this->student->id,
                'piece_id' => $this->piece->id,
                'title' => '钢琴练习作业',
                'description' => '请练习第三乐章',
                'bpm_requirement' => 120,
                'beat_time_signature' => '4/4',
                'due_date' => now()->addDays(7)->format('Y-m-d'),
                'status' => 'draft',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', '钢琴练习作业')
            ->assertJsonPath('data.bpm_requirement', 120)
            ->assertJsonPath('data.beat_time_signature', '4/4')
            ->assertJsonPath('data.status', 'draft');

        $this->assertDatabaseHas('assignments', [
            'title' => '钢琴练习作业',
            'teacher_user_id' => $this->teacher->id,
        ]);
    }

    public function test_admin_can_create_assignment(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/assignments', [
                'teacher_user_id' => $this->teacher->id,
                'student_id' => $this->student->id,
                'piece_id' => $this->piece->id,
                'title' => '管理发布作业',
                'status' => 'draft',
            ]);

        $response->assertCreated();
    }

    public function test_parent_cannot_create_assignment(): void
    {
        $response = $this->actingAs($this->parent, 'sanctum')
            ->postJson('/api/v1/assignments', [
                'teacher_user_id' => $this->teacher->id,
                'student_id' => $this->student->id,
                'piece_id' => $this->piece->id,
                'title' => '家长尝试创建',
                'status' => 'draft',
            ]);

        $response->assertForbidden();
    }

    public function test_guest_cannot_create_assignment(): void
    {
        $response = $this->postJson('/api/v1/assignments', [
            'title' => '未登录创建',
        ]);

        $response->assertUnauthorized();
    }

    public function test_create_assignment_validation_errors_in_chinese(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/assignments', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['teacher_user_id', 'student_id', 'piece_id', 'title', 'status']);

        $response->assertJsonPath('errors.teacher_user_id.0', '教师ID不能为空');
        $response->assertJsonPath('errors.student_id.0', '学生ID不能为空');
        $response->assertJsonPath('errors.title.0', '作业标题不能为空');
    }

    public function test_create_assignment_invalid_bpm_range(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/assignments', [
                'teacher_user_id' => $this->teacher->id,
                'student_id' => $this->student->id,
                'piece_id' => $this->piece->id,
                'title' => '测试BPM',
                'status' => 'draft',
                'bpm_requirement' => 10,
            ]);

        $response->assertUnprocessable()
            ->assertJsonPath('errors.bpm_requirement.0', 'BPM不能低于30');
    }

    public function test_create_assignment_invalid_status(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/assignments', [
                'teacher_user_id' => $this->teacher->id,
                'student_id' => $this->student->id,
                'piece_id' => $this->piece->id,
                'title' => '测试状态',
                'status' => 'completed',
            ]);

        $response->assertUnprocessable()
            ->assertJsonPath('errors.status.0', '状态必须是draft或published');
    }

    public function test_create_payment_reminder_admin_only(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/payment-reminders', [
                'student_id' => $this->student->id,
                'amount' => 500.00,
                'due_date' => now()->addDays(30)->format('Y-m-d'),
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.amount', '500.00');
    }

    public function test_parent_cannot_create_payment_reminder(): void
    {
        $response = $this->actingAs($this->parent, 'sanctum')
            ->postJson('/api/v1/payment-reminders', [
                'student_id' => $this->student->id,
                'amount' => 500.00,
                'due_date' => now()->addDays(30)->format('Y-m-d'),
            ]);

        $response->assertForbidden();
    }

    public function test_create_payment_reminder_validation_chinese(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/payment-reminders', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['student_id', 'amount', 'due_date']);
    }

    public function test_parent_can_upload_recording(): void
    {
        Storage::fake('local');

        $assignment = Assignment::factory()->create([
            'student_id' => $this->student->id,
            'teacher_user_id' => $this->teacher->id,
        ]);

        $file = UploadedFile::fake()->create('recording.mp3', 1000, 'audio/mpeg');

        $response = $this->actingAs($this->parent, 'sanctum')
            ->postJson('/api/v1/recordings', [
                'student_id' => $this->student->id,
                'assignment_id' => $assignment->id,
                'file' => $file,
                'note' => '今天练习了30分钟',
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('practice_recordings', [
            'student_id' => $this->student->id,
            'assignment_id' => $assignment->id,
            'note' => '今天练习了30分钟',
        ]);
    }

    public function test_recording_file_format_validation(): void
    {
        Storage::fake('local');

        $assignment = Assignment::factory()->create([
            'student_id' => $this->student->id,
            'teacher_user_id' => $this->teacher->id,
        ]);

        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->actingAs($this->parent, 'sanctum')
            ->postJson('/api/v1/recordings', [
                'student_id' => $this->student->id,
                'assignment_id' => $assignment->id,
                'file' => $file,
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);
    }

    public function test_teacher_can_create_annotation_with_timestamp(): void
    {
        $assignment = Assignment::factory()->create([
            'student_id' => $this->student->id,
            'teacher_user_id' => $this->teacher->id,
        ]);
        $recording = PracticeRecording::factory()->create([
            'student_id' => $this->student->id,
            'assignment_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/annotations', [
                'practice_recording_id' => $recording->id,
                'timestamp_ms' => 12500,
                'content' => '这里的节奏需要更稳定',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.timestamp_ms', 12500)
            ->assertJsonPath('data.content', '这里的节奏需要更稳定');

        $this->assertDatabaseHas('annotations', [
            'practice_recording_id' => $recording->id,
            'timestamp_ms' => 12500,
            'teacher_user_id' => $this->teacher->id,
        ]);
    }

    public function test_annotation_timestamp_must_be_non_negative(): void
    {
        $recording = PracticeRecording::factory()->create([
            'student_id' => $this->student->id,
        ]);

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/annotations', [
                'practice_recording_id' => $recording->id,
                'timestamp_ms' => -1,
                'content' => '无效时间点',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['timestamp_ms']);
    }

    public function test_parent_can_confirm_assignment(): void
    {
        $assignment = Assignment::factory()->create([
            'student_id' => $this->student->id,
            'teacher_user_id' => $this->teacher->id,
        ]);

        $response = $this->actingAs($this->parent, 'sanctum')
            ->postJson('/api/v1/annotations', [
                'practice_recording_id' => PracticeRecording::factory()->create(['student_id' => $this->student->id, 'assignment_id' => $assignment->id])->id,
                'timestamp_ms' => 0,
                'content' => '家长批注测试',
            ]);

        $response->assertForbidden();
    }

    public function test_create_saved_filter(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/saved-filters', [
                'name' => '待批改作业',
                'module' => 'assignments',
                'filter_config' => [
                    'status' => 'submitted',
                    'teacher_user_id' => $this->teacher->id,
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', '待批改作业')
            ->assertJsonPath('data.module', 'assignments');

        $this->assertDatabaseHas('saved_filters', [
            'user_id' => $this->teacher->id,
            'name' => '待批改作业',
        ]);
    }

    public function test_saved_filter_module_validation(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/saved-filters', [
                'name' => '无效模块',
                'module' => 'invalid_module',
                'filter_config' => ['status' => 'draft'],
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['module']);
    }
}
