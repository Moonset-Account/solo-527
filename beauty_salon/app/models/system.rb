class System
  include Singleton

  def self.find(id)
    instance
  end

  def self.find_by_id(id)
    instance
  end

  def id
    0
  end

  def to_global_id
    GlobalID.new("gid://beauty_salon/System/0")
  end

  def name
    "System"
  end
end
