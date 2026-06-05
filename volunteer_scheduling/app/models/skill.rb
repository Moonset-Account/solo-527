class Skill < ApplicationRecord
  has_many :volunteer_skills, dependent: :destroy
  has_many :volunteer_profiles, through: :volunteer_skills

  validates :name, presence: true, uniqueness: true

  CATEGORIES = %w[医疗 教育 环保 社区服务 技术 行政 其他].freeze
end
