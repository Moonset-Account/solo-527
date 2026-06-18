<?php

namespace App\Providers;

use App\Models\AccountApplication;
use App\Models\ChangeWindow;
use App\Models\DutySchedule;
use App\Models\EscalationRule;
use App\Models\OperationLog;
use App\Models\SavedQuery;
use App\Models\User;
use App\Policies\AccountApplicationPolicy;
use App\Policies\ChangeWindowPolicy;
use App\Policies\DutySchedulePolicy;
use App\Policies\EscalationRulePolicy;
use App\Policies\OperationLogPolicy;
use App\Policies\SavedQueryPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    protected $policies = [
        User::class => UserPolicy::class,
        DutySchedule::class => DutySchedulePolicy::class,
        EscalationRule::class => EscalationRulePolicy::class,
        SavedQuery::class => SavedQueryPolicy::class,
        AccountApplication::class => AccountApplicationPolicy::class,
        ChangeWindow::class => ChangeWindowPolicy::class,
        OperationLog::class => OperationLogPolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('access-dashboard', function (User $user) {
            return true;
        });

        Gate::define('manage-alerts', function (User $user) {
            return true;
        });

        Gate::define('export-data', function (User $user) {
            return $user->isAdmin();
        });
    }
}
