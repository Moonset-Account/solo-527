<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class WorkFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->word() . ' ' . fake()->word(),
            'student_id' => 1,
            'clay_id' => 1,
            'description' => fake()->paragraph(),
            'width' => fake()->randomFloat(2, 5, 30),
            'height' => fake()->randomFloat(2, 5, 30),
            'depth' => fake()->randomFloat(2, 5, 30),
            'estimated_volume' => null,
            'temperature_zone_preference' => fake()->randomElement([0, 1, 2]),
            'status' => 'created',
            'for_exhibition' => false,
            'breakage_reason' => null,
            'compensation_status' => 'none',
            'compensation_notes' => null,
        ];
    }
}
