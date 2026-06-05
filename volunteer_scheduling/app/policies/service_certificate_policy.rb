class ServiceCertificatePolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.admin? || record.volunteer_profile.user == user
  end

  def create?
    user.admin?
  end

  def issue?
    user.admin?
  end

  def download?
    user.admin? || record.volunteer_profile.user == user
  end

  def revoke?
    user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      else
        scope.where(volunteer_profile: user.volunteer_profile)
      end
    end
  end
end
