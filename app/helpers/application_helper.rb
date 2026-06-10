module ApplicationHelper
  def nav_link(text, path)
    active = request.path.start_with?(path)
    classes = active ? "block px-4 py-2.5 rounded-lg bg-[#6C3CE1]/20 text-[#6C3CE1] font-medium" : "block px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200"
    link_to text, path, class: classes
  end

  def status_badge(status)
    colors = {
      "pending" => "bg-yellow-900/50 text-yellow-300",
      "approved" => "bg-green-900/50 text-green-300",
      "rejected" => "bg-red-900/50 text-red-300",
      "paid" => "bg-green-900/50 text-green-300",
      "issued" => "bg-blue-900/50 text-blue-300",
      "used" => "bg-blue-900/50 text-blue-300",
      "refunded" => "bg-gray-700 text-gray-300",
      "cancelled" => "bg-gray-700 text-gray-300",
      "open" => "bg-red-900/50 text-red-300",
      "closed" => "bg-gray-700 text-gray-300",
      "active" => "bg-green-900/50 text-green-300",
      "inactive" => "bg-gray-700 text-gray-300"
    }
    content_tag :span, status, class: "px-2.5 py-1 rounded-full text-xs font-medium #{colors[status] || 'bg-gray-700 text-gray-300'}"
  end

  def format_currency(amount)
    "¥#{'%.2f' % amount}"
  end
end
