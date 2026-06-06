require 'test_helper'

class DecoratorTest < ActiveSupport::TestCase
  setup do
    @admin = User.create!(name: 'Decorator Admin', email: 'decorator_admin@test.com', password: 'password123', role: :admin)
    @guide_user = User.create!(name: 'Decorator Guide', email: 'decorator_guide@test.com', password: 'password123', role: :guide)
    @student = Student.create!(
      name: '张三',
      age: 10,
      id_card_last_four: '1234',
      emergency_contact_phone: '13800138000',
      health_notes: '过敏体质'
    )
  end

  test 'student decorator masks sensitive fields for non-admin' do
    decorator = StudentDecorator.decorate(@student, context: { current_user: @guide_user })

    assert_not_equal '1234', decorator.id_card_last_four
    assert_not_equal '13800138000', decorator.emergency_contact_phone
    assert_not_equal '过敏体质', decorator.health_notes
  end

  test 'student decorator shows sensitive fields for admin' do
    decorator = StudentDecorator.decorate(@student, context: { current_user: @admin })

    assert_equal '1234', decorator.id_card_last_four
    assert_equal '13800138000', decorator.emergency_contact_phone
    assert_equal '过敏体质', decorator.health_notes
  end

  test 'student decorator shows masked display name for non-admin' do
    decorator = StudentDecorator.decorate(@student, context: { current_user: @guide_user })
    assert_equal '张同学', decorator.display_name
  end

  test 'student decorator shows full name for admin' do
    decorator = StudentDecorator.decorate(@student, context: { current_user: @admin })
    assert_equal '张三', decorator.display_name
  end

  test 'booking decorator masks contact info for non-admin' do
    booking = Booking.new(contact_phone: '13800138000', contact_email: 'test@test.com')
    decorator = BookingDecorator.decorate(booking, context: { current_user: @guide_user })

    assert_not_equal '13800138000', decorator.contact_phone
    assert_not_equal 'test@test.com', decorator.contact_email
  end
end
