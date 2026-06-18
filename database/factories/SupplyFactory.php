<?php

namespace Database\Factories;

use App\Models\SupplyCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupplyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => SupplyCategory::inRandomOrder()->value('id') ?? 1,
            'name' => fake()->word() . ' ' . fake()->word(),
            'code' => 'SUP' . str_pad(fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'specification' => fake()->sentence(3),
            'unit' => fake()->randomElement(['个', '包', '盒', '箱', '本', '支', '卷']),
            'reference_price' => fake()->randomFloat(2, 1, 1000),
            'stock_quantity' => fake()->numberBetween(0, 500),
            'safety_stock' => fake()->numberBetween(10, 100),
            'description' => fake()->optional()->paragraph(),
            'is_active' => true,
        ];
    }
}
