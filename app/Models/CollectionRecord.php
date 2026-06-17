<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class CollectionRecord extends Model
{
    use HasFactory, SoftDeletes;

    const METHOD_PHONE = 'phone';
    const METHOD_EMAIL = 'email';
    const METHOD_VISIT = 'visit';
    const METHOD_LETTER = 'letter';
    const METHOD_OTHER = 'other';

    protected $fillable = [
        'project_id',
        'collection_time',
        'method',
        'contact_person',
        'contact_phone',
        'result',
        'next_follow_up',
        'collected_by',
        'remarks',
    ];

    protected $casts = [
        'collection_time' => 'datetime',
        'next_follow_up' => 'date',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function scopeMethod($query, $method)
    {
        return $query->where('method', $method);
    }

    public function scopeByPhone($query)
    {
        return $query->where('method', self::METHOD_PHONE);
    }

    public function scopeByEmail($query)
    {
        return $query->where('method', self::METHOD_EMAIL);
    }

    public function scopeByVisit($query)
    {
        return $query->where('method', self::METHOD_VISIT);
    }

    public function scopeProject($query, $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeCollectedBy($query, $collector)
    {
        return $query->where('collected_by', $collector);
    }

    public function scopeContactPerson($query, $person)
    {
        return $query->where('contact_person', 'like', "%{$person}%");
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('collection_time', [$startDate, $endDate]);
    }

    public function scopeFollowUpToday($query)
    {
        return $query->whereDate('next_follow_up', now()->toDateString());
    }

    public function scopeFollowUpWithin($query, $days)
    {
        return $query->whereBetween('next_follow_up', [
            now()->toDateString(),
            now()->addDays($days)->toDateString(),
        ]);
    }

    public function scopeOverdueFollowUp($query)
    {
        return $query->where('next_follow_up', '<', now()->toDateString());
    }

    protected function formattedCollectionTime(): Attribute
    {
        return Attribute::make(
            get: fn () => optional($this->collection_time)->format('Y-m-d H:i'),
        );
    }

    protected function formattedNextFollowUp(): Attribute
    {
        return Attribute::make(
            get: fn () => optional($this->next_follow_up)->format('Y-m-d'),
        );
    }

    protected function methodLabel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $labels = [
                    self::METHOD_PHONE => '电话',
                    self::METHOD_EMAIL => '邮件',
                    self::METHOD_VISIT => '上门',
                    self::METHOD_LETTER => '信函',
                    self::METHOD_OTHER => '其他',
                ];
                return $labels[$this->method] ?? $this->method;
            },
        );
    }

    protected function isFollowUpOverdue(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->next_follow_up && $this->next_follow_up < now()->toDateString(),
        );
    }

    protected function isFollowUpToday(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->next_follow_up && $this->next_follow_up->isToday(),
        );
    }

    protected function daysUntilFollowUp(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->next_follow_up ? now()->diffInDays($this->next_follow_up, false) : null,
        );
    }

    protected function projectName(): Attribute
    {
        return Attribute::make(
            get: fn () => optional($this->project)->name,
        );
    }

    protected function customerName(): Attribute
    {
        return Attribute::make(
            get: fn () => optional($this->project)->customer,
        );
    }
}
