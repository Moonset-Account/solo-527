<?php

namespace App\Notifications;

use App\Models\DatasetPermission;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PermissionExpiringNotification extends Notification
{
    use Queueable;

    public function __construct(
        public DatasetPermission $permission,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('数据集权限即将到期')
            ->greeting("您好，{$notifiable->name}")
            ->line("您的数据集权限即将到期。")
            ->line("数据集名称：{$this->permission->dataset_name}")
            ->line("到期时间：{$this->permission->expires_at->format('Y-m-d H:i')}")
            ->line("关联工单：{$this->permission->businessOrder?->order_no}")
            ->action('查看详情', url('/business-orders/' . $this->permission->business_order_id))
            ->line('如需续期，请联系管理员。');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'permission_id' => $this->permission->id,
            'dataset_name' => $this->permission->dataset_name,
            'expires_at' => $this->permission->expires_at->toDateTimeString(),
            'business_order_id' => $this->permission->business_order_id,
        ];
    }
}
