module ApplicationHelper
  def format_version_value(field, value)
    return '-' if value.blank?
    
    case field.to_s
    when 'status'
      case value.to_s
      when 'pending' then '待审核'
      when 'approved' then '已通过'
      when 'rejected' then '已拒绝'
      when 'cancelled' then '已取消'
      when 'completed' then '已完成'
      else value
      end
    when 'registration_type'
      case value.to_s
      when 'school_group' then '学校团体'
      when 'individual' then '散客报名'
      else value
      end
    when 'gender'
      case value.to_s
      when 'male' then '男'
      when 'female' then '女'
      when 'other' then '其他'
      else value
      end
    when 'age_group'
      case value.to_s
      when 'preschool' then '学龄前'
      when 'primary_1_2' then '小学1-2年级'
      when 'primary_3_4' then '小学3-4年级'
      when 'primary_5_6' then '小学5-6年级'
      when 'junior_high' then '初中'
      when 'senior_high' then '高中'
      else value
      end
    when /_at$/
      value.is_a?(Time) ? value.strftime('%Y-%m-%d %H:%M') : value
    else
      value.to_s
    end
  end
end
