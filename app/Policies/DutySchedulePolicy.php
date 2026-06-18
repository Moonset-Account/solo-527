<?php

namespace App\Policies;

use App\Models\DutySchedule;
use App\Models\User;

class DutySchedulePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, DutySchedule $schedule): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, DutySchedule $schedule): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, DutySchedule $schedule): bool
    {
        return $user->isAdmin();
    }
}
