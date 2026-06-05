<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'instrument' => fake()->randomElement(['piano', 'violin', 'guitar', 'flute', 'drums']),
            'parent_user_id' => User::factory()->parent(),
            'teacher_user_id' => User::factory()->teacher(),
            'status' => 'active',
        ];
    }
}
