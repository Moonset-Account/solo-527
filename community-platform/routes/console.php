<?php

use App\Services\ParticipationStatService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('community:sync-overdue', function () {
    $service = new ParticipationStatService();
    $service->syncOverdueToStats();
    $this->info('逾期帮扶已同步至待办和参与统计');
})->purpose('将逾期帮扶需求形成待办并同步到居民参与统计');

Schedule::command('community:sync-overdue')->dailyAt('08:00');
