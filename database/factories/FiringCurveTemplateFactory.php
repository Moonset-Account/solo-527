<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class FiringCurveTemplateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->word() . ' Firing Curve',
            'description' => fake()->paragraph(),
            'max_temperature' => fake()->numberBetween(1200, 1300),
            'atmosphere' => fake()->randomElement(['oxidation', 'reduction', 'neutral']),
            'total_duration_minutes' => fake()->numberBetween(360, 720),
            'created_by' => 1,
            'is_public' => true,
            'is_active' => true,
        ];
    }
}
