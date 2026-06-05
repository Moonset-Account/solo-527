class CheckIn < ApplicationRecord
  belongs_to :assignment
  has_many :check_in_reviews, dependent: :destroy
  has_many :admin_confirmations, as: :confirmable, dependent: :destroy

  enum :status, { pending: 0, checked_in: 1, checked_out: 2, approved: 3, rejected: 4, needs_review: 5 }

  LATE_THRESHOLD_MINUTES = 15
  PROXIMITY_THRESHOLD_METERS = 200

  before_create :detect_anomalies
  after_save :update_volunteer_hours, if: -> { saved_change_to_status? && approved? }

  def self.check_in(assignment, method = "qr_code", latitude = nil, longitude = nil)
    check_in = new(
      assignment: assignment,
      checked_in_at: Time.current,
      check_in_method: method,
      check_in_latitude: latitude,
      check_in_longitude: longitude,
      status: :checked_in
    )
    check_in.detect_anomalies
    check_in.save!
    check_in
  end

  def check_out!
    self.checked_out_at = Time.current
    calculate_service_hours
    self.status = if needs_review?
                    :needs_review
                  else
                    :checked_out
                  end
    save!
  end

  def calculate_service_hours
    return unless checked_in_at && checked_out_at
    hours = (checked_out_at - checked_in_at) / 3600.0
    self.service_hours = [hours, 0].max.round(2)
  end

  def detect_anomalies
    detect_late
    detect_proximity_issue
    self.needs_review = is_late? || is_early_leave? || is_proxy_suspected?
    self.review_reason = generate_review_reason if needs_review?
  end

  def detect_late
    return unless assignment&.activity&.start_time
    scheduled_start = assignment.activity.start_time
    if checked_in_at && checked_in_at > scheduled_start + LATE_THRESHOLD_MINUTES.minutes
      self.is_late = true
    end
  end

  def detect_proximity_issue
    return unless check_in_latitude && check_in_longitude
    return unless assignment&.location&.latitude && assignment&.location&.longitude
    begin
      distance = Geocoder::Calculations.distance_between(
        [check_in_latitude.to_f, check_in_longitude.to_f],
        [assignment.location.latitude.to_f, assignment.location.longitude.to_f],
        units: :m
      )
      if distance > PROXIMITY_THRESHOLD_METERS
        self.is_proxy_suspected = true
      end
    rescue
      # 如果计算失败，不设置疑似代签
    end
  end

  def is_proxy_suspected?
    check_in_method == "manual" || is_late?
  end

  def generate_review_reason
    reasons = []
    reasons << "迟到 #{((checked_in_at - assignment.activity.start_time) / 60).to_i} 分钟" if is_late?
    reasons << "疑似代签" if is_proxy_suspected?
    reasons << "早退" if is_early_leave?
    reasons.join("; ")
  end

  def update_volunteer_hours
    vp = assignment.volunteer_profile
    vp.update!(total_service_hours: vp.total_service_hours + service_hours)
  end

  def requires_two_admins?
    check_in_method == "manual" || needs_review?
  end

  def approved_by_two_admins?
    admin_confirmations.count >= 2
  end

  def approve_by_admin!(admin, notes = nil)
    if admin_confirmations.exists?(admin: admin)
      raise "您已经确认过此签到，需要两名不同的管理员确认"
    end

    AdminConfirmation.create!(
      confirmable: self,
      admin: admin,
      confirmation_notes: notes,
      confirmed_at: Time.current
    )
    if approved_by_two_admins? || !requires_two_admins?
      update!(status: :approved)
      Notification.create!(
        recipient: assignment.volunteer_profile.user,
        title: "签到已审核通过",
        body: "您在 #{assignment.activity.title} 的签到已审核通过，服务时长 #{service_hours} 小时已计入。",
        notification_type: "check_in_approved",
        notifiable: self
      )
    end
  end

  def reject_by_admin!(admin, reason)
    update!(status: :rejected)
    CheckInReview.create!(
      check_in: self,
      reviewer: admin,
      decision: :rejected,
      review_notes: reason,
      reviewed_at: Time.current
    )
    Notification.create!(
      recipient: assignment.volunteer_profile.user,
      title: "签到审核未通过",
      body: "您在 #{assignment.activity.title} 的签到未通过审核，原因：#{reason}",
      notification_type: "check_in_rejected",
      notifiable: self
    )
  end
end
