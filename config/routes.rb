Rails.application.routes.draw do
  devise_for :users

  root "home#index"

  resources :courses, only: [:index, :show] do
    post "enroll", on: :member
    resources :course_enrollments, only: [:index, :create]
  end

  resources :course_enrollments, only: [:index, :show, :destroy] do
    post "cancel", on: :member
    resources :leave_requests, only: [:new, :create]
  end

  resources :leave_requests, only: [:index, :show]

  resources :events, only: [:index, :show] do
    post "register", on: :member
  end

  resources :event_registrations, only: [:index, :show] do
    post "cancel", on: :member
  end

  resources :venues, only: [:index, :show]

  resources :venue_bookings, only: [:index, :show, :new, :create, :destroy] do
    post "cancel", on: :member
  end

  resources :check_ins, only: [:index, :show]

  resources :payments, only: [:index, :show]

  resources :batch_jobs, only: [:index, :show]

  namespace :admin do
    get "dashboard", to: "dashboard#index"

    resources :courses do
      post "export", on: :collection
      post "activate", on: :member
      post "deactivate", on: :member
      post "export_enrollments", on: :member
    end

    resources :course_enrollments do
      post "confirm", on: :member
      post "cancel", on: :member
      post "export", on: :collection
    end

    resources :leave_requests do
      post "approve", on: :member
      post "reject", on: :member
    end

    resources :events do
      post "generate_schedules", on: :member
      post "export_registrations", on: :member
    end

    resources :event_registrations do
      post "confirm", on: :member
      post "cancel", on: :member
    end

    resources :schedules do
      post "start", on: :member
      post "complete", on: :member
      post "cancel", on: :member
    end

    resources :results do
      post "confirm", on: :member
      post "disqualify", on: :member
    end

    resources :check_ins do
      post "check_in", on: :member
      post "bulk_check_in", on: :collection
      post "export", on: :collection
    end

    resources :payments do
      post "retry", on: :member
      post "retry_failed", on: :collection
      post "mark_paid", on: :member
      post "refund", on: :member
      post "export", on: :collection
    end

    resources :venues
    resources :venue_bookings

    resources :users

    resources :batch_jobs, only: [:index, :show, :destroy] do
      post "cancel", on: :member
    end

    get "reports/fill_rate", to: "reports#fill_rate"
    post "reports/generate_fill_rate", to: "reports#generate_fill_rate"
    post "reports/export_fill_rate", to: "reports#export_fill_rate"

    get "audit_logs", to: "audit_logs#index"
  end
end
