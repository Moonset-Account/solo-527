<?php

namespace App\Console\Commands;

use App\Jobs\CheckPermissionExpiryJob;
use Illuminate\Console\Command;

class CheckPermissionExpiryCommand extends Command
{
    protected $signature = 'permissions:check-expiry';

    protected $description = 'Check for expiring dataset permissions';

    public function handle(): void
    {
        dispatch(new CheckPermissionExpiryJob());
    }
}
