<?php

namespace App\Jobs;

use App\Services\PermissionExpiryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckPermissionExpiryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(PermissionExpiryService $service): void
    {
        $service->notifyExpiring();
        $service->deactivateExpired();
    }
}
