class ExportService < ApplicationService
  def initialize(user = nil)
    super()
    @user = user
  end

  def export_bookings_to_excel(bookings)
    package = Axlsx::Package.new
    workbook = package.workbook

    workbook.add_worksheet(name: '报名列表') do |sheet|
      headers = ['报名编号', '报名类型', '课程名称', '场次时间', '学校', '联系人', '联系电话',
                 '学生人数', '老师人数', '状态', '创建时间', '签到进度']
      sheet.add_row headers, style: header_style(workbook)

      bookings.each do |booking|
        decorator = BookingDecorator.decorate(booking, context: { current_user: @user })
        row = [
          booking.id,
          decorator.booking_type_label,
          booking.course_session.course.title,
          booking.course_session.start_time.strftime('%Y-%m-%d %H:%M'),
          booking.school&.name || '-',
          decorator.contact_name,
          decorator.contact_phone,
          booking.student_count,
          booking.teacher_count || 0,
          decorator.status_badge,
          booking.created_at.strftime('%Y-%m-%d %H:%M'),
          "#{decorator.check_in_progress}%"
        ]
        sheet.add_row row
      end
    end

    workbook.add_worksheet(name: '学生名单') do |sheet|
      headers = ['报名编号', '学生姓名', '年龄', '学校', '年级', '签到状态', '签到时间']
      sheet.add_row headers, style: header_style(workbook)

      bookings.each do |booking|
        booking.booking_students.includes(:student).each do |bs|
          student = bs.student
          decorator = StudentDecorator.decorate(student, context: { current_user: @user })
          row = [
            booking.id,
            decorator.display_name,
            student.age,
            student.school&.name || '-',
            student.grade || '-',
            bs.attended? ? '已签到' : '未签到',
            bs.checked_in_at&.strftime('%Y-%m-%d %H:%M') || '-'
          ]
          sheet.add_row row
        end
      end
    end

    package.to_stream.read
  end

  def export_guide_schedule_to_excel(assignments)
    package = Axlsx::Package.new
    workbook = package.workbook

    workbook.add_worksheet(name: '讲解员排班') do |sheet|
      headers = ['讲解员', '日期', '开始时间', '结束时间', '课程名称', '地点', '角色', '状态']
      sheet.add_row headers, style: header_style(workbook)

      assignments.each do |assignment|
        guide = GuideDecorator.decorate(assignment.guide, context: { current_user: @user })
        row = [
          guide.name,
          assignment.course_session.start_time.strftime('%Y-%m-%d'),
          assignment.course_session.start_time.strftime('%H:%M'),
          assignment.course_session.end_time.strftime('%H:%M'),
          assignment.course_session.course.title,
          assignment.course_session.location || '-',
          assignment.role || '主讲',
          assignment.status
        ]
        sheet.add_row row
      end
    end

    package.to_stream.read
  end

  def export_students_to_excel(students)
    package = Axlsx::Package.new
    workbook = package.workbook

    workbook.add_worksheet(name: '学生名单') do |sheet|
      headers = ['学生编号', '姓名', '年龄', '学校', '年级', '身份证后4位', '紧急联系人', '联系电话', '健康备注']
      sheet.add_row headers, style: header_style(workbook)

      students.each do |student|
        decorator = StudentDecorator.decorate(student, context: { current_user: @user })
        row = [
          student.id,
          decorator.display_name,
          student.age,
          student.school&.name || '-',
          student.grade || '-',
          decorator.id_card_last_four,
          decorator.emergency_contact_name,
          decorator.emergency_contact_phone,
          decorator.health_notes
        ]
        sheet.add_row row
      end
    end

    package.to_stream.read
  end

  private

  def header_style(workbook)
    workbook.styles.add_style(
      bg_color: '0066cc',
      fg_color: 'ffffff',
      alignment: { horizontal: :center },
      b: true
    )
  end
end
