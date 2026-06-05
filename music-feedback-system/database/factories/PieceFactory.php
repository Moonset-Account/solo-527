<?php

namespace Database\Factories;

use App\Models\Piece;
use Illuminate\Database\Eloquent\Factories\Factory;

class PieceFactory extends Factory
{
    protected $model = Piece::class;

    public function definition(): array
    {
        return [
            'title' => fake()->words(3, true),
            'composer' => fake()->optional()->name(),
            'instrument' => fake()->randomElement(['piano', 'violin', 'guitar', 'flute', 'drums']),
            'difficulty_level' => fake()->randomElement(['beginner', 'elementary', 'intermediate', 'advanced']),
            'notes' => fake()->optional()->text(200),
        ];
    }
}
