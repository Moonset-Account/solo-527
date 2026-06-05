class ImportJob < ApplicationJob
  queue_as :import_export

  def perform(job)
    job.start!

    begin
      result = case job.job_type
               when 'import_people'
                 import_people(job)
               when 'import_passes'
                 import_passes(job)
               else
                 raise "不支持的导入类型: #{job.job_type}"
               end

      job.complete!(success_count: result[:success], failed_count: result[:failed], error_messages: result[:errors].join("; "))
    rescue => e
      job.fail!(e.message)
      ErrorLog.log('error', "导入失败: #{e.message}", error_class: e.class.name, backtrace: e.backtrace, user: job.creator)
    end
  end

  private

  def import_people(job)
    spreadsheet = Roo::Spreadsheet.open(job.file_url)
    sheet = spreadsheet.sheet(0)
    headers = sheet.row(1)

    success = 0
    failed = 0
    errors = []

    (2..sheet.last_row).each do |row_num|
      row = sheet.row(row_num)
      data = Hash[headers.zip(row)]

      begin
        person = Person.find_or_initialize_by(id_card: data['身份证号'])
        person.assign_attributes(
          name: data['姓名'],
          gender: data['性别'],
          birth_date: data['出生日期'],
          phone: data['电话'],
          address: data['地址'],
          company: data['单位'],
          person_type: map_person_type(data['类型'])
        )

        if person.save
          success += 1
        else
          failed += 1
          errors << "第#{row_num}行: #{person.errors.full_messages.join(', ')}"
        end
      rescue => e
        failed += 1
        errors << "第#{row_num}行: #{e.message}"
      end
    end

    { success: success, failed: failed, errors: errors }
  end

  def import_passes(job)
    spreadsheet = Roo::Spreadsheet.open(job.file_url)
    sheet = spreadsheet.sheet(0)
    headers = sheet.row(1)

    success = 0
    failed = 0
    errors = []

    (2..sheet.last_row).each do |row_num|
      row = sheet.row(row_num)
      data = Hash[headers.zip(row)]

      begin
        person = Person.find_by(id_card: data['身份证号'])
        unless person
          failed += 1
          errors << "第#{row_num}行: 未找到对应人员"
          next
        end

        pass = Pass.new(
          person: person,
          pass_type: map_pass_type(data['类型']),
          valid_from: data['有效期开始'],
          valid_until: data['有效期结束'],
          purpose: data['用途'],
          creator: job.creator
        )

        if pass.save
          pass.approve! if data['状态'] == '已通过'
          success += 1
        else
          failed += 1
          errors << "第#{row_num}行: #{pass.errors.full_messages.join(', ')}"
        end
      rescue => e
        failed += 1
        errors << "第#{row_num}行: #{e.message}"
      end
    end

    { success: success, failed: failed, errors: errors }
  end

  def map_person_type(type_name)
    mapping = { '访客' => 'visitor', '工人' => 'worker', '承包商' => 'contractor', '供应商' => 'supplier', '其他' => 'other' }
    mapping[type_name] || 'other'
  end

  def map_pass_type(type_name)
    mapping = { '临时通行证' => 'temporary', '日常通行证' => 'daily', '长期通行证' => 'long_term', '特种作业通行证' => 'special' }
    mapping[type_name] || 'temporary'
  end
end
