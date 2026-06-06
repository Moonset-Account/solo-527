package models

import "time"

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"password,omitempty"`
	Role      string    `json:"role"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
}

type ConstructionTeam struct {
	ID                int       `json:"id"`
	Name              string    `json:"name"`
	LeaderName        string    `json:"leader_name"`
	LeaderPhone       string    `json:"leader_phone"`
	LicenseNumber     string    `json:"license_number"`
	ViolationCount    int       `json:"violation_count"`
	NeedsManualReview bool      `json:"needs_manual_review"`
	CreatedAt         time.Time `json:"created_at"`
}

type Application struct {
	ID               int        `json:"id"`
	ApplicationNo    string     `json:"application_no"`
	OwnerName        string     `json:"owner_name"`
	OwnerPhone       string     `json:"owner_phone"`
	Building         string     `json:"building"`
	Unit             string     `json:"unit"`
	Room             string     `json:"room"`
	TeamID           int        `json:"team_id"`
	TeamName         string     `json:"team_name,omitempty"`
	WorkTypes        string     `json:"work_types"`
	MaterialEntryTime *time.Time `json:"material_entry_time"`
	StartDate        string     `json:"start_date"`
	EndDate          string     `json:"end_date"`
	HasNoiseWork     bool       `json:"has_noise_work"`
	NoiseTimeSlots   string     `json:"noise_time_slots"`
	Status           string     `json:"status"`
	ReviewerID       int        `json:"reviewer_id"`
	ReviewerName     string     `json:"reviewer_name,omitempty"`
	ReviewComment    string     `json:"review_comment"`
	ReviewedAt       *time.Time `json:"reviewed_at"`
	QRCode           string     `json:"qr_code"`
	CreatedBy        int        `json:"created_by"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type Violation struct {
	ID             int       `json:"id"`
	ApplicationID  int       `json:"application_id"`
	ApplicationNo  string    `json:"application_no,omitempty"`
	TeamID         int       `json:"team_id"`
	TeamName       string    `json:"team_name,omitempty"`
	ViolationType  string    `json:"violation_type"`
	Description    string    `json:"description"`
	ViolationTime  time.Time `json:"violation_time"`
	ReportedBy     int       `json:"reported_by"`
	ReportedByName string    `json:"reported_by_name,omitempty"`
	Status         string    `json:"status"`
	HandledBy      int       `json:"handled_by"`
	HandleComment  string    `json:"handle_comment"`
	HandledAt      time.Time `json:"handled_at"`
}

type GateVerification struct {
	ID            int       `json:"id"`
	ApplicationID int       `json:"application_id"`
	QRCode        string    `json:"qr_code"`
	VerifiedAt    time.Time `json:"verified_at"`
	VerifierID    int       `json:"verifier_id"`
	Result        string    `json:"result"`
	Detail        string    `json:"detail"`
}

type Notification struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Type        string    `json:"type"`
	IsRead      bool      `json:"is_read"`
	RelatedID   int       `json:"related_id"`
	RelatedType string    `json:"related_type"`
	CreatedAt   time.Time `json:"created_at"`
}

type AuditLog struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	UserName  string    `json:"user_name,omitempty"`
	Action    string    `json:"action"`
	Module    string    `json:"module"`
	Detail    string    `json:"detail"`
	IPAddress string    `json:"ip_address"`
	CreatedAt time.Time `json:"created_at"`
}

type Holiday struct {
	ID                int    `json:"id"`
	Name              string `json:"name"`
	Date              string `json:"date"`
	IsNoiseProhibited bool   `json:"is_noise_prohibited"`
}

type TimeSlot struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	StartTime      string `json:"start_time"`
	EndTime        string `json:"end_time"`
	IsNoiseAllowed bool   `json:"is_noise_allowed"`
	DayType        string `json:"day_type"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type ApplicationQuery struct {
	Status   string `json:"status"`
	Building string `json:"building"`
	Keyword  string `json:"keyword"`
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
}

type VerifyQRRequest struct {
	QRCode string `json:"qr_code"`
}

type ReviewRequest struct {
	Status  string `json:"status"`
	Comment string `json:"comment"`
}

type ViolationHandleRequest struct {
	Comment string `json:"comment"`
}
