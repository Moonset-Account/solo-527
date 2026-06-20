module ApplicationHelper
  def nav_link_class(path)
    base = "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors"
    if current_page?(path)
      "#{base} bg-indigo-50 text-indigo-700"
    else
      "#{base} text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    end
  end

  def status_badge(status)
    colors = {
      'pending' => 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in_progress' => 'bg-blue-100 text-blue-800 border-blue-200',
      'completed' => 'bg-green-100 text-green-800 border-green-200',
      'exception' => 'bg-red-100 text-red-800 border-red-200'
    }
    names = {
      'pending' => '待办',
      'in_progress' => '处理中',
      'completed' => '已完成',
      'exception' => '异常'
    }
    content_tag(:span, class: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border #{colors[status.to_s]}") do
      names[status.to_s] || status.to_s.humanize
    end
  end

  def priority_badge(priority)
    colors = {
      'low' => 'bg-gray-100 text-gray-800',
      'normal' => 'bg-blue-100 text-blue-800',
      'high' => 'bg-orange-100 text-orange-800',
      'urgent' => 'bg-red-100 text-red-800'
    }
    names = {
      'low' => '低',
      'normal' => '中',
      'high' => '高',
      'urgent' => '紧急'
    }
    content_tag(:span, class: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium #{colors[priority.to_s]}") do
      names[priority.to_s] || priority.to_s.humanize
    end
  end

  def format_datetime(datetime)
    return '-' unless datetime.present?
    datetime.in_time_zone.strftime("%Y-%m-%d %H:%M")
  end

  def format_date(date)
    return '-' unless date.present?
    date.in_time_zone.strftime("%Y-%m-%d")
  end

  def diff_class(old_val, new_val)
    if old_val == new_val
      'text-gray-600'
    else
      'text-red-600 bg-red-50'
    end
  end

  def new_value_class(old_val, new_val)
    if old_val == new_val
      'text-gray-600'
    else
      'text-green-600 bg-green-50'
    end
  end
end
