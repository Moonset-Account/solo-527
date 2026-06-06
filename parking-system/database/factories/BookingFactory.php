<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\ParkingSpot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        $startTime = Carbon::now()->addHours($this->faker->numberBetween(1, 24));
        $endTime = $startTime->copy()->addHours($this->faker->numberBetween(1, 8));
        $totalAmount = $this->faker->randomFloat(2, 10, 100);
        $platformFee = $totalAmount * 0.1;

        return [
            'booking_no' => 'BK' . date('YmdHis') . strtoupper($this->faker->bothify('????????')),
            'spot_id' => ParkingSpot::factory(),
            'visitor_id' => User::factory(),
            'license_plate' => strtoupper($this->faker->bothify('京?#####')),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'total_amount' => $totalAmount,
            'owner_earning' => $totalAmount - $platformFee,
            'platform_fee' => $platformFee,
            'refund_amount' => 0,
            'status' => 'pending',
            'cross_midnight' => $startTime->toDateString() !== $endTime->toDateString(),
            'manual_intervention_count' => 0,
        ];
    }
}
