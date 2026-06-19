module ApplicationHelper
  STATUS_COLOR_MAP = {
    'open' => 'green', 'active' => 'green', 'enrolled' => 'green', 'planned' => 'green', 'pending' => 'green', 'draft' => 'green',
    'closed' => 'blue', 'checked_in' => 'blue', 'in_progress' => 'blue', 'received' => 'blue',
    'completed' => 'gray', 'confirmed' => 'gray', 'sent' => 'gray',
    'overdue' => 'red', 'absent' => 'red', 'rejected' => 'red',
    'cancelled' => 'yellow', 'paused' => 'yellow', 'dismissed' => 'yellow'
  }.freeze

  STATUS_LABEL_MAP = {
    'open' => '开放中', 'active' => '进行中', 'enrolled' => '已报名', 'planned' => '已计划', 'pending' => '待处理', 'draft' => '草稿',
    'closed' => '已关闭', 'checked_in' => '已签到', 'in_progress' => '进行中', 'received' => '已接收',
    'completed' => '已完成', 'confirmed' => '已确认', 'sent' => '已发送',
    'overdue' => '已逾期', 'absent' => '缺勤', 'rejected' => '已拒绝',
    'cancelled' => '已取消', 'paused' => '已暂停', 'dismissed' => '已忽略'
  }.freeze

  def status_badge(status, color_map = {})
    color = color_map[status] || STATUS_COLOR_MAP[status] || 'gray'
    label = STATUS_LABEL_MAP[status] || status
    bg_class = case color
               when 'green' then 'bg-green-100 text-green-800'
               when 'blue' then 'bg-blue-100 text-blue-800'
               when 'red' then 'bg-red-100 text-red-800'
               when 'yellow' then 'bg-yellow-100 text-yellow-800'
               else 'bg-gray-100 text-gray-800'
               end
    tag.span(label, class: "px-2 py-1 text-xs font-medium rounded-full #{bg_class}")
  end

  def format_datetime(dt)
    return '-' unless dt
    dt.strftime('%Y-%m-%d %H:%M')
  end

  def next_action_for(record)
    case record
    when Shift
      case record.status
      when 'open' then '可报名'
      when 'closed' then '可签到'
      when 'completed' then '已完成'
      else record.status
      end
    when ShiftEnrollment
      case record.status
      when 'enrolled' then '待签到'
      when 'checked_in' then '已签到'
      when 'absent' then '缺勤'
      when 'cancelled' then '已取消'
      else record.status
      end
    when Donation
      case record.status
      when 'pending' then '待接收'
      when 'received' then '待确认'
      when 'confirmed' then '已完成'
      when 'rejected' then '已拒绝'
      else record.status
      end
    when VisitRecord
      case record.status
      when 'planned' then '待开始'
      when 'in_progress' then '待完成'
      when 'completed' then '已完成'
      when 'overdue' then '需复盘'
      when 'cancelled' then '已取消'
      else record.status
      end
    when VolunteerService
      case record.status
      when 'draft' then '待激活'
      when 'active' then '进行中'
      when 'paused' then '已暂停'
      when 'completed' then '已完成'
      else record.status
      end
    when TrackingReminder
      case record.status
      when 'pending' then '待发送'
      when 'sent' then '已发送'
      when 'dismissed' then '已忽略'
      else record.status
      end
    else record.status
    end
  end
end
