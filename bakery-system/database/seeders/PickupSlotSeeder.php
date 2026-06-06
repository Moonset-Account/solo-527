<?php

namespace Database\Seeders;

use App\Models\PickupSlot;
use Illuminate\Database\Seeder;

class PickupSlotSeeder extends Seeder
{
    public function run(): void
    {
        $times = [
            ['09:00:00', '10:00:00', 5],
            ['10:00:00', '11:00:00', 8],
            ['11:00:00', '12:00:00', 8],
            ['14:00:00', '15:00:00', 8],
            ['15:00:00', '16:00:00', 10],
            ['16:00:00', '17:00:00', 10],
            ['17:00:00', '18:00:00', 8],
            ['18:00:00', '19:00:00', 5],
        ];

        for ($i = 0; $i < 14; $i++) {
            $date = now()->addDays($i);

            if ($date->isWeekend()) {
                foreach ($times as $time) {
                    PickupSlot::firstOrCreate(
                        ['date' => $date->toDateString(), 'start_time' => $time[0], 'end_time' => $time[1]],
                        [
                            'max_orders' => $time[2] + 5,
                            'current_orders' => 0,
                            'is_active' => true,
                        ]
                    );
                }
            } else {
                foreach ($times as $time) {
                    PickupSlot::firstOrCreate(
                        ['date' => $date->toDateString(), 'start_time' => $time[0], 'end_time' => $time[1]],
                        [
                            'max_orders' => $time[2],
                            'current_orders' => 0,
                            'is_active' => true,
                        ]
                    );
                }
            }
        }
    }
}
