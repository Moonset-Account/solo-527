<?php

namespace App\Console\Commands;

use App\Jobs\EvaluateAlertsJob;
use Illuminate\Console\Command;

class EvaluateAlertsCommand extends Command
{
    protected $signature = 'alerts:evaluate';

    protected $description = 'Evaluate all active alert rules';

    public function handle(): void
    {
        dispatch(new EvaluateAlertsJob());
    }
}
