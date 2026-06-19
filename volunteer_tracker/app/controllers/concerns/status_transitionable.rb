module StatusTransitionable
  extend ActiveSupport::Concern

  private

  def transition_status!(record, new_status, turbo_stream: true)
    record.update!(status: new_status)
    return unless turbo_stream

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_back fallback_location: root_path, notice: "#{record.class.name} status updated to #{new_status}." }
    end
  end
end
