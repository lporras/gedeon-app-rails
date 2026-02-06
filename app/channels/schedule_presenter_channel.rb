class SchedulePresenterChannel < ApplicationCable::Channel
  def subscribed
    stream_from "schedule_presenter_#{params[:schedule_id]}"
  end

  def unsubscribed
  end
end
