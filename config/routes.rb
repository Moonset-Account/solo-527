Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"

  devise_for :users

  namespace :admin do
    resources :users
    resources :vehicles
    resources :settlements do
      member do
        get :generate
        post :approve
        post :pay
      end
    end
    resources :claims do
      member do
        get :handle
        post :approve
        post :reject
      end
    end
    resources :operation_logs, only: [:index]
    resources :driver_assignments, only: [:index, :new, :create]
    get 'reports/driver_workload' => 'reports#driver_workload'
    get 'reports/temperature_safety' => 'reports#temperature_safety'
  end

  resources :vehicles, only: [:index, :show] do
    member do
      get :temperature_history
      get :track_playback
    end
  end
  resources :temperature_records, only: [:index]
  resources :location_records, only: [:index]
  resources :claims, only: [:index, :show, :new, :create]
  resources :settlements, only: [:index, :show]
  resources :operation_logs, only: [:index]
end
