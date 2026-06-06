#!/usr/bin/env ruby
# 手动执行迁移脚本
# 运行: bundle exec rails runner script/setup_db.rb

puts "开始设置数据库..."

# 添加 school_id 到 users
begin
  unless column_exists?(:users, :school_id)
    ActiveRecord::Base.connection.add_reference :users, :school, null: true
    puts "✓ 添加 school_id 到 users 表"
  else
    puts "✓ users.school_id 已存在"
  end
rescue => e
  puts "⚠️  users.school_id: #{e.message}"
end

# 创建 exports 表
begin
  unless table_exists?(:exports)
    ActiveRecord::Base.connection.create_table :exports do |t|
      t.bigint :user_id, null: false
      t.string :export_type, null: false
      t.string :status, null: false, default: 'pending'
      t.string :filename
      t.string :file_path
      t.bigint :file_size
      t.jsonb :filters, default: {}
      t.text :error_message
      t.timestamps
    end
    ActiveRecord::Base.connection.add_index :exports, :user_id
    ActiveRecord::Base.connection.add_index :exports, :status
    ActiveRecord::Base.connection.add_index :exports, :export_type
    puts "✓ 创建 exports 表"
  else
    puts "✓ exports 表已存在"
  end
rescue => e
  puts "⚠️  exports 表: #{e.message}"
end

puts "\n数据库设置完成！"
