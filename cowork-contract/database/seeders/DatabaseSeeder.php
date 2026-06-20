<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::create([
            'name' => '管理员',
            'email' => 'admin@cowork.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => '财务专员',
            'email' => 'finance@cowork.com',
            'password' => Hash::make('password'),
            'role' => 'finance',
        ]);

        User::create([
            'name' => '招商顾问',
            'email' => 'consultant@cowork.com',
            'password' => Hash::make('password'),
            'role' => 'consultant',
        ]);
    }
}
