<?php

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\Piece;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AssignmentFactory extends Factory
{
    protected $model = Assignment::class;

    public function definition(): array
    {
        return [
            'teacher_user_id' => User::factory()->teacher(),
            'student_id' => Student::factory(),
            'piece_id' => Piece::factory(),
            'title' => fake()->words(4, true),
            'description' => fake()->optional()->text(300),
            'bpm_requirement' => fake()->optional()->numberBetween(40, 200),
            'beat_time_signature' => fake()->optional()->randomElement(['4/4', '3/4', '6/8', '2/4', '3/8']),
            'due_date' => fake()->optional()->dateTimeBetween('now', '+30 days'),
            'status' => 'draft',
        ];
    }

    public function published(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'published',
        ]);
    }
}
