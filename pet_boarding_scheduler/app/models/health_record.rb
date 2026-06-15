class HealthRecord < ApplicationRecord
  belongs_to :pet
  belongs_to :caretaker, optional: true

  delegate :name, to: :pet, prefix: true
  delegate :name, to: :caretaker, prefix: true, allow_nil: true

  validates :recorded_at, presence: true
  validates :pet_id, presence: true

  scope :recent, ->(days = 7) { where("recorded_at >= ?", days.days.ago) }
  scope :by_pet, ->(pet_id) { where(pet_id:) }
  scope :by_date, ->(date) { where("DATE(recorded_at) = ?", date) }

  def self.ransackable_attributes(auth_object = nil)
    super + %w[id pet_id caretaker_id recorded_at symptoms appetite_level activity_level temperature weight notes created_at updated_at symptoms_present]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[pet caretaker]
  end

  ransacker :symptoms_present do
    Arel.sql("CASE WHEN symptoms IS NOT NULL AND symptoms != '' THEN 1 ELSE 0 END")
  end

  def appetite_display
    return nil unless appetite_level

    levels = { 1 => "很差", 2 => "较差", 3 => "一般", 4 => "良好", 5 => "很好" }
    levels[appetite_level] || appetite_level.to_s
  end

  def activity_display
    return nil unless activity_level

    levels = { 1 => "很低", 2 => "较低", 3 => "一般", 4 => "活跃", 5 => "很活跃" }
    levels[activity_level] || activity_level.to_s
  end

  def health_status
    score = 0
    score += appetite_level if appetite_level
    score += activity_level if activity_level
    score /= 2.0 if score > 0

    if score >= 4
      "良好"
    elsif score >= 3
      "一般"
    elsif score >= 2
      "较差"
    else
      "需关注"
    end
  end

  def previous_record
    pet.health_records.where("recorded_at < ?", recorded_at).order(recorded_at: :desc).first
  end

  def weight_change
    prev = previous_record
    return nil unless prev&.weight && weight

    weight - prev.weight
  end
end
