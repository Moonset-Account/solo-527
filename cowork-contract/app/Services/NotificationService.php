<?php

namespace App\Services;

use App\Models\ContractRisk;
use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public function send(User $notifiable, string $type, string $category, string $title, string $body, ?array $data = null): Notification
    {
        return Notification::create([
            'notifiable_type' => get_class($notifiable),
            'notifiable_id' => $notifiable->id,
            'type' => $type,
            'category' => $category,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    public function sendRentReminder(User $user, array $upcomingBills, array $overdueBills): Notification
    {
        return $this->send(
            $user,
            'rent_reminder',
            'billing',
            '租金提醒',
            '您有即将到期或逾期的账单，请及时处理。',
            [
                'upcoming_bills' => $upcomingBills,
                'overdue_bills' => $overdueBills,
            ]
        );
    }

    public function sendContractRiskAlert(User $user, ContractRisk $risk): Notification
    {
        return $this->send(
            $user,
            'risk_alert',
            'risk',
            '合同风险预警',
            $risk->description,
            [
                'risk_id' => $risk->id,
                'contract_id' => $risk->contract_id,
                'risk_type' => $risk->risk_type,
                'severity' => $risk->severity,
            ]
        );
    }
}
