class CreateTeacherSettlements < ActiveRecord::Migration[8.0]
  def change
    create_table :teacher_settlements do |t|
      t.string :settlement_no, null: false, index: { unique: true }
      t.references :teacher, null: false, foreign_key: true
      t.date :period_start, null: false
      t.date :period_end, null: false
      t.integer :total_sessions, null: false, default: 0
      t.integer :total_students, null: false, default: 0
      t.decimal :base_amount, precision: 10, scale: 2, null: false, default: 0
      t.decimal :bonus_amount, precision: 10, scale: 2, null: false, default: 0
      t.decimal :deduction_amount, precision: 10, scale: 2, null: false, default: 0
      t.decimal :total_amount, precision: 10, scale: 2, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.references :approved_by, foreign_key: { to_table: :users }
      t.datetime :approved_at
      t.datetime :paid_at
      t.text :notes
      t.jsonb :details, default: []
      t.timestamps
    end
    add_index :teacher_settlements, [:teacher_id, :period_start, :period_end], name: 'idx_settlements_teacher_period'
  end
end
