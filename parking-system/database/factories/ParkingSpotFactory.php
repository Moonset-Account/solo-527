<?php

namespace Database\Factories;

use App\Models\ParkingSpot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ParkingSpotFactory extends Factory
{
    protected $model = ParkingSpot::class;

    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'spot_number' => strtoupper($this->faker->bothify('A-###')),
            'location' => $this->faker->address(),
            'hourly_rate' => $this->faker->randomFloat(2, 5, 20),
            'daily_rate' => $this->faker->randomFloat(2, 50, 150),
            'description' => $this->faker->sentence(),
            'status' => 'active',
        ];
    }
}
