class User < ApplicationRecord
  include DeviseTokenAuth::Concerns::User

  has_one :teacher, dependent: :destroy
  has_many :enrollments, foreign_key: :student_id, dependent: :destroy
  has_many :works, foreign_key: :student_id, dependent: :destroy
  has_many :reviews, foreign_key: :student_id, dependent: :destroy

  has_many :authorized_works, class_name: 'Work', foreign_key: :authorized_by
  has_many :approved_works, class_name: 'Work', foreign_key: :approved_by

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :role, presence: true, inclusion: { in: %w[super_admin admin teacher student] }

  def super_admin?
    role == 'super_admin'
  end

  def admin?
    %w[super_admin admin].include?(role)
  end

  def teacher?
    role == 'teacher'
  end

  def student?
    role == 'student'
  end
end
