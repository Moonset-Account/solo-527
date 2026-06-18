<?php

namespace Database\Seeders;

use App\Models\EnvironmentData;
use App\Models\Greenhouse;
use Illuminate\Database\Seeder;

class EnvironmentDataSeeder extends Seeder
{
    public function run(): void
    {
        $greenhouses = Greenhouse::all();

        foreach ($greenhouses as $greenhouse) {
            $startDate = now()->subDays(7);

            for ($day = 0; $day < 7; $day++) {
                for ($hour = 0; $hour < 24; $hour++) {
                    $recordedAt = $startDate->copy()->addDays($day)->addHours($hour);

                    $isAnomaly = rand(0, 100) < 15;

                    if ($isAnomaly) {
                        $anomalyType = rand(0, 3);
                        $temperature = match ($anomalyType) {
                            0 => rand(40, 50),
                            default => rand(15, 30),
                        };
                        $humidity = match ($anomalyType) {
                            1 => rand(0, 30),
                            default => rand(50, 90),
                        };
                        $soilMoisture = match ($anomalyType) {
                            2 => rand(0, 15),
                            default => rand(40, 80),
                        };
                        $phValue = match ($anomalyType) {
                            3 => rand(1, 3),
                            default => rand(55, 75) / 10,
                        };
                    } else {
                        $temperature = rand(18, 28);
                        $humidity = rand(55, 85);
                        $soilMoisture = rand(45, 75);
                        $phValue = rand(58, 72) / 10;
                    }

                    EnvironmentData::create([
                        'greenhouse_id' => $greenhouse->id,
                        'sensor_id' => null,
                        'temperature' => $temperature,
                        'humidity' => $humidity,
                        'soil_moisture' => $soilMoisture,
                        'light_intensity' => rand(2000, 8000),
                        'co2_level' => rand(400, 800),
                        'ph_value' => $phValue,
                        'is_anomaly' => $isAnomaly,
                        'anomaly_type' => $isAnomaly ? match (rand(0, 3)) {
                            0 => 'temperature',
                            1 => 'humidity',
                            2 => 'soil_moisture',
                            3 => 'ph_value',
                        } : null,
                        'recorded_at' => $recordedAt,
                    ]);
                }
            }
        }
    }
}
