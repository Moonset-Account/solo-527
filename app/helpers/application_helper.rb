module ApplicationHelper
  def waiting_list_status_tag(status)
    status_map = {
      "waiting"   => ["候补中", "tag-blue"],
      "notified"  => ["已通知", "tag-orange"],
      "confirmed" => ["已确认", "tag-green"],
      "converted" => ["已转化", "tag-green"],
      "cancelled" => ["已取消", "tag-red"],
      "expired"   => ["已过期", "tag-gray"]
    }
    text, css_class = status_map[status] || [status, "tag-gray"]
    content_tag(:span, text, class: "tag #{css_class}")
  end

  def appointment_status_tag(status)
    status_map = {
      "pending"   => ["待确认", "tag-orange"],
      "confirmed" => ["已确认", "tag-blue"],
      "completed" => ["已完成", "tag-green"],
      "cancelled" => ["已取消", "tag-gray"],
      "no_show"   => ["爽约", "tag-red"],
      "refunded"  => ["已退款", "tag-gray"]
    }
    text, css_class = status_map[status] || [status, "tag-gray"]
    content_tag(:span, text, class: "tag #{css_class}")
  end

  def time_slot_status_tag(status)
    status_map = {
      "available" => ["可预约", "tag-green"],
      "full"      => ["已满", "tag-orange"],
      "closed"    => ["已关闭", "tag-gray"],
      "cancelled" => ["已取消", "tag-red"]
    }
    text, css_class = status_map[status] || [status, "tag-gray"]
    content_tag(:span, text, class: "tag #{css_class}")
  end

  def refund_status_tag(status)
    status_map = {
      "pending"   => ["待处理", "tag-orange"],
      "processed" => ["已处理", "tag-green"],
      "failed"    => ["失败", "tag-red"],
      "cancelled" => ["已取消", "tag-gray"]
    }
    text, css_class = status_map[status] || [status, "tag-gray"]
    content_tag(:span, text, class: "tag #{css_class}")
  end

  def batch_status_tag(status)
    status_map = {
      "pending"    => ["待执行", "tag-orange"],
      "processing" => ["处理中", "tag-blue"],
      "completed"  => ["已完成", "tag-green"],
      "failed"     => ["失败", "tag-red"]
    }
    text, css_class = status_map[status] || [status, "tag-gray"]
    content_tag(:span, text, class: "tag #{css_class}")
  end

  def refund_method_tag(method)
    method_map = {
      "original"  => ["原路退回", "tag-blue"],
      "cash"      => ["现金", "tag-green"],
      "transfer"  => ["转账", "tag-orange"]
    }
    text, css_class = method_map[method] || [method, "tag-gray"]
    content_tag(:span, text, class: "tag #{css_class}")
  end

  def change_type_tag(type)
    type_map = {
      "created"          => ["加入", "tag-blue"],
      "join"             => ["加入", "tag-blue"],
      "position_changed" => ["位置变化", "tag-orange"],
      "position_change"  => ["位置变化", "tag-orange"],
      "status_changed"   => ["状态变化", "tag-green"],
      "status_change"    => ["状态变化", "tag-green"],
      "converted"        => ["转预约", "tag-green"],
      "convert"          => ["转预约", "tag-green"],
      "cancelled"        => ["取消", "tag-red"],
      "cancel"           => ["取消", "tag-red"],
      "expired"          => ["过期", "tag-gray"],
      "expire"           => ["过期", "tag-gray"],
      "notified"         => ["已通知", "tag-blue"],
      "notify"           => ["已通知", "tag-blue"]
    }
    text, css_class = type_map[type] || [type, "tag-gray"]
    content_tag(:span, text, class: "tag #{css_class}")
  end

  def notify_channel_tag(channel)
    channel_map = {
      "sms"   => ["短信", "tag-blue"],
      "wechat" => ["微信", "tag-green"],
      "phone" => ["电话", "tag-orange"],
      "app"   => ["APP推送", "tag-gray"]
    }
    text, css_class = channel_map[channel] || [channel, "tag-gray"]
    content_tag(:span, text, class: "tag #{css_class}")
  end

  def service_item_status_tag(status)
    status_map = {
      "pending"   => ["待服务", "tag-orange"],
      "completed" => ["已完成", "tag-green"],
      "cancelled" => ["已取消", "tag-gray"],
      "refunded"  => ["已退款", "tag-red"]
    }
    text, css_class = status_map[status] || [status, "tag-gray"]
    content_tag(:span, text, class: "tag #{css_class}")
  end
end
