<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('quotations:check-expiry')->dailyAt('09:00');
Schedule::command('batches:retry-failed')->everyThirtyMinutes();
Schedule::command('suppliers:assess-risk')->weeklyOn(1, '02:00');
Schedule::command('sync:delivery-discrepancies')->everyTenMinutes();
