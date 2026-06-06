package models

import (
	"time"
)

type UserRole string

const (
	RoleAdmin     UserRole = "admin"
	RoleDispatcher UserRole = "dispatcher"
	RoleNurse     UserRole = "nurse"
)

type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"-"`
	Role      UserRole  `json:"role"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	SiteID    *string   `json:"site_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type BoxStatus string

const (
	BoxStatusIdle       BoxStatus = "idle"
	BoxStatusInTransit  BoxStatus = "in_transit"
	BoxStatusArrived    BoxStatus = "arrived"
	BoxStatusSigned     BoxStatus = "signed"
	BoxStatusException  BoxStatus = "exception"
	BoxStatusReturned   BoxStatus = "returned"
	BoxStatusLocked     BoxStatus = "locked"
)

type Box struct {
	ID           string    `json:"id"`
	BoxNumber    string    `json:"box_number"`
	ThermometerID string   `json:"thermometer_id"`
	Status       BoxStatus `json:"status"`
	VaccineType  string    `json:"vaccine_type"`
	VaccineCount int       `json:"vaccine_count"`
	CurrentTaskID *string  `json:"current_task_id,omitempty"`
	Temperature  *float64  `json:"temperature,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Site struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Phone     string    `json:"phone"`
	Contact   string    `json:"contact"`
	CreatedAt time.Time `json:"created_at"`
}

type Route struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	SiteIDs   []string  `json:"site_ids"`
	Order     int       `json:"order"`
	CreatedAt time.Time `json:"created_at"`
}

type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "pending"
	TaskStatusInTransit  TaskStatus = "in_transit"
	TaskStatusArrived    TaskStatus = "arrived"
	TaskStatusSigned     TaskStatus = "signed"
	TaskStatusReturned   TaskStatus = "returned"
	TaskStatusException  TaskStatus = "exception"
	TaskStatusReviewing  TaskStatus = "reviewing"
	TaskStatusCompleted  TaskStatus = "completed"
)

type Task struct {
	ID            string     `json:"id"`
	BoxID         string     `json:"box_id"`
	BoxNumber     string     `json:"box_number"`
	RouteID       string     `json:"route_id"`
	RouteName     string     `json:"route_name"`
	SiteID        string     `json:"site_id"`
	SiteName      string     `json:"site_name"`
	DispatcherID  string     `json:"dispatcher_id"`
	DispatcherName string    `json:"dispatcher_name"`
	NurseID       *string    `json:"nurse_id,omitempty"`
	NurseName     *string    `json:"nurse_name,omitempty"`
	Status        TaskStatus `json:"status"`
	ExpectedArrival *time.Time `json:"expected_arrival,omitempty"`
	ActualArrival *time.Time `json:"actual_arrival,omitempty"`
	SignedAt      *time.Time `json:"signed_at,omitempty"`
	ReturnReason  *string    `json:"return_reason,omitempty"`
	ExceptionNote *string    `json:"exception_note,omitempty"`
	TemperatureOK *bool      `json:"temperature_ok,omitempty"`
	Reviewed      bool       `json:"reviewed"`
	ReviewedBy    *string    `json:"reviewed_by,omitempty"`
	ReviewedAt    *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type TemperatureRecord struct {
	ID          string    `json:"id"`
	BoxID       string    `json:"box_id"`
	TaskID      string    `json:"task_id"`
	Temperature float64   `json:"temperature"`
	RecordedAt  time.Time `json:"recorded_at"`
	RecordedBy  string    `json:"recorded_by"`
	Attachment  *string   `json:"attachment,omitempty"`
	IsNormal    bool      `json:"is_normal"`
	Note        *string   `json:"note,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type ExceptionRecord struct {
	ID          string     `json:"id"`
	TaskID      string     `json:"task_id"`
	BoxID       string     `json:"box_id"`
	Type        string     `json:"type"`
	Description string     `json:"description"`
	Temperature *float64   `json:"temperature,omitempty"`
	ReportedBy  string     `json:"reported_by"`
	Resolved    bool       `json:"resolved"`
	ResolvedBy  *string    `json:"resolved_by,omitempty"`
	ResolvedAt  *time.Time `json:"resolved_at,omitempty"`
	Resolution  *string    `json:"resolution,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type SMSNotification struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"task_id"`
	Phone     string    `json:"phone"`
	Message   string    `json:"message"`
	Type      string    `json:"type"`
	SentAt    *time.Time `json:"sent_at,omitempty"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateTaskRequest struct {
	BoxNumber       string    `json:"box_number"`
	ThermometerID   string    `json:"thermometer_id"`
	RouteID         string    `json:"route_id"`
	SiteID          string    `json:"site_id"`
	VaccineType     string    `json:"vaccine_type"`
	VaccineCount    int       `json:"vaccine_count"`
	ExpectedArrival *time.Time `json:"expected_arrival,omitempty"`
}

type SignTaskRequest struct {
	Temperature float64 `json:"temperature"`
	Attachment  string  `json:"attachment"`
	Note        string  `json:"note"`
}

type ReturnTaskRequest struct {
	Reason string `json:"reason"`
}

type ReviewTaskRequest struct {
	Approved  bool   `json:"approved"`
	Note      string `json:"note"`
}

type TaskFilter struct {
	Status     *TaskStatus `json:"status"`
	SiteID     *string     `json:"site_id"`
	BoxNumber  *string     `json:"box_number"`
	StartDate  *time.Time  `json:"start_date"`
	EndDate    *time.Time  `json:"end_date"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
}

type PagedResponse struct {
	Data     interface{} `json:"data"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}
