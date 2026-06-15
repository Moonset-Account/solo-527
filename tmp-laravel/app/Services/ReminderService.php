<?php

namespace App\Services;

use App\Models\ComplianceGap;
use App\Models\ChecklistRecord;
use App\Models\ReminderRule;
use App\Models\ReminderLog;
use App\Models\User;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class ReminderService
{
    protected $redisPrefix = 'compliance_reminders:';

    public function processAllReminders(): array
    {
        $results = [
            'gap_due' => 0,
            'gap_overdue' => 0,
            'checklist_due' => 0,
            'review_pending' => 0,
            'total_sent' => 0,
        ];

        $rules = ReminderRule::enabled()->get();

        foreach ($rules as $rule) {
            $count = match ($rule->type) {
                ReminderRule::TYPE_GAP_DUE => $this->processGapDueReminders($rule),
                ReminderRule::TYPE_GAP_OVERDUE => $this->processGapOverdueReminders($rule),
                ReminderRule::TYPE_CHECKLIST_DUE => $this->processChecklistDueReminders($rule),
                ReminderRule::TYPE_REVIEW_PENDING => $this->processReviewPendingReminders($rule),
                default => 0,
            };

            $results[$rule->type] = $count;
            $results['total_sent'] += $count;
        }

        return $results;
    }

    public function processGapDueReminders(ReminderRule $rule): int
    {
        $sentCount = 0;

        $gaps = ComplianceGap::open()
            ->whereNotNull('due_date')
            ->get();

        foreach ($gaps as $gap) {
            if (!$this->shouldSendReminder($rule, $gap)) {
                continue;
            }

            $recipients = $this->getRecipients($rule, $gap);

            foreach ($recipients as $recipient) {
                if ($this->hasRecentReminder($gap, $recipient, $rule)) {
                    continue;
                }

                $this->sendReminder($rule, $gap, $recipient, 'gap_due');
                $sentCount++;
            }
        }

        return $sentCount;
    }

    public function processGapOverdueReminders(ReminderRule $rule): int
    {
        $sentCount = 0;

        $gaps = ComplianceGap::overdue()->get();

        foreach ($gaps as $gap) {
            if (!$this->shouldSendOverdueReminder($rule, $gap)) {
                continue;
            }

            $recipients = $this->getRecipients($rule, $gap);

            foreach ($recipients as $recipient) {
                if ($this->hasRecentReminder($gap, $recipient, $rule)) {
                    continue;
                }

                $this->sendReminder($rule, $gap, $recipient, 'gap_overdue');
                $sentCount++;
            }
        }

        return $sentCount;
    }

    public function processChecklistDueReminders(ReminderRule $rule): int
    {
        $sentCount = 0;

        $records = ChecklistRecord::whereIn('status', ['draft', 'submitted'])
            ->whereNotNull('due_date')
            ->get();

        foreach ($records as $record) {
            if (!$this->shouldSendReminder($rule, $record)) {
                continue;
            }

            $recipients = $this->getChecklistRecipients($rule, $record);

            foreach ($recipients as $recipient) {
                if ($this->hasRecentReminder($record, $recipient, $rule)) {
                    continue;
                }

                $this->sendReminder($rule, $record, $recipient, 'checklist_due');
                $sentCount++;
            }
        }

        return $sentCount;
    }

    public function processReviewPendingReminders(ReminderRule $rule): int
    {
        $sentCount = 0;

        $gaps = ComplianceGap::where('status', 'pending_review')->get();

        foreach ($gaps as $gap) {
            $recipients = $this->getReviewers($rule);

            foreach ($recipients as $recipient) {
                if ($this->hasRecentReminder($gap, $recipient, $rule)) {
                    continue;
                }

                $this->sendReminder($rule, $gap, $recipient, 'review_pending');
                $sentCount++;
            }
        }

        return $sentCount;
    }

    protected function shouldSendReminder(ReminderRule $rule, $item): bool
    {
        $dueDate = $item->due_date ? $item->due_date->copy() : null;
        if (!$dueDate) {
            return false;
        }

        $now = now();

        switch ($rule->trigger_condition) {
            case ReminderRule::TRIGGER_BEFORE_DUE:
                $triggerDate = $dueDate->sub($rule->trigger_value, $rule->time_unit);
                return $now->gte($triggerDate) && $now->lt($dueDate);
            case ReminderRule::TRIGGER_AFTER_DUE:
                $triggerDate = $dueDate->add($rule->trigger_value, $rule->time_unit);
                return $now->gte($triggerDate);
            case ReminderRule::TRIGGER_DAILY:
                return true;
            default:
                return false;
        }
    }

    protected function shouldSendOverdueReminder(ReminderRule $rule, $gap): bool
    {
        if (!$gap->isOverdue()) {
            return false;
        }

        return true;
    }

    protected function hasRecentReminder($notifiable, User $recipient, ReminderRule $rule): bool
    {
        $key = $this->redisPrefix . $rule->type . ':' . $notifiable->id . ':' . $recipient->id;

        $lastSent = Redis::get($key);
        if ($lastSent) {
            $intervalHours = $rule->reminder_interval_hours;
            if (time() - $lastSent < $intervalHours * 3600) {
                return true;
            }
        }

        $reminderCount = ReminderLog::where('reminder_rule_id', $rule->id)
            ->where('notifiable_type', get_class($notifiable))
            ->where('notifiable_id', $notifiable->id)
            ->where('recipient_id', $recipient->id)
            ->count();

        if ($rule->max_reminders > 0 && $reminderCount >= $rule->max_reminders) {
            return true;
        }

        return false;
    }

    protected function sendReminder(ReminderRule $rule, $notifiable, User $recipient, string $type): ReminderLog
    {
        $title = $this->getReminderTitle($type, $notifiable);
        $content = $this->getReminderContent($type, $notifiable, $rule);

        $reminder = ReminderLog::create([
            'reminder_rule_id' => $rule->id,
            'type' => $type,
            'notifiable_type' => get_class($notifiable),
            'notifiable_id' => $notifiable->id,
            'recipient_id' => $recipient->id,
            'channel' => $rule->channel,
            'title' => $title,
            'content' => $content,
            'status' => ReminderLog::STATUS_SENT,
            'sent_at' => now(),
        ]);

        $key = $this->redisPrefix . $type . ':' . $notifiable->id . ':' . $recipient->id;
        Redis::setex($key, $rule->reminder_interval_hours * 3600, time());

        if ($rule->channel === ReminderRule::CHANNEL_EMAIL) {
            try {
            } catch (\Exception $e) {
                Log::error('发送提醒邮件失败: ' . $e->getMessage());
                $reminder->update(['status' => ReminderLog::STATUS_FAILED]);
            }
        }

        return $reminder;
    }

    protected function getReminderTitle(string $type, $notifiable): string
    {
        return match ($type) {
            'gap_due' => '缺口整改到期提醒',
            'gap_overdue' => '缺口整改逾期提醒',
            'checklist_due' => '检查清单到期提醒',
            'review_pending' => '待审核提醒',
            default => '合规提醒',
        };
    }

    protected function getReminderContent(string $type, $notifiable, ReminderRule $rule): string
    {
        if ($rule->template) {
            $template = $rule->template;
            if ($notifiable instanceof ComplianceGap) {
                $template = str_replace('{{gap_no}}', $notifiable->gap_no, $template);
                $template = str_replace('{{title}}', $notifiable->title, $template);
                $template = str_replace('{{due_date}}', $notifiable->due_date?->toDateString() ?? '-', $template);
                $template = str_replace('{{responsible}}', $notifiable->responsibleUser?->name ?? '未指派', $template);
            }
            return $template;
        }

        if ($notifiable instanceof ComplianceGap) {
            return "【{$notifiable->gap_no}】{$notifiable->title} 的整改期限为 {$notifiable->due_date?->toDateString()}，请及时处理。";
        }

        if ($notifiable instanceof ChecklistRecord) {
            return "检查记录【{$notifiable->title}】的整改期限为 {$notifiable->due_date?->toDateString()}，请及时处理。";
        }

        return '您有待处理的合规事项，请及时处理。';
    }

    protected function getRecipients(ReminderRule $rule, $gap): array
    {
        $recipients = collect();

        if ($rule->recipient_roles) {
            $roleRecipients = User::whereIn('role', $rule->recipient_roles)->get();
            $recipients = $recipients->merge($roleRecipients);
        }

        if ($rule->recipient_user_ids) {
            $userRecipients = User::whereIn('id', $rule->recipient_user_ids)->get();
            $recipients = $recipients->merge($userRecipients);
        }

        if ($gap->responsible_user_id) {
            $responsibleUser = User::find($gap->responsible_user_id);
            if ($responsibleUser) {
                $recipients->push($responsibleUser);
            }
        }

        if ($gap->responsible_user_id && $gap->responsibleUser) {
            if ($gap->responsibleUser->role === User::ROLE_PROJECT_SECRETARY) {
            }
        }

        return $recipients->unique('id')->values()->all();
    }

    protected function getChecklistRecipients(ReminderRule $rule, $record): array
    {
        $recipients = collect();

        if ($rule->recipient_roles) {
            $roleRecipients = User::whereIn('role', $rule->recipient_roles)->get();
            $recipients = $recipients->merge($roleRecipients);
        }

        if ($record->responsible_user_id) {
            $responsibleUser = User::find($record->responsible_user_id);
            if ($responsibleUser) {
                $recipients->push($responsibleUser);
            }
        }

        if ($record->submitted_by) {
            $submitter = User::find($record->submitted_by);
            if ($submitter) {
                $recipients->push($submitter);
            }
        }

        return $recipients->unique('id')->values()->all();
    }

    protected function getReviewers(ReminderRule $rule): array
    {
        $recipients = collect();

        if ($rule->recipient_roles) {
            $roleRecipients = User::whereIn('role', $rule->recipient_roles)->get();
            $recipients = $recipients->merge($roleRecipients);
        }

        if ($rule->recipient_user_ids) {
            $userRecipients = User::whereIn('id', $rule->recipient_user_ids)->get();
            $recipients = $recipients->merge($userRecipients);
        }

        if ($recipients->isEmpty()) {
            $complianceManagers = User::where('role', User::ROLE_COMPLIANCE_MANAGER)->get();
            $recipients = $complianceManagers;
        }

        return $recipients->unique('id')->values()->all();
    }

    public function getUnreadReminderCount(int $userId): int
    {
        return ReminderLog::where('recipient_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    public function clearReminderCache(string $type, int $notifiableId, int $userId): void
    {
        $key = $this->redisPrefix . $type . ':' . $notifiableId . ':' . $userId;
        Redis::del($key);
    }
}
