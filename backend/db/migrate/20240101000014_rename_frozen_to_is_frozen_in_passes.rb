class RenameFrozenToIsFrozenInPasses < ActiveRecord::Migration[8.0]
  def change
    rename_column :passes, :frozen, :is_frozen
  end
end
