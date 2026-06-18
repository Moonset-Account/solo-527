<?php

namespace App\Providers;

use App\Models\Greenhouse;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\SortingTask;
use App\Models\SortingDiscrepancy;
use App\Models\SubsidyVoucher;
use App\Models\MachineryAppointment;
use App\Observers\AuditObserver;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Inertia::share([
            'app_name' => config('app.name'),
        ]);

        $this->registerAuditObservers();
    }

    protected function registerAuditObservers(): void
    {
        $auditableModels = [
            Greenhouse::class,
            Order::class,
            SortingTask::class,
            SortingDiscrepancy::class,
            Shipment::class,
            SubsidyVoucher::class,
            MachineryAppointment::class,
        ];

        foreach ($auditableModels as $model) {
            if (class_exists($model)) {
                $model::observe(new class
                {
                    public function created($model)
                    {
                        $this->logAudit($model, 'created', null, $model->getAttributes());
                    }

                    public function updated($model)
                    {
                        $old = $model->getOriginal();
                        $new = $model->getAttributes();
                        $changed = array_diff_assoc($new, $old);

                        if (!empty($changed)) {
                            $this->logAudit($model, 'updated', $old, $changed);
                        }
                    }

                    public function deleted($model)
                    {
                        $this->logAudit($model, 'deleted', $model->getAttributes(), null);
                    }

                    protected function logAudit($model, string $action, ?array $oldValues, ?array $newValues): void
                    {
                        if (!auth()->check()) {
                            return;
                        }

                        $hidden = method_exists($model, 'getHidden') ? $model->getHidden() : [];
                        $old = $oldValues ? array_diff_key($oldValues, array_flip($hidden)) : null;
                        $new = $newValues ? array_diff_key($newValues, array_flip($hidden)) : null;

                        \App\Models\AuditLog::create([
                            'auditable_type' => get_class($model),
                            'auditable_id' => $model->getKey(),
                            'user_id' => auth()->id(),
                            'action' => $action,
                            'old_values' => $old,
                            'new_values' => $new,
                            'ip_address' => request()->ip(),
                            'user_agent' => request()->userAgent(),
                        ]);
                    }
                });
            }
        }
    }
}
