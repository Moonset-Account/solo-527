class ArtworkValidator < ActiveModel::Validator
  def validate(record)
    validate_images(record)
    validate_publication_requirements(record)
    validate_course_session(record)
  end

  private

  def validate_images(record)
    if record.image_urls.blank? && record.thumbnail_url.blank?
      record.errors.add(:base, '请至少上传一张作品图片')
    end

    if record.image_urls.is_a?(Array) && record.image_urls.length > 9
      record.errors.add(:image_urls, '最多上传9张图片')
    end
  end

  def validate_publication_requirements(record)
    if record.is_public? && record.title.blank?
      record.errors.add(:title, '公开展示的作品必须填写标题')
    end

    if record.is_public? && record.description.blank?
      record.errors.add(:description, '公开展示的作品必须填写描述')
    end
  end

  def validate_course_session(record)
    return unless record.course_session_id.present?
    return unless record.student

    unless Booking.exists?(
      student_id: record.student_id,
      course_session_id: record.course_session_id,
      attendance_status: :checked_in
    )
      record.errors.add(:course_session, '您未参加该课程，无法关联')
    end
  end
end
