<?php

namespace Database\Factories;

use App\Models\PracticeRecording;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class PracticeRecordingFactory extends Factory
{
    protected $model = PracticeRecording::class;

    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'assignment_id' => \App\Models\Assignment::factory(),
            'file_path' => 'recordings/' . fake()->numberBetween(1, 100) . '/' . fake()->word() . '.mp3',
            'duration_seconds' => fake()->numberBetween(30, 600),
            'note' => fake()->optional()->text(200),
        ];
    }
}
