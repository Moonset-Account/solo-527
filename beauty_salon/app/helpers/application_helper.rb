module ApplicationHelper
  def nav_link(text, path)
    link_to text, path, class: "block px-3 py-2 rounded text-sm #{current_page?(path) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}"
  end

  def status_badge(status)
    colors = {
      "active" => "bg-green-100 text-green-800",
      "pending" => "bg-yellow-100 text-yellow-800",
      "confirmed" => "bg-blue-100 text-blue-800",
      "completed" => "bg-green-100 text-green-800",
      "cancelled" => "bg-red-100 text-red-800",
      "expired" => "bg-gray-100 text-gray-600",
      "refunded" => "bg-purple-100 text-purple-800",
      "in_progress" => "bg-blue-100 text-blue-800",
      "no_show" => "bg-red-100 text-red-800",
      "used_up" => "bg-gray-100 text-gray-600"
    }
    color = colors[status.to_s] || "bg-gray-100 text-gray-600"
    tag.span status.to_s.humanize, class: "px-2 py-1 rounded-full text-xs font-medium #{color}"
  end
end
