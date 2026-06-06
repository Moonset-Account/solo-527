require 'test_helper'

class StudentTest < ActiveSupport::TestCase
  test 'should not allow age below minimum' do
    student = Student.new(name: 'Test', age: 2)
    assert_not student.valid?
    assert_includes student.errors[:age], 'must be greater than or equal to 3'
  end

  test 'should not allow age above maximum' do
    student = Student.new(name: 'Test', age: 19)
    assert_not student.valid?
    assert_includes student.errors[:age], 'must be less than or equal to 18'
  end

  test 'should validate id_card_last_four format' do
    student = Student.new(name: 'Test', age: 10, id_card_last_four: '123')
    assert_not student.valid?
    assert_includes student.errors[:id_card_last_four], 'must be 4 digits'
  end

  test 'should allow valid id_card_last_four' do
    student = Student.new(name: 'Test', age: 10, id_card_last_four: '1234')
    student.valid?
    assert_not_includes student.errors[:id_card_last_four], 'must be 4 digits'
  end

  test 'should validate minimal data collection - only last 4 digits' do
    student = Student.new(name: 'Test', age: 10)
    assert student.valid?

    student.id_card_last_four = '123456789012345678'
    assert_not student.valid?
    assert student.errors[:id_card_last_four].any?
  end

  test 'should allow blank id_card_last_four' do
    student = Student.new(name: 'Test', age: 10, id_card_last_four: '')
    assert student.valid?
  end

  test 'should validate emergency contact phone format' do
    student = Student.new(name: 'Test', age: 10, emergency_contact_phone: '123')
    assert_not student.valid?
    assert_includes student.errors[:emergency_contact_phone], 'must be a valid phone number'
  end

  test 'should allow valid emergency contact phone' do
    student = Student.new(name: 'Test', age: 10, emergency_contact_phone: '13800138000')
    student.valid?
    assert_not_includes student.errors[:emergency_contact_phone], 'must be a valid phone number'
  end

  test 'should allow blank emergency contact phone' do
    student = Student.new(name: 'Test', age: 10)
    assert student.valid?
  end

  test 'allowed fields should be minimal' do
    assert_equal %w[name age grade school_id id_card_last_four emergency_contact_name emergency_contact_phone health_notes],
                 Student::ALLOWED_FIELDS
  end
end
