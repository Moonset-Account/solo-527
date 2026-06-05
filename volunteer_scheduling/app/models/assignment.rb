class Assignment < ApplicationRecord
  belongs_to :volunteer_profile
  belongs_to :location
  belongs_to :activity
  has_many :check_ins, dependent: :destroy
  has_many :assignment_changes, dependent: :destroy

  enum :status, { pending: 0, accepted: 1, declined: 2, swapped: 3, cancelled: 4 }

  validates :volunteer_profile_id, uniqueness: { scope: :activity_id, message: "已经报名该活动" }

  before_create :set_match_reason
  after_create :send_notification
  after_update :notify_status_change, if: :saved_change_to_status?

  def set_match_reason
    reasons = []
    skill_matches = location.required_skills & volunteer_profile.skills
    if skill_matches.any?
      reasons << "技能匹配: #{skill_matches.map(&:name).join(', ')}"
    end
    distance = volunteer_profile.distance_to(location)
    if distance < 5
      reasons << "距离较近: #{sprintf("%.1f", distance)}公里"
    end
    if volunteer_profile.available_at?(activity.start_time)
      reasons << "时段匹配"
    end
    self.match_reason = reasons.join("; ")
  end

  def send_notification
    Notification.create!(
      recipient: volunteer_profile.user,
      title: "新的活动排班",
      body: "您已被安排参加 #{activity.title} 活动，请确认是否参加。",
      notification_type: "assignment",
      notifiable: self
    )
  end

  def notify_status_change
    status_text = accepted? ? "已接受" : declined? ? "已拒绝" : status
    Notification.create!(
      recipient: activity.project_manager,
      title: "排班状态更新",
      body: "志愿者 #{volunteer_profile.user.name} #{status_text}了 #{activity.title} 的排班。",
      notification_type: "assignment_status",
      notifiable: self
    )
  end

  def swap!(new_volunteer, changed_by, change_reason)
    old_volunteer = volunteer_profile
    AssignmentChange.create!(
      assignment: self,
      changed_by: changed_by,
      old_volunteer_profile: old_volunteer,
      new_volunteer_profile: new_volunteer,
      original_match_reason: match_reason,
      change_reason: change_reason,
      changed_at: Time.current
    )
    update!(volunteer_profile: new_volunteer, status: :pending, match_reason: set_match_reason)
    send_notification
  end
end
