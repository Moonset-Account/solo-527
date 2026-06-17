module ApiResilience
  extend ActiveSupport::Concern

  class_methods do
    def safe_api_call(endpoint:, method: "GET", body: nil, max_retries: 3, &block)
      failure_log = ApiFailureLog.create!(
        endpoint: endpoint,
        method: method,
        request_body: body,
        max_retries: max_retries,
        status: :pending
      )

      response = yield
      if response.is_a?(Net::HTTPResponse) && response.code.to_i.between?(200, 299)
        failure_log.resolve!
        response
      else
        failure_log.update!(response_code: response&.code&.to_i, response_body: response&.body&.truncate(1000))
        failure_log.retry!
        nil
      end
    rescue StandardError => e
      failure_log.update!(response_body: e.message&.truncate(1000))
      failure_log.retry!
      nil
    end
  end
end
