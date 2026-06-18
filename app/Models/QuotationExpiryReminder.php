<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuotationExpiryReminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_id',
        'reminder_type',
        'reminder_date',
        'sent_at',
        'recipient_id',
        'recipient_email',
        'recipient_phone',
        'channel',
        'message',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'reminder_date' => 'date',
            'sent_at' => 'datetime',
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function scopeUnsent($query)
    {
        return $query->whereNull('sent_at');
    }

    public function scopeSent($query)
    {
        return $query->whereNotNull('sent_at');
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeByQuotation($query, int $quotationId)
    {
        return $query->where('quotation_id', $quotationId);
    }

    public function scopeDue($query)
    {
        return $query->unsent()->where('reminder_date', '<=', now());
    }

    public function isSent(): bool
    {
        return $this->sent_at !== null;
    }

    public function isRead(): bool
    {
        return $this->is_read;
    }

    public function isDue(): bool
    {
        return !$this->isSent() && $this->reminder_date->isToday() || $this->reminder_date->isPast();
    }

    public function markSent(): bool
    {
        $this->sent_at = now();
        return $this->save();
    }

    public function markRead(): bool
    {
        $this->is_read = true;
        $this->read_at = now();
        return $this->save();
    }
}
