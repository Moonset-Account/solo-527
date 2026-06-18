<?php

namespace Database\Factories;

use App\Enums\SupplierRiskLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupplierFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'code' => 'SUP' . str_pad(fake()->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
            'contact_person' => fake()->name(),
            'contact_phone' => fake()->phoneNumber(),
            'contact_email' => fake()->companyEmail(),
            'address' => fake()->address(),
            'business_license' => 'LIC' . fake()->unique()->numberBetween(100000, 999999),
            'tax_number' => 'TAX' . fake()->unique()->numberBetween(100000, 999999),
            'bank_account' => fake()->bankAccountNumber(),
            'bank_name' => fake()->randomElement(['工商银行', '建设银行', '农业银行', '中国银行', '招商银行']),
            'risk_level' => fake()->randomElement(array_column(SupplierRiskLevel::cases(), 'value')),
            'credit_rating' => fake()->randomElement(['A', 'B', 'C', 'D']),
            'cooperation_since' => fake()->date(),
            'is_active' => true,
            'remark' => fake()->optional()->paragraph(),
        ];
    }
}
