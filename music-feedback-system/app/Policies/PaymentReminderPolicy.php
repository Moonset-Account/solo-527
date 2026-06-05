<?php

namespace App\Policies;

use App\Models\PaymentReminder;
use App\Models\User;

class PaymentReminderPolicy
{
    public function before(User $user, string $ability): bool|null
    {
        if ($user->role === 'admin') {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, PaymentReminder $paymentReminder): bool
    {
        if ($user->role === 'parent') {
            return $paymentReminder->student->parent_user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, PaymentReminder $paymentReminder): bool
    {
        return false;
    }

    public function delete(User $user, PaymentReminder $paymentReminder): bool
    {
        return false;
    }

    public function markPaid(User $user, PaymentReminder $paymentReminder): bool
    {
        return false;
    }

    public function exportPayments(User $user): bool
    {
        return $user->role === 'admin';
    }
}
