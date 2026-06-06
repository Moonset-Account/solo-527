Rails.application.routes.draw do
  devise_for :users

  namespace :api do
    namespace :v1 do
      resource :dashboard, only: [] do
        get :overview
        get :guide_utilization
        get :session_occupancy
        get :bottlenecks
        post :exports, to: 'exports#create'
      end

      resources :exports, only: %i[index show create] do
        member do
          get :download
        end
      end

      resources :courses do
        resources :course_sessions, only: %i[index create]
        member do
          post :publish
          post :archive
        end
      end

      resources :course_sessions, except: %i[create] do
        member do
          post :start
          post :complete
          post :cancel
        end
        resources :guide_assignments, only: %i[index create]
      end

      resources :bookings do
        member do
          post :confirm
          post :cancel
          get :students
          post :check_in
        end
      end

      resources :students
      resources :guides do
        member do
          get :assignments
          get :schedule
        end
      end

      resources :schools
      resources :teaching_aids
      resources :feedbacks, only: %i[index show create]

      resources :guide_assignments, only: %i[show update destroy] do
        collection do
          get :available_guides
        end
        member do
          post :complete
          post :cancel
        end
      end
    end
  end
end
