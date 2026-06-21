<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Registration extends Model
{
    use HasFactory, SoftDeletes;

    const CONVERSION_STAGES = [
        'inquiry' => '咨询',
        'registered' => '已报名',
        'confirmed' => '已确认',
        'paid' => '已支付',
        'ticket_sent' => '已发券',
        'lost' => '已流失',
    ];

    const REGISTRATION_STATUSES = [
        'pending' => '待审核',
        'approved' => '已通过',
        'rejected' => '已拒绝',
        'cancelled' => '已取消',
        'refunded' => '已退款',
    ];

    const ATTENDANCE_STATUSES = [
        'not_arrived' => '未到场',
        'arrived' => '已到场',
        'partial' => '部分到场',
        'no_show' => '爽约',
    ];

    protected $fillable = [
        'event_id', 'ticket_type_id', 'registration_no', 'name', 'gender',
        'phone', 'email', 'company', 'industry', 'department', 'position',
        'wechat', 'id_card', 'employee_no', 'source_channel', 'source_detail',
        'dietary_requirement', 'remark', 'custom_fields', 'paid_amount',
        'payment_method', 'payment_no', 'paid_at', 'conversion_stage',
        'registration_status', 'attendance_status', 'confirmed_at',
        'cancelled_at', 'approved_at', 'approved_by', 'created_by',
        'updated_by', 'owner_id',
    ];

    protected function casts(): array
    {
        return [
            'custom_fields' => 'array',
            'paid_amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $registration) {
            if (empty($registration->registration_no)) {
                $registration->registration_no = static::generateRegistrationNo($registration->event_id);
            }
        });

        static::created(function (self $registration) {
            static::checkDuplicate($registration);
            $registration->scoreQuality();
        });

        static::updated(function (self $registration) {
            $registration->scoreQuality();
        });
    }

    public static function generateRegistrationNo($eventId): string
    {
        $prefix = 'BM' . date('YmdHis');
        $suffix = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        return "{$prefix}{$suffix}";
    }

    public static function checkDuplicate(self $registration): void
    {
        $eventId = $registration->event_id;

        if (!empty($registration->phone)) {
            $duplicates = static::where('event_id', $eventId)
                ->where('phone', $registration->phone)
                ->where('id', '!=', $registration->id)
                ->where('registration_status', '!=', 'cancelled')
                ->where('registration_status', '!=', 'refunded')
                ->pluck('id')
                ->all();

            if (!empty($duplicates)) {
                $allIds = array_merge($duplicates, [$registration->id]);
                DuplicateSeatRecord::create([
                    'event_id' => $eventId,
                    'conflict_type' => 'phone',
                    'phone' => $registration->phone,
                    'conflict_reason' => "同一活动中手机号 {$registration->phone} 重复报名",
                    'conflict_registration_ids' => $allIds,
                    'conflict_details' => [
                        'type' => 'phone',
                        'value' => $registration->phone,
                        'count' => count($allIds),
                    ],
                    'created_by' => $registration->created_by,
                ]);
            }
        }

        if (!empty($registration->company) && !empty($registration->name)) {
            $duplicates = static::where('event_id', $eventId)
                ->where('company', $registration->company)
                ->where('name', $registration->name)
                ->where('id', '!=', $registration->id)
                ->where('registration_status', '!=', 'cancelled')
                ->where('registration_status', '!=', 'refunded')
                ->pluck('id')
                ->all();

            if (!empty($duplicates)) {
                $allIds = array_merge($duplicates, [$registration->id]);
                DuplicateSeatRecord::firstOrCreate(
                    [
                        'event_id' => $eventId,
                        'conflict_type' => 'person',
                        'company' => $registration->company,
                        'phone' => $registration->phone,
                        'status' => 'pending',
                    ],
                    [
                        'conflict_reason' => "公司 [{$registration->company}] 中人员 [{$registration->name}] 重复报名",
                        'conflict_registration_ids' => $allIds,
                        'conflict_details' => [
                            'type' => 'person',
                            'company' => $registration->company,
                            'name' => $registration->name,
                            'count' => count($allIds),
                        ],
                        'created_by' => $registration->created_by,
                    ]
                );
            }
        }
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    public function sessions(): BelongsToMany
    {
        return $this->belongsToMany(EventSession::class, 'registration_session_pivots')
            ->withPivot(['seat_id', 'attendance_status', 'checked_in_at', 'check_in_method', 'checked_in_by'])
            ->withTimestamps();
    }

    public function sessionPivots(): HasMany
    {
        return $this->hasMany(RegistrationSessionPivot::class);
    }

    public function qualityScore(): HasOne
    {
        return $this->hasOne(RegistrationQualityScore::class);
    }

    public function refundRequests(): HasMany
    {
        return $this->hasMany(RefundRequest::class);
    }

    public function attendanceFeedbacks(): HasMany
    {
        return $this->hasMany(AttendanceFeedback::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function scoreQuality(): void
    {
        $score = 0;
        $infoScore = 0;

        if (!empty($this->name)) $infoScore += 10;
        if (!empty($this->phone)) $infoScore += 15;
        if (!empty($this->email)) $infoScore += 10;
        if (!empty($this->company)) $infoScore += 15;
        if (!empty($this->position)) $infoScore += 10;
        if (!empty($this->industry)) $infoScore += 10;
        if (!empty($this->department)) $infoScore += 10;
        if (!empty($this->wechat)) $infoScore += 10;
        if (!empty($this->id_card)) $infoScore += 10;
        if ($this->conversion_stage === 'paid') $infoScore += 0;
        if ($this->paid_amount > 0) $infoScore += 0;

        $infoScore = min(100, $infoScore);

        $positionScore = 0;
        $positionLower = mb_strtolower($this->position ?? '');
        if (preg_match('/(ceo|cto|cfo|coo|总裁|董事|创始人|主席)/', $positionLower)) {
            $positionScore = 100;
        } elseif (preg_match('/(副总|总监|vp|高级副总裁|副总裁)/', $positionLower)) {
            $positionScore = 85;
        } elseif (preg_match('/(经理|主管|部门长|主任)/', $positionLower)) {
            $positionScore = 65;
        } elseif (!empty($this->position)) {
            $positionScore = 40;
        }

        $companyScore = 0;
        $companyLower = mb_strtolower($this->company ?? '');
        if (preg_match('/(集团|控股|上市|股份|中国|国家|央企|国企)/', $companyLower)) {
            $companyScore = 85;
        } elseif (preg_match('/(科技|信息|软件|智能|数据|互联网)/', $companyLower)) {
            $companyScore = 65;
        } elseif (!empty($this->company)) {
            $companyScore = 45;
        }

        $industryScore = 0;
        if (!empty($this->industry)) {
            $targetIndustries = ['科技', '金融', '互联网', '人工智能', '大数据', '云计算', '医疗', '制造'];
            foreach ($targetIndustries as $ind) {
                if (mb_strpos($this->industry, $ind) !== false) {
                    $industryScore = 85;
                    break;
                }
            }
            if ($industryScore === 0) {
                $industryScore = 55;
            }
        }

        $historyScore = 0;
        if ($this->wasRecentlyCreated && !empty($this->source_channel)) {
            $historyScore = 30;
        }
        if ($this->attendance_status === 'arrived') {
            $historyScore += 50;
        }
        if ($this->conversion_stage === 'paid') {
            $historyScore += 20;
        }
        $historyScore = min(100, $historyScore);

        $total = round(($infoScore * 0.25) + ($positionScore * 0.30) + ($companyScore * 0.20) + ($industryScore * 0.15) + ($historyScore * 0.10));

        if ($total >= 85) {
            $level = 'S';
        } elseif ($total >= 70) {
            $level = 'A';
        } elseif ($total >= 55) {
            $level = 'B';
        } elseif ($total >= 40) {
            $level = 'C';
        } else {
            $level = 'D';
        }

        $isKeyCustomer = $total >= 80 || $level === 'S';
        $isVip = $total >= 90 || $positionScore >= 90;

        RegistrationQualityScore::updateOrCreate(
            ['registration_id' => $this->id],
            [
                'event_id' => $this->event_id,
                'information_completeness' => $infoScore,
                'position_level_score' => $positionScore,
                'company_quality_score' => $companyScore,
                'industry_match_score' => $industryScore,
                'history_score' => $historyScore,
                'total_score' => $total,
                'quality_level' => $level,
                'score_remark' => "信息完整度:{$infoScore} + 职位级别:{$positionScore} + 公司质量:{$companyScore} + 行业匹配:{$industryScore} + 历史行为:{$historyScore}",
                'is_key_customer' => $isKeyCustomer,
                'is_vip' => $isVip,
            ]
        );
    }

    public function getConversionStageTextAttribute(): string
    {
        return static::CONVERSION_STAGES[$this->conversion_stage] ?? $this->conversion_stage;
    }

    public function getRegistrationStatusTextAttribute(): string
    {
        return static::REGISTRATION_STATUSES[$this->registration_status] ?? $this->registration_status;
    }

    public function getAttendanceStatusTextAttribute(): string
    {
        return static::ATTENDANCE_STATUSES[$this->attendance_status] ?? $this->attendance_status;
    }

    public function canApprove(): bool
    {
        return $this->registration_status === 'pending';
    }

    public function canCancel(): bool
    {
        return in_array($this->registration_status, ['pending', 'approved']);
    }

    public function canRefund(): bool
    {
        return $this->conversion_stage === 'paid' && $this->registration_status !== 'refunded';
    }
}
