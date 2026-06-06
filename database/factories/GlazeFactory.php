<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class GlazeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->colorName() . ' Glaze',
            'code' => fake()->unique()->bothify('GZ-###'),
            'color' => fake()->colorName(),
            'description' => fake()->paragraph(),
            'firing_temp_min' => fake()->numberBetween(1100, 1180),
            'firing_temp_max' => fake()->numberBetween(1220, 1280),
            'atmosphere' => fake()->randomElement(['oxidation', 'reduction', 'neutral']),
            'finish' => fake()->randomElement(['glossy', 'matte', 'satin', 'textured']),
            'is_active' => true,
        ];
    }
}
