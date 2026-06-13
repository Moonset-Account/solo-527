require "csv"

User.transaction do
  admin = User.find_or_create_by!(email: "admin@factory.com") do |u|
    u.password = "password123"
    u.password_confirmation = "password123"
    u.name = "系统管理员"
    u.phone = "13800000001"
    u.role = :admin
  end
  puts "Created admin user: #{admin.email}"

  director = User.find_or_create_by!(email: "director@factory.com") do |u|
    u.password = "password123"
    u.password_confirmation = "password123"
    u.name = "张主任"
    u.phone = "13800000002"
    u.role = :shop_director
  end
  puts "Created shop director: #{director.email}"

  inspector = User.find_or_create_by!(email: "inspector@factory.com") do |u|
    u.password = "password123"
    u.password_confirmation = "password123"
    u.name = "李质检"
    u.phone = "13800000003"
    u.role = :shop_director
  end
  puts "Created inspector: #{inspector.email}"
end

Equipment.transaction do
  equipments_data = [
    { code: "CNC-001", name: "CNC加工中心1号", equipment_type: "CNC加工中心", status: :available, location: "A区-01", standard_output_per_hour: 80 },
    { code: "CNC-002", name: "CNC加工中心2号", equipment_type: "CNC加工中心", status: :running, location: "A区-02", standard_output_per_hour: 80 },
    { code: "CNC-003", name: "CNC加工中心3号", equipment_type: "CNC加工中心", status: :maintenance, location: "A区-03", standard_output_per_hour: 75 },
    { code: "INJ-001", name: "注塑机1号", equipment_type: "注塑机", status: :available, location: "B区-01", standard_output_per_hour: 200 },
    { code: "INJ-002", name: "注塑机2号", equipment_type: "注塑机", status: :running, location: "B区-02", standard_output_per_hour: 180 },
    { code: "LAT-001", name: "车床1号", equipment_type: "车床", status: :available, location: "C区-01", standard_output_per_hour: 60 },
    { code: "LAT-002", name: "车床2号", equipment_type: "车床", status: :down, location: "C区-02", standard_output_per_hour: 55 },
    { code: "POL-001", name: "抛光机1号", equipment_type: "抛光机", status: :available, location: "D区-01", standard_output_per_hour: 120 }
  ]

  equipments_data.each do |eq_data|
    eq = Equipment.find_or_create_by!(code: eq_data[:code]) do |e|
      e.assign_attributes(eq_data)
      e.purchase_date = Date.today - rand(365..1095).days
      e.last_maintenance_date = Date.today - rand(7..90).days
    end
    puts "Created equipment: #{eq.code} - #{eq.name}"
  end
end

Team.transaction do
  teams_data = [
    { code: "T-A1", name: "A区一班", leader_name: "王班长", member_count: 8, shift: :morning },
    { code: "T-A2", name: "A区二班", leader_name: "刘班长", member_count: 7, shift: :afternoon },
    { code: "T-A3", name: "A区三班", leader_name: "陈班长", member_count: 6, shift: :night },
    { code: "T-B1", name: "B区一班", leader_name: "赵班长", member_count: 10, shift: :morning },
    { code: "T-B2", name: "B区二班", leader_name: "孙班长", member_count: 9, shift: :afternoon },
    { code: "T-C1", name: "C区一班", leader_name: "周班长", member_count: 5, shift: :morning },
    { code: "T-D1", name: "D区一班", leader_name: "吴班长", member_count: 4, shift: :morning }
  ]

  teams_data.each do |team_data|
    team = Team.find_or_create_by!(code: team_data[:code]) do |t|
      t.assign_attributes(team_data)
    end
    puts "Created team: #{team.code} - #{team.name}"
  end
end

Mold.transaction do
  molds_data = [
    { code: "MOLD-001", name: "外壳模具A型", material: "SKD11", max_shots: 500000, current_shots: 125000, status: :available },
    { code: "MOLD-002", name: "外壳模具B型", material: "SKD11", max_shots: 500000, current_shots: 380000, status: :in_use },
    { code: "MOLD-003", name: "内衬模具", material: "S136", max_shots: 300000, current_shots: 45000, status: :available },
    { code: "MOLD-004", name: "底座模具", material: "P20", max_shots: 200000, current_shots: 198000, status: :maintenance },
    { code: "MOLD-005", name: "盖板模具", material: "S136", max_shots: 400000, current_shots: 2000, status: :available },
    { code: "MOLD-006", name: "齿轮模具", material: "SKD61", max_shots: 1000000, current_shots: 650000, status: :in_use }
  ]

  molds_data.each do |mold_data|
    mold = Mold.find_or_create_by!(code: mold_data[:code]) do |m|
      m.assign_attributes(mold_data)
      m.total_shots = m.current_shots
      m.maintenance_date = Date.today - rand(1..180).days if [:in_use, :maintenance, :available].include?(mold_data[:status].to_sym)
    end
    puts "Created mold: #{mold.code} - #{mold.name}"
  end
end

