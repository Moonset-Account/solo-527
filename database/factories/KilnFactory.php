<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class KilnFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Kiln ' . fake()->word(),
            'code' => fake()->unique()->bothify('KN-##'),
            'description' => fake()->paragraph(),
            'capacity' => fake()->numberBetween(10, 50),
            'width' => fake()->randomFloat(2, 50, 150),
            'height' => fake()->randomFloat(2, 50, 150),
            'depth' => fake()->randomFloat(2, 50, 150),
            'temp_max' => fake()->numberBetween(1200, 1400),
            'temperature_zones' => [1240, 1260, 1280],
            'type' => fake()->randomElement(['electric', 'gas', 'wood']),
            'is_active' => true,
        ];
    }
}
