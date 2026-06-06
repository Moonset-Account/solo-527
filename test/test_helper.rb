ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
require 'rails/test_help'
require 'minitest/autorun'

class ActiveSupport::TestCase
  fixtures :all

  def setup
    # Create test data using find_or_create_by to avoid duplicates
    @admin = User.find_or_create_by!(email: 'admin_test@test.com') do |u|
      u.name = 'Admin Test'
      u.password = 'password123'
      u.role = :admin
      u.status = :active
    end
    @education_teacher = User.find_or_create_by!(email: 'teacher_test@test.com') do |u|
      u.name = 'Teacher Test'
      u.password = 'password123'
      u.role = :education_teacher
      u.status = :active
    end
    @school = School.find_or_create_by!(name: 'Test School Unit') do |s|
      s.status = :active
    end
    @course = Course.find_or_create_by!(title: 'Test Course Unit') do |c|
      c.age_min = 6
      c.age_max = 12
      c.duration_minutes = 90
      c.max_participants = 30
      c.status = :published
      c.created_by = @admin
    end
    @guide = Guide.find_or_create_by!(employee_id: 'G001-TEST') do |g|
      g.name = 'Test Guide Unit'
      g.phone = '13900139000'
      g.status = :active
    end
  end
end
