class ApplicationJob < ActiveJob::Base
  include Sidekiq::Status::Worker

  before_perform do |job|
    @batch_job = job.arguments.first.is_a?(Hash) ? nil : BatchJob.find_by(sidekiq_jid: job.job_id)
    @batch_job&.start!
  end

  after_perform do |job|
    @batch_job = BatchJob.find_by(sidekiq_jid: job.job_id)
    if @batch_job && !@batch_job.completed? && !@batch_job.failed?
      @batch_job.complete!
    end
  end

  rescue_from StandardError do |e|
    if @batch_job
      @batch_job.fail!(e.message)
    end
    raise e
  end

  private

  def track_success
    @batch_job&.increment_success!
  end

  def track_failure(error_message)
    @batch_job&.increment_failure!(error_message)
  end

  def set_total(count)
    @batch_job&.update!(total_count: count)
  end
end
