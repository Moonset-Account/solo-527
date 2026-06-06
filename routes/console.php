<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('queue:retry all')->hourly();
Schedule::command('notifications:retry-failed')->everyThirtyMinutes();
