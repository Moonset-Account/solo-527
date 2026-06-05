class Activity < ApplicationRecord
  belongs_to :project_manager, class_name: "User"
  has_many :locations, dependent: :destroy
  has_many :assignments, dependent: :destroy
  has_many :check_ins, through: :assignments

  enum :status, { draft: 0, published: 1, in_progress: 2, completed: 3, cancelled: 4 }

  validates :title, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validate :end_time_after_start_time

  def end_time_after_start_time
    return unless start_time && end_time
    if end_time <= start_time
      errors.add(:end_time, "必须晚于开始时间")
    end
  end

  def recommended_volunteers
    VolunteerProfile.all.select do |vp|
      vp.available_at?(start_time)
    end.sort_by do |vp|
      skill_match_score = locations.first.required_skills.sum { |skill| vp.has_skill?(skill.id) ? 1 : 0 }
      distance_score = -vp.distance_to(locations.first)
      [skill_match_score, distance_score]
    end.reverse
  end

  def total_volunteers_needed
    locations.sum(:volunteers_needed)
  end

  def assigned_volunteers_count
    assignments.accepted.count
  end
end
