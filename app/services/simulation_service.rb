class SimulationService
  BEIJING_LAT_MIN = 39.7
  BEIJING_LAT_MAX = 40.2
  BEIJING_LNG_MIN = 116.2
  BEIJING_LNG_MAX = 116.7

  def self.generate_temperature_records(vehicle, days = 7)
    return unless vehicle.min_temperature && vehicle.max_temperature

    min_temp = vehicle.min_temperature.to_f
    max_temp = vehicle.max_temperature.to_f
    mid_temp = (min_temp + max_temp) / 2
    range = max_temp - min_temp

    records = []
    current_time = days.days.ago.beginning_of_day

    while current_time <= Time.current
      temp = mid_temp + (rand - 0.5) * range * 0.6

      if rand < 0.05
        if rand < 0.5
          temp = max_temp + rand * 3
        else
          temp = min_temp - rand * 3
        end
      end

      temp = temp.round(1)

      records << {
        vehicle_id: vehicle.id,
        temperature: temp,
        recorded_at: current_time,
        created_at: current_time,
        updated_at: current_time
      }

      current_time += 30.minutes
    end

    TemperatureRecord.insert_all(records) if records.any?

    if records.any?
      latest = records.last
      vehicle.update!(
        last_temperature: latest[:temperature],
        last_temperature_at: latest[:recorded_at]
      )
    end

    records.size
  end

  def self.generate_location_records(vehicle, days = 7)
    records = []
    current_time = days.days.ago.beginning_of_day

    lat = BEIJING_LAT_MIN + rand * (BEIJING_LAT_MAX - BEIJING_LAT_MIN)
    lng = BEIJING_LNG_MIN + rand * (BEIJING_LNG_MAX - BEIJING_LNG_MIN)

    while current_time <= Time.current
      lat_change = (rand - 0.5) * 0.02
      lng_change = (rand - 0.5) * 0.02

      lat += lat_change
      lng += lng_change

      lat = [[lat, BEIJING_LAT_MIN].max, BEIJING_LAT_MAX].min
      lng = [[lng, BEIJING_LNG_MIN].max, BEIJING_LNG_MAX].min

      speed = rand(0..80).round(1)
      heading = rand(0..360).round(1)

      records << {
        vehicle_id: vehicle.id,
        latitude: lat.round(6),
        longitude: lng.round(6),
        speed: speed,
        heading: heading,
        recorded_at: current_time,
        created_at: current_time,
        updated_at: current_time
      }

      current_time += 1.hour
    end

    LocationRecord.insert_all(records) if records.any?

    if records.any?
      latest = records.last
      vehicle.update!(
        last_location_lat: latest[:latitude],
        last_location_lng: latest[:longitude],
        last_location_at: latest[:recorded_at]
      )
    end

    records.size
  end

  def self.generate_random_claim
    claim_types = [:temperature, :delay, :damage, :other]
    statuses = [:pending, :processing, :approved, :rejected]
    descriptions = [
      '运输途中温度异常导致部分货物变质',
      '车辆故障导致配送延迟',
      '货物包装破损造成损失',
      '客户投诉要求赔付',
      '交通事故导致货物损坏',
      '冷机故障温度失控',
      '装卸货时间过长温度回升'
    ]

    {
      claim_type: claim_types.sample,
      status: statuses.sample,
      amount: (rand(100..5000) + rand).round(2),
      description: descriptions.sample
    }
  end

  def self.generate_temperature_alerts(vehicle, days = 7)
    alerts = []
    current_time = days.days.ago.beginning_of_day

    return [] unless vehicle.min_temperature && vehicle.max_temperature

    while current_time <= Time.current
      if rand < 0.03
        alert_type = rand < 0.5 ? :over_high : :over_low
        is_resolved = rand < 0.7

        start_time = current_time
        duration = rand(30..180).minutes
        end_time = is_resolved ? start_time + duration : nil

        temperature = if alert_type == :over_high
                        vehicle.max_temperature + rand(0.5..3.0)
                      else
                        vehicle.min_temperature - rand(0.5..3.0)
                      end

        threshold = alert_type == :over_high ? vehicle.max_temperature : vehicle.min_temperature

        resolution_notes = [
          '已通知司机检查冷机设备',
          '已安排维修人员上门检修',
          '温度已恢复正常范围',
          '已调整制冷参数',
          '货物已转移至备用车辆'
        ]

        alert = {
          vehicle_id: vehicle.id,
          alert_type: alert_type,
          temperature: temperature.round(1),
          threshold: threshold,
          start_time: start_time,
          end_time: end_time,
          duration_seconds: end_time ? (end_time - start_time).to_i : nil,
          status: is_resolved ? 'resolved' : 'active',
          resolved_by_id: is_resolved ? User.where(role: ['admin', 'captain']).sample&.id : nil,
          resolved_at: end_time,
          resolution_note: is_resolved ? resolution_notes.sample : nil,
          created_at: start_time,
          updated_at: end_time || start_time
        }

        alerts << alert
      end

      current_time += 12.hours
    end

    TemperatureAlert.insert_all(alerts) if alerts.any?
    alerts.size
  end
end
