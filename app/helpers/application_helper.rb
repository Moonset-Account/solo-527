module ApplicationHelper
  def status_class(status)
    case status.to_s
    when "active", "confirmed", "paid", "checked_in", "completed", "approved", "open", "in_progress", "scheduled"
      "bg-green-100 text-green-800"
    when "pending", "draft"
      "bg-yellow-100 text-yellow-800"
    when "cancelled", "failed", "rejected", "no_show", "disqualified"
      "bg-red-100 text-red-800"
    when "refunded"
      "bg-gray-100 text-gray-800"
    when "full"
      "bg-orange-100 text-orange-800"
    else
      "bg-gray-100 text-gray-800"
    end
  end

  def progress_color_class(status)
    case status.to_s
    when "completed"
      "bg-green-500"
    when "running"
      "bg-blue-500"
    when "failed"
      "bg-red-500"
    when "cancelled"
      "bg-gray-500"
    else
      "bg-yellow-500"
    end
  end

  def status_text(status)
    status_map = {
      "active" => "进行中",
      "completed" => "已完成",
      "cancelled" => "已取消",
      "pending" => "待处理",
      "confirmed" => "已确认",
      "paid" => "已支付",
      "unpaid" => "未支付",
      "failed" => "失败",
      "approved" => "已批准",
      "rejected" => "已拒绝",
      "checked_in" => "已签到",
      "no_show" => "未到场",
      "scheduled" => "已排期",
      "in_progress" => "进行中",
      "draft" => "草稿",
      "open" => "报名中",
      "closed" => "已截止",
      "disqualified" => "取消资格",
      "refunded" => "已退款",
      "full" => "已满员",
      "running" => "进行中"
    }
    status_map[status.to_s] || status.to_s
  end

  def paper_trail_change_text(version)
    return "" unless version.object_changes.present?

    changes = YAML.safe_load(version.object_changes)
    change_text = []

    changes.each do |field, values|
      next if %w[updated_at created_at].include?(field)
      old_val, new_val = values
      change_text << "#{field.humanize}: #{old_val.inspect} → #{new_val.inspect}"
    end

    change_text.join(", ")
  rescue
    ""
  end

  def source_text(source)
    source_map = {
      "web" => "网站前台",
      "admin" => "管理后台",
      "api" => "API接口",
      "import" => "批量导入"
    }
    source_map[source.to_s] || source.to_s
  end
end
