<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceFeedback extends Model
{
    use HasFactory;

    protected $table = 'attendance_feedbacks';

    protected $fillable = [
        'registration_id', 'event_id', 'session_id',
        'overall_rating', 'content_rating', 'venue_rating', 'service_rating',
        'organization_rating', 'content_feedback', 'improvement_suggestion',
        'good_points', 'other_comments', 'custom_feedback',
        'is_willing_next_time', 'would_recommend', 'is_anonymous', 'status',
        'submitted_by',
    ];

    protected function casts(): array
    {
        return [
            'custom_feedback' => 'array',
            'is_willing_next_time' => 'boolean',
            'would_recommend' => 'boolean',
            'is_anonymous' => 'boolean',
        ];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(EventSession::class, 'session_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function getAverageRating(): float
    {
        $scores = [
            $this->overall_rating,
            $this->content_rating,
            $this->venue_rating,
            $this->service_rating,
            $this->organization_rating,
        ];
        $validScores = array_filter($scores, fn($s) => $s !== null && $s > 0);
        if (empty($validScores)) return 0;
        return round(array_sum($validScores) / count($validScores), 2);
    }
}