WorkOrder.transaction do
  products = [
    { name: "精密铝合金外壳", customer: "华为技术", qty_range: (100..500) },
    { name: "塑料内衬组件", customer: "小米科技", qty_range: (500..2000) },
    { name: "不锈钢底座", customer: "OPPO广东", qty_range: (200..800) },
    { name: "透明PC盖板", customer: "vivo通信", qty_range: (300..1000) },
    { name: "精密齿轮组", customer: "大疆创新", qty_range: (50..300) },
    { name: "散热片组件", customer: "中兴通讯", qty_range: (150..600) }
  ]

  priorities = [:low, :medium, :high, :urgent]
  statuses = [:pending, :in_progress, :completed, :on_hold]

  15.times do |i|
    product = products[i % products.size]
    order_no = "WO#{Date.today.strftime('%Y%m%d')}#{format('%04d', i + 1)}"
    quantity = rand(product[:qty_range])
    start_date = Date.today + rand(-5..2).days
    end_date = start_date + rand(3..10).days

    work_order = WorkOrder.find_or_create_by!(order_no: order_no) do |wo|
      wo.product_name = product[:name]
      wo.customer = product[:customer]
      wo.quantity = quantity
      wo.planned_start_date = start_date
      wo.planned_end_date = end_date
      wo.status = statuses[i % statuses.size]
      wo.priority = priorities[i % priorities.size]
      wo.notes = "#{product[:name]}小批量生产订单，客户要求#{end_date.strftime('%m月%d日')}前完成。"
    end

    step_names = case work_order.product_name
                 when /外壳/ then ["原材料检验", "CNC粗加工", "CNC精加工", "表面处理", "成品检验", "包装入库"]
                 when /内衬/ then ["原材料检验", "注塑成型", "毛边处理", "尺寸检验", "包装入库"]
                 when /底座/ then ["原材料检验", "车床加工", "钻孔攻牙", "抛光处理", "成品检验", "包装入库"]
                 when /盖板/ then ["原材料检验", "注塑成型", "UV喷涂", "外观检验", "包装入库"]
                 when /齿轮/ then ["原材料检验", "滚齿加工", "热处理", "磨齿加工", "精度检验", "包装入库"]
                 when /散热片/ then ["原材料检验", "冲压成型", "铲齿加工", "表面阳极", "成品检验", "包装入库"]
                 else ["下料", "加工", "检验", "包装"]
                 end

    if work_order.process_steps.none?
      step_names.each_with_index do |step_name, idx|
        step = work_order.process_steps.create!(
          name: step_name,
          sequence: idx + 1,
          status: if work_order.pending?
                    :not_started
                  elsif work_order.completed?
                    :completed
                  elsif idx < (step_names.size / 2)
                    :completed
                  elsif idx == (step_names.size / 2)
                    [:in_progress, :quality_check, :paused].sample
                  else
                    :not_started
                  end,
          assigned_team: Team.all.sample,
          assigned_equipment: Equipment.where(status: [:available, :running]).sample,
          mold: work_order.product_name.match?(/外壳|内衬|盖板/) ? Mold.where(status: [:available, :in_use]).sample : nil
        )

        if step.completed? || step.quality_check? || (step.in_progress? && rand > 0.5)
          step.started_at = Time.current - rand(1..48).hours
          step.completed_at = step.started_at + rand(2..12).hours if step.completed?
          step.actual_quantity = (work_order.quantity * rand(0.85..1.0)).to_i
          step.defect_quantity = (step.actual_quantity * rand(0..0.05)).to_i
          step.save!

          if step.completed?
            duration = (step.completed_at - step.started_at) / 1.hour
            standard = step.assigned_equipment&.standard_output_per_hour || 50
            actual_per_hour = duration > 0 ? (step.actual_quantity / duration).round(2) : 0
            efficiency = standard > 0 ? (actual_per_hour / standard * 100).round(2) : 0

            ProcessEfficiency.create!(
              process_step: step,
              equipment: step.assigned_equipment,
              team: step.assigned_team,
              mold: step.mold,
              standard_output_per_hour: standard,
              actual_output_per_hour: actual_per_hour,
              duration_hours: duration.round(2),
              efficiency_rate: efficiency
            )
          end
        end

        if step.completed? && rand > 0.3
          QualityInspection.create!(
            process_step: step,
            inspector: User.where(role: [:admin, :shop_director]).sample,
            result: rand > 0.15 ? :pass : [:fail, :rework].sample,
            defect_quantity: step.defect_quantity,
            defect_type: ["尺寸超差", "表面划伤", "色差", "变形", "毛刺"].sample,
            inspection_time: step.completed_at + rand(10..120).minutes,
            notes: rand > 0.5 ? "首检合格，过程稳定" : nil
          )
        end
      end
    end

    puts "Created work order: #{work_order.order_no} - #{work_order.product_name} (#{work_order.status})"
  end
end

FailedBatch.transaction do
  if FailedBatch.count.zero?
    3.times do |i|
      wo = WorkOrder.all.sample
      step = wo.process_steps.sample
      FailedBatch.create!(
        batch_no: "BATCH-#{format('%06d', i + 1)}",
        work_order: wo,
        process_step: step,
        payload: { work_order_id: wo.id, process_step_id: step&.id, action: "sync", timestamp: Time.current.iso8601 }.to_json,
        error_message: ["外部接口连接超时", "ERP系统响应异常", "数据校验失败"].sample,
        retry_count: i,
        status: i == 0 ? :pending : i == 1 ? :processing : :pending
      )
      puts "Created failed batch: #{FailedBatch.last.batch_no}"
    end
  end
end

puts "\n=== Seed data creation completed ==="
puts "Admin login: admin@factory.com / password123"
puts "Director login: director@factory.com / password123"
