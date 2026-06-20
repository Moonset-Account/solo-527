class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    user.present?
  end

  def new?
    create?
  end

  def update?
    user.executive_or_admin?
  end

  def edit?
    update?
  end

  def destroy?
    user.executive?
  end

  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      scope.all
    end

    private

    attr_reader :user, :scope
  end
end
