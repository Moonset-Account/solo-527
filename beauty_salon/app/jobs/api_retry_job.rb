class ApiRetryJob < ApplicationJob
  queue_as :api_retries
  retry_on StandardError, wait: 30.seconds, attempts: 3

  def perform(api_failure_log)
    response = send_request(api_failure_log)
    if response&.status&.between?(200, 299)
      api_failure_log.resolve!
    else
      handle_failure(api_failure_log)
    end
  rescue StandardError => e
    api_failure_log.add_note!("重试失败: #{e.message}")
    handle_failure(api_failure_log)
  end

  private

  def send_request(log)
    uri = URI.parse(log.endpoint)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    request = build_request(log, uri)
    http.request(request)
  end

  def build_request(log, uri)
    klass = case log.method.upcase
            when "POST" then Net::HTTP::Post
            when "PUT" then Net::HTTP::Put
            when "PATCH" then Net::HTTP::Patch
            when "DELETE" then Net::HTTP::Delete
            else Net::HTTP::Get
            end
    req = klass.new(uri.path, "Content-Type" => "application/json")
    req.body = log.request_body if log.request_body.present? && log.method.upcase != "GET"
    req
  end

  def handle_failure(log)
    if log.can_retry?
      ApiRetryJob.set(wait: 30.seconds).perform_later(log)
    else
      log.fail_permanently!
      Notification.create!(
        recipient_type: "System",
        recipient_id: 0,
        title: "API 重试失败",
        body: "接口 #{log.endpoint} 重试 #{log.retry_count} 次后仍然失败",
        category: "api_failure",
        urgent: true
      )
      TodoItem.create!(
        assignee_type: "System",
        assignee_id: 0,
        title: "API 重试失败 - 需人工处理",
        body: "接口 #{log.endpoint} 重试 #{log.retry_count} 次后仍然失败，请手动处理",
        category: "api_failure",
        status: :pending
      )
    end
  end
end
