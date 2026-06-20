class BulkCheckInJob < ApplicationJob
  queue_as :default

  def perform(check_in_params_list, operator_id = nil)
    @batch_job = BatchJob.find_by(sidekiq_jid: job_id)

    total = check_in_params_list.size
    set_total(total)

    success_count = 0
    failures = []

    check_in_params_list.each do |params|
      begin
        check_in = CheckIn.create!(params)
        check_in.check_in!("bulk", operator_id ? User.find(operator_id) : nil)
        track_success
        success_count += 1
      rescue => e
        track_failure("User ##{params[:user_id]}: #{e.message}")
        failures << { params: params, error: e.message }
      end
    end

    @batch_job&.update!(
      result_data: {
        success_count: success_count,
        failure_count: failures.size,
        failures: failures
      }
    )
  end
end
