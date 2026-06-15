if defined?(Sidekiq::Cron)
  cron_config = YAML.load_file(Rails.root.join("config", "sidekiq_cron.yml"), aliases: true)[Rails.env]
  Sidekiq::Cron::Job.load_from_hash(cron_config) if cron_config.present?
end
