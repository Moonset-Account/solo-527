<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ClayFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->word() . ' Clay',
            'code' => fake()->unique()->bothify('CL-###'),
            'description' => fake()->paragraph(),
            'firing_temp_min' => fake()->numberBetween(1000, 1150),
            'firing_temp_max' => fake()->numberBetween(1200, 1300),
            'atmosphere' => fake()->randomElement(['oxidation', 'reduction', 'neutral']),
            'shrinkage_rate' => fake()->randomFloat(2, 5, 15),
            'is_active' => true,
        ];
    }
}
