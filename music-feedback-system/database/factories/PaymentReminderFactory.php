<?php

namespace Database\Factories;

use App\Models\PaymentReminder;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentReminderFactory extends Factory
{
    protected $model = PaymentReminder::class;

    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'amount' => fake()->randomFloat(2, 100, 5000),
            'due_date' => fake()->dateTimeBetween('now', '+60 days'),
            'status' => fake()->randomElement(['pending', 'paid', 'overdue', 'cancelled']),
            'note' => fake()->optional()->text(200),
        ];
    }
}
