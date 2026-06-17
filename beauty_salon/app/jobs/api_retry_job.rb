require "net/http"
require "uri"

class ApiRetryJob < ApplicationJob
  queue_as :api_retries

  def perform(api_failure_log)
    api_failure_log.update!(status: :retrying, retried: true)

    response = send_request(api_failure_log)
    status_code = response&.code&.to_i

    if status_code && status_code.between?(200, 299)
      api_failure_log.update!(
        response_code: status_code,
        response_body: response.body[0..1000],
        status: :resolved
      )
    else
      api_failure_log.update!(
        response_code: status_code,
        response_body: response&.body&.truncate(1000),
        retry_count: api_failure_log.retry_count + 1
      )
      handle_failure(api_failure_log)
    end
  rescue StandardError => e
    api_failure_log.add_note!("重试失败: #{e.message}")
    api_failure_log.update!(
      response_body: e.message.truncate(1000),
      retry_count: api_failure_log.retry_count + 1
    )
    handle_failure(api_failure_log)
  end

  private

  def send_request(log)
    uri = URI.parse(log.endpoint)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.read_timeout = 30
    http.open_timeout = 30
    request = build_request(log, uri)
    http.request(request)
  end

  def build_request(log, uri)
    method = log.method.upcase
    path = uri.path.presence || "/"
    path += "?#{uri.query}" if uri.query.present?

    klass = case method
            when "POST" then Net::HTTP::Post
            when "PUT" then Net::HTTP::Put
            when "PATCH" then Net::HTTP::Patch
            when "DELETE" then Net::HTTP::Delete
            else Net::HTTP::Get
            end

    req = klass.new(path, "Content-Type" => "application/json")
    if method != "GET" && log.request_body.present?
      req.body = log.request_body
    end
    req
  end

  def handle_failure(log)
    if log.retry_count < log.max_retries
      ApiRetryJob.set(wait: 30.seconds).perform_later(log)
    else
      log.update!(status: :failed)
      notification = Notification.create!(
        recipient_type: "System",
        recipient_id: 0,
        title: "API 重试失败",
        body: "接口 #{log.endpoint} 重试 #{log.max_retries} 次后仍然失败，请人工处理",
        category: "api_failure",
        urgent: true
      )
      TodoItem.create!(
        assignee_type: "System",
        assignee_id: 0,
        source: notification,
        title: "API 重试失败 - 需人工处理",
        body: "接口 #{log.endpoint} 重试 #{log.max_retries} 次后仍然失败，状态码: #{log.response_code || 'N/A'}",
        category: "api_failure",
        status: :pending,
        due_at: 24.hours.from_now
      )
    end
  end
end
