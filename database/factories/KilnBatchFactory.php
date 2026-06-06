<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class KilnBatchFactory extends Factory
{
    public function definition(): array
    {
        return [
            'batch_number' => \App\Models\KilnBatch::generateBatchNumber(),
            'kiln_id' => 1,
            'firing_curve_template_id' => 1,
            'created_by' => 1,
            'scheduled_fire_date' => fake()->dateTimeBetween('now', '+1 month'),
            'status' => 'draft',
            'max_capacity' => 20,
            'used_space_percent' => 0,
            'notes' => fake()->paragraph(),
        ];
    }
}
