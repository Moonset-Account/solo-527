class StudentDecorator < ApplicationDecorator
  def self.sensitive_fields
    %i[id_card_last_four emergency_contact_phone health_notes]
  end

  def id_card_last_four
    mask_sensitive(object.id_card_last_four)
  end

  def emergency_contact_phone
    mask_sensitive(object.emergency_contact_phone)
  end

  def health_notes
    mask_sensitive(object.health_notes)
  end

  def emergency_contact_name
    mask_sensitive(object.emergency_contact_name, visible: current_user&.school_teacher?)
  end

  def display_name
    if can_view_sensitive? || current_user&.school_teacher?
      object.name
    else
      object.name[0] + '同学'
    end
  end
end
