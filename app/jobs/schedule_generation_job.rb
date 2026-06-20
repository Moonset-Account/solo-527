class ScheduleGenerationJob < ApplicationJob
  queue_as :default

  def perform(event_id, options = {})
    event = Event.find(event_id)
    @batch_job = BatchJob.find_by(sidekiq_jid: job_id)

    registrations = event.event_registrations.confirmed.to_a
    total = registrations.size
    set_total(total)

    schedules = []
    round = 1
    registrations.each_slice(options[:per_schedule] || 8) do |group|
      schedule = event.schedules.create!(
        title: "#{event.name} - 第#{round}轮",
        category: options[:category],
        round: round,
        start_time: event.start_date + (round - 1).hours,
        status: "scheduled",
        max_participants: group.size
      )
      schedules << schedule
      track_success
      round += 1
    end

    @batch_job&.update!(result_data: { schedule_count: schedules.size, schedule_ids: schedules.map(&:id) })
    event.update!(status: "in_progress") if schedules.any?
  end
end
