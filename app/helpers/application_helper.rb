module ApplicationHelper
  def status_label(status, type = :default)
    status = status.to_s
    css_class = case status
                when 'active', 'approved', 'paid', 'resolved'
                  'bg-green-100 text-green-800'
                when 'pending', 'draft'
                  'bg-yellow-100 text-yellow-800'
                when 'processing', 'maintenance'
                  'bg-blue-100 text-blue-800'
                when 'rejected', 'cancelled', 'inactive'
                  'bg-red-100 text-red-800'
                else
                  'bg-gray-100 text-gray-800'
                end

    content_tag :span, class: "px-2 py-1 rounded-full text-xs font-medium #{css_class}" do
      status_text(status, type)
    end
  end

  def temperature_status_class(temperature, vehicle)
    return 'text-gray-500' unless temperature && vehicle&.min_temperature && vehicle&.max_temperature

    if temperature < vehicle.min_temperature || temperature > vehicle.max_temperature
      'text-red-600 font-bold'
    elsif temperature < vehicle.min_temperature + 2 || temperature > vehicle.max_temperature - 2
      'text-yellow-600'
    else
      'text-green-600'
    end
  end

  def format_datetime(datetime)
    return '-' unless datetime

    datetime.strftime('%Y-%m-%d %H:%M:%S')
  end

  def format_money(amount)
    return '-' if amount.nil?

    formatted = sprintf('%.2f', amount.to_f)
    "¥#{formatted}"
  end

  def format_duration(seconds)
    return '-' if seconds.nil? || seconds <= 0

    days = seconds / 86_400
    hours = (seconds % 86_400) / 3600
    minutes = (seconds % 3600) / 60
    secs = seconds % 60

    parts = []
    parts << "#{days}天" if days > 0
    parts << "#{hours}小时" if hours > 0 || days > 0
    parts << "#{minutes}分" if minutes > 0 || hours > 0 || days > 0
    parts << "#{secs}秒" if parts.empty?

    parts.join
  end

  private

  def status_text(status, type)
    status_map = {
      claim: {
        'pending' => '待处理',
        'processing' => '处理中',
        'approved' => '已通过',
        'rejected' => '已拒绝',
        'paid' => '已赔付'
      },
      settlement: {
        'draft' => '草稿',
        'pending' => '待审核',
        'approved' => '已通过',
        'paid' => '已支付',
        'cancelled' => '已取消'
      },
      vehicle: {
        'active' => '正常',
        'maintenance' => '维护中',
        'inactive' => '停用'
      },
      user: {
        'active' => '正常',
        'inactive' => '停用'
      },
      alert: {
        'active' => '告警中',
        'resolved' => '已处理'
      }
    }

    if type && status_map[type.to_sym]
      status_map[type.to_sym][status] || status.humanize
    else
      status.humanize
    end
  end
end
