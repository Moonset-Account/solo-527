class ExportJob < ApplicationJob
  queue_as :import_export

  def perform(job)
    job.start!

    begin
      result = case job.job_type
               when 'export_people'
                 export_people(job)
               when 'export_passes'
                 export_passes(job)
               when 'export_violations'
                 export_violations(job)
               when 'export_gate_logs'
                 export_gate_logs(job)
               else
                 raise "不支持的导出类型: #{job.job_type}"
               end

      job.complete!(success_count: result[:count], error_messages: nil)
    rescue => e
      job.fail!(e.message)
      ErrorLog.log('error', "导出失败: #{e.message}", error_class: e.class.name, backtrace: e.backtrace, user: job.creator)
    end
  end

  private

  def export_people(job)
    people = Person.all.includes(:credentials)
    file_path = generate_excel('人员台账', people) do |p|
      [
        p.name, p.id_card, p.gender, p.birth_date, p.phone, p.address,
        p.company, p.person_type_name, p.blacklisted? ? '是' : '否', p.created_at
      ]
    end
    { count: people.count, file_path: file_path }
  end

  def export_passes(job)
    passes = Pass.all.includes(:person, :vehicle, :work_zones, :approvals)
    file_path = generate_excel('通行证台账', passes) do |p|
      [
        p.pass_number, p.person.name, p.vehicle&.plate_number, p.pass_type_name,
        p.status_name, p.work_zones.pluck(:name).join(','),
        p.valid_from, p.valid_until, p.is_frozen? ? '是' : '否', p.created_at
      ]
    end
    { count: passes.count, file_path: file_path }
  end

  def export_violations(job)
    violations = Violation.all.includes(:person, :vehicle, :work_zone, :reporter)
    file_path = generate_excel('违规记录', violations) do |v|
      [
        v.violation_type_name, v.description, v.person&.name, v.vehicle&.plate_number,
        v.work_zone&.name, v.violated_at, v.location, v.severity_name,
        v.status_name, v.reporter&.real_name
      ]
    end
    { count: violations.count, file_path: file_path }
  end

  def export_gate_logs(job)
    gate_logs = GateLog.all.includes(:person, :vehicle, :operator)
    file_path = generate_excel('门岗记录', gate_logs) do |g|
      [
        g.gate_name, g.action_name, g.result_name, g.person&.name, g.vehicle&.plate_number,
        g.logged_at, g.operator&.real_name, g.remark
      ]
    end
    { count: gate_logs.count, file_path: file_path }
  end

  def generate_excel(sheet_name, collection)
    require 'caxlsx'

    dir = Rails.root.join('storage', 'exports')
    FileUtils.mkdir_p(dir) unless Dir.exist?(dir)
    file_path = dir.join("#{sheet_name}_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx").to_s

    Axlsx::Package.new do |p|
      p.workbook.add_worksheet(name: sheet_name) do |sheet|
        headers = case sheet_name
                  when '人员台账'
                    %w[姓名 身份证号 性别 出生日期 电话 地址 单位 类型 黑名单 创建时间]
                  when '通行证台账'
                    %w[通行证号 人员 车牌号 类型 状态 区域 有效期开始 有效期结束 冻结 创建时间]
                  when '违规记录'
                    %w[违规类型 描述 人员 车辆 区域 违规时间 地点 严重程度 状态 上报人]
                  when '门岗记录'
                    %w[门岗 方向 结果 人员 车辆 时间 操作员 备注]
                  end
        sheet.add_row headers

        collection.each do |item|
          sheet.add_row yield(item)
        end
      end
      p.serialize(file_path)
    end

    file_path
  end
end
