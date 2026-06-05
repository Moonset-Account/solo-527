class BookingValidator < ActiveModel::Validator
  def validate(record)
    validate_course_session(record)
    validate_duplicate_booking(record)
    validate_material_stock(record)
    validate_student_status(record)
  end

  private

  def validate_course_session(record)
    return unless record.course_session

    if record.course_session.cancelled?
      record.errors.add(:course_session, '该课程安排已取消')
    end

    if record.new_record? && record.course_session.start_time < Time.current
      record.errors.add(:course_session, '不能报名已开始或已结束的课程')
    end

    if record.new_record? && !record.course_session.has_available_slots?
      record.errors.add(:course_session, '该课程已满员')
    end
  end

  def validate_duplicate_booking(record)
    return unless record.student && record.course_session

    existing = Booking.where(
      student_id: record.student_id,
      course_session_id: record.course_session_id
    ).where.not(status: [:cancelled, :rejected])

    existing = existing.where.not(id: record.id) if record.persisted?

    if existing.exists?
      record.errors.add(:base, '您已报名该课程')
    end
  end

  def validate_material_stock(record)
    return unless record.material_package

    if record.new_record? && !record.material_package.can_sell?
      record.errors.add(:material_package, '材料包库存不足')
    end
  end

  def validate_student_status(record)
    return unless record.student

    unless record.student.user.active?
      record.errors.add(:student, '该账号已被禁用')
    end
  end
end
