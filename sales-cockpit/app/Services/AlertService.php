<?php

namespace App\Services;

use App\Models\AlertRule;
use App\Models\IndicatorValue;
use App\Notifications\AlertTriggeredNotification;
use Illuminate\Support\Facades\Redis;
use App\Models\User;

class AlertService
{
    public function evaluateAlerts(): void
    {
        $rules = AlertRule::where('is_active', true)
            ->with(['indicator', 'businessOrder'])
            ->get();

        foreach ($rules as $rule) {
            $latestValue = IndicatorValue::where('indicator_id', $rule->indicator_id)
                ->latest('time_period')
                ->first();

            if (!$latestValue) {
                continue;
            }

            if (!$this->isTriggered($rule, $latestValue)) {
                continue;
            }

            $date = now()->toDateString();
            $cacheKey = "alert_triggered:{$rule->id}:{$date}";

            if (Redis::exists($cacheKey)) {
                continue;
            }

            $ttl = $this->getTtlByRhythm($rule);
            Redis::setex($cacheKey, $ttl, (string) $rule->id);

            $notifyUserIds = $rule->notify_user_ids ?? [];

            foreach ($notifyUserIds as $userId) {
                $user = User::find($userId);
                if ($user) {
                    $user->notify(new AlertTriggeredNotification($rule, $latestValue));
                }
            }
        }
    }

    private function isTriggered(AlertRule $rule, IndicatorValue $value): bool
    {
        $actual = (float) $value->value;
        $threshold = (float) $rule->threshold_value;

        return match ($rule->condition_type) {
            'gt' => $actual > $threshold,
            'lt' => $actual < $threshold,
            'eq' => abs($actual - $threshold) < 0.0001,
            'gte' => $actual >= $threshold,
            'lte' => $actual <= $threshold,
            'between' => $rule->threshold_value_max !== null
                && $actual >= $threshold
                && $actual <= (float) $rule->threshold_value_max,
            default => false,
        };
    }

    private function getTtlByRhythm(AlertRule $rule): int
    {
        return match (optional($rule->businessOrder)->status) {
            default => 86400,
        };
    }
}
