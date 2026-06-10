<?php

namespace App\Notifications;

use App\Models\AlertRule;
use App\Models\IndicatorValue;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AlertTriggeredNotification extends Notification
{
    use Queueable;

    public function __construct(
        public AlertRule $rule,
        public IndicatorValue $latestValue,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $conditionLabel = match ($this->rule->condition_type) {
            'greater_than' => '大于',
            'less_than' => '小于',
            'equals' => '等于',
            'between' => '介于',
            'not_equals' => '不等于',
            default => $this->rule->condition_type,
        };

        $thresholdInfo = $this->rule->condition_type === 'between'
            ? "{$this->rule->threshold_value} ~ {$this->rule->threshold_value_max}"
            : (string) $this->rule->threshold_value;

        return (new MailMessage)
            ->subject('告警规则触发通知')
            ->greeting("您好，{$notifiable->name}")
            ->line("一条告警规则已被触发。")
            ->line("指标名称：{$this->rule->indicator?->name}")
            ->line("条件类型：{$conditionLabel}")
            ->line("阈值：{$thresholdInfo}")
            ->line("实际值：{$this->latestValue->value}")
            ->line("关联工单：{$this->rule->businessOrder?->order_no}")
            ->action('查看详情', url('/business-orders/' . $this->rule->business_order_id))
            ->line('请及时处理。');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'rule_id' => $this->rule->id,
            'indicator_name' => $this->rule->indicator?->name,
            'condition_type' => $this->rule->condition_type,
            'threshold_value' => (string) $this->rule->threshold_value,
            'actual_value' => (string) $this->latestValue->value,
            'business_order_id' => $this->rule->business_order_id,
        ];
    }
}
